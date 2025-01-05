import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Callout from "@/CAREUI/display/Callout";
import CareIcon from "@/CAREUI/icons/CareIcon";
import WeekdayCheckbox from "@/CAREUI/interactive/WeekdayCheckbox";
import { DayOfWeekValue } from "@/CAREUI/interactive/WeekdayCheckbox";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { ScheduleAPIs } from "@/components/Schedule/api";
import {
  getSlotsPerSession,
  getTokenDuration,
} from "@/components/Schedule/helpers";
import { ScheduleSlotTypes } from "@/components/Schedule/types";

import useSlug from "@/hooks/useSlug";

import mutate from "@/Utils/request/mutate";
import { Time } from "@/Utils/types";
import { dateQueryString } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

const formSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  valid_from: z.date({
    required_error: "Valid from date is required",
  }),
  valid_to: z.date({
    required_error: "Valid to date is required",
  }),
  weekdays: z
    .array(z.number() as unknown as z.ZodType<DayOfWeekValue>)
    .min(1, "At least one weekday is required"),
  availabilities: z
    .array(
      z.object({
        name: z.string().min(1, "Session name is required"),
        slot_type: z.enum(ScheduleSlotTypes),
        reason: z.string(),
        start_time: z
          .string()
          .min(1, "Start time is required") as unknown as z.ZodType<Time>,
        end_time: z
          .string()
          .min(1, "End time is required") as unknown as z.ZodType<Time>,
        slot_size_in_minutes: z.number().min(1, "Must be greater than 0"),
        tokens_per_slot: z.number().min(1, "Must be greater than 0"),
      }),
    )
    .min(1, "At least one session is required"),
});

interface Props {
  onRefresh?: () => void;
  user: UserBase;
}

export default function ScheduleTemplateForm({ user, onRefresh }: Props) {
  const facilityId = useSlug("facility");
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      valid_from: undefined,
      valid_to: undefined,
      weekdays: [],
      availabilities: [
        {
          name: "",
          slot_type: undefined,
          reason: "",
          start_time: undefined,
          end_time: undefined,
          tokens_per_slot: 0,
          slot_size_in_minutes: 0,
        },
      ],
    },
  });

  const {
    mutate: createTemplate,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: mutate(ScheduleAPIs.templates.create, {
      pathParams: { facility_id: facilityId },
    }),
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success("Schedule template created successfully");
      setOpen(false);
      form.reset();
      onRefresh?.();
    }
  }, [isSuccess]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    createTemplate({
      valid_from: dateQueryString(values.valid_from),
      valid_to: dateQueryString(values.valid_to),
      name: values.name,
      user: user.id as unknown as string,
      availabilities: values.availabilities.map((availability) => ({
        name: availability.name,
        slot_type: availability.slot_type,
        slot_size_in_minutes: availability.slot_size_in_minutes,
        tokens_per_slot: availability.tokens_per_slot,
        reason: availability.reason,
        availability: values.weekdays.map((day) => ({
          day_of_week: day,
          start_time: availability.start_time,
          end_time: availability.end_time,
        })),
      })),
    });
  }

  const timeAllocationCallout = (index: number) => {
    const startTime = form.watch(`availabilities.${index}.start_time`);
    const endTime = form.watch(`availabilities.${index}.end_time`);
    const slotSizeInMinutes = form.watch(
      `availabilities.${index}.slot_size_in_minutes`,
    );
    const tokensPerSlot = form.watch(`availabilities.${index}.tokens_per_slot`);

    if (!startTime || !endTime || !slotSizeInMinutes || !tokensPerSlot) {
      return null;
    }

    const slotsPerSession = getSlotsPerSession(
      startTime,
      endTime,
      slotSizeInMinutes,
    );
    const tokenDuration = getTokenDuration(slotSizeInMinutes, tokensPerSlot);

    if (!slotsPerSession || !tokenDuration) return null;

    return (
      <Callout variant="alert" badge="Info">
        Allocating <strong>{Math.floor(slotsPerSession)} slots</strong> in this
        session provides approximately{" "}
        <strong>{tokenDuration.toFixed(1).replace(".0", "")} mins.</strong> for
        each patient.
      </Callout>
    );
  };

  console.log(form.formState.errors);
  console.log(form.formState);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="primary" disabled={isPending}>
          Create Template
        </Button>
      </SheetTrigger>
      <SheetContent className="flex min-w-full flex-col bg-gray-100 sm:min-w-[45rem]">
        <SheetHeader>
          <SheetTitle>Create Schedule Template</SheetTitle>
        </SheetHeader>

        <div className="-mx-6 mb-16 overflow-auto px-6 pb-16 pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Template Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Regular OP Day" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="valid_from"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel required>Valid From</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={(date) => field.onChange(date)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="valid_to"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel required>Valid Till</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={(date) => field.onChange(date)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel className="text-lg font-semibold">
                  Weekly Schedule
                </FormLabel>
                <span className="block text-sm">
                  Select the weekdays for applying the{" "}
                  <strong className="font-medium">Regular OP Day</strong>{" "}
                  template to schedule appointments
                </span>
                <div className="py-2">
                  <FormField
                    control={form.control}
                    name="weekdays"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <WeekdayCheckbox
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {form.watch("availabilities")?.map((_, index) => (
                  <div
                    key={index}
                    className="flex flex-col rounded-lg bg-white p-4 shadow"
                  >
                    <div className="flex items-center justify-between pb-6">
                      <div className="flex items-center gap-2">
                        <CareIcon
                          icon="l-clock"
                          className="text-lg text-blue-600"
                        />
                        <span className="font-semibold">
                          {form.watch(`availabilities.${index}.name`) ||
                            "Untitled Session"}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                        onClick={() => {
                          const availabilities =
                            form.getValues("availabilities");
                          availabilities.splice(index, 1);
                          form.setValue("availabilities", availabilities);
                        }}
                      >
                        <CareIcon icon="l-trash" className="text-base" />
                        <span className="ml-2">Remove</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.name`}
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel required>Session Title</FormLabel>
                            <FormControl>
                              <Input placeholder="IP Rounds" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.slot_type`}
                        render={({ field }) => (
                          <FormItem className="space-y-3 col-span-2 md:col-span-1">
                            <FormLabel required>Appointment Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex space-x-4"
                              >
                                {ScheduleSlotTypes.map((type) => (
                                  <div
                                    key={type}
                                    className="flex items-center space-x-2"
                                  >
                                    <RadioGroupItem
                                      value={type}
                                      id={`slot-type-${type}-${index}`}
                                    />
                                    <label
                                      htmlFor={`slot-type-${type}-${index}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                      {t(`SCHEDULE_SLOT_TYPE__${type}`)}
                                    </label>
                                  </div>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.start_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.end_time`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel required>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center gap-4 col-span-2 md:col-span-1">
                        <FormField
                          control={form.control}
                          name={`availabilities.${index}.slot_size_in_minutes`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel required>Slot size (mins.)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="e.g. 10"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`availabilities.${index}.tokens_per_slot`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel required>Tokens per Slot</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={0}
                                  placeholder="e.g. 1"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(e.target.valueAsNumber)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      {timeAllocationCallout(index)}
                    </div>

                    <div className="mt-4">
                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.reason`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Enter remarks for this session"
                                className="resize-none"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                ))}
                {form.formState.errors.availabilities && (
                  <FormMessage>
                    {form.formState.errors.availabilities.root?.message}
                  </FormMessage>
                )}
              </div>

              <Button
                type="button"
                variant="outline_primary"
                onClick={() => {
                  const availabilities = form.getValues("availabilities");
                  form.setValue("availabilities", [
                    ...availabilities,
                    {
                      name: "",
                      slot_type: "open",
                      reason: "",
                      start_time: "00:00",
                      end_time: "00:00",
                      tokens_per_slot: 0,
                      slot_size_in_minutes: 0,
                    },
                  ]);
                }}
              >
                <CareIcon icon="l-plus" className="text-lg" />
                <span>Add another Session</span>
              </Button>

              <SheetFooter className="absolute inset-x-0 bottom-0 border-t bg-white p-6">
                <SheetClose asChild>
                  <Button variant="outline" type="button" disabled={isPending}>
                    Cancel
                  </Button>
                </SheetClose>

                <Button variant="primary" type="submit" disabled={isPending}>
                  {isPending ? "Saving..." : "Save & Generate Slots"}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
