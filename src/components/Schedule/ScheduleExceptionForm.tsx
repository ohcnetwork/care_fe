import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Callout from "@/CAREUI/display/Callout";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { ScheduleAPIs } from "@/components/Schedule/api";
import { ScheduleSlotTypes } from "@/components/Schedule/types";
import { UserModel } from "@/components/Users/models";

import useMutation from "@/Utils/request/useMutation";
import { Time } from "@/Utils/types";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  is_available: z.boolean(),
  slot_type: z.enum(ScheduleSlotTypes).optional(),
  from_date: z.date({ required_error: "From date is required" }),
  to_date: z.date({ required_error: "To date is required" }),
  unavailable_all_day: z.boolean(),
  start_time: z
    .string()
    .min(1, "Start time is required") as unknown as z.ZodType<Time>,
  end_time: z
    .string()
    .min(1, "End time is required") as unknown as z.ZodType<Time>,
  reason: z.string().optional(),
  tokens_allowed: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onRefresh?: () => void;
  user: UserModel;
}

export default function ScheduleExceptionForm({ user, onRefresh }: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      is_available: false,
      from_date: undefined,
      to_date: undefined,
      unavailable_all_day: false,
      start_time: undefined,
      end_time: undefined,
      reason: "",
      tokens_allowed: undefined,
    },
  });

  const { mutate, isProcessing } = useMutation(ScheduleAPIs.exceptions.create, {
    pathParams: {
      facility_id: user.home_facility_object!.id!,
    },
  });

  const isAvailable = form.watch("is_available");
  const isAllDay = form.watch("unavailable_all_day");

  useEffect(() => {
    if (isAllDay) {
      form.setValue("start_time", "00:00");
      form.setValue("end_time", "23:59");
    } else {
      form.resetField("start_time");
      form.resetField("end_time");
    }
  }, [isAllDay, form]);

  async function onSubmit(data: FormValues) {
    toast.promise(
      mutate({
        body: {
          doctor_username: user.username,
          name: data.name,
          is_available: data.is_available,
          valid_from: data.from_date.toISOString().split("T")[0],
          valid_to: data.to_date.toISOString().split("T")[0],
          start_time: data.unavailable_all_day ? "00:00" : data.start_time,
          end_time: data.unavailable_all_day ? "23:59" : data.end_time,
          reason: data.reason ?? "",
          slot_type: data.slot_type,
          tokens_per_slot: data.tokens_allowed,
        },
      }),
      {
        loading: "Creating...",
        success: ({ res }) => {
          if (res?.ok) {
            setOpen(false);
            form.reset();
            onRefresh?.();
            return `Exception '${data.name}' created successfully`;
          }
        },
        error: "Error",
      },
    );
  }

  const renderTimeAllocationCallout = () => {
    const tokensAllowed = form.watch("tokens_allowed");
    if (!tokensAllowed) return null;

    return (
      <Callout variant="alert" badge="Info">
        Allocating {tokensAllowed} tokens in this schedule provides
        approximately 6 minutes for each patient
      </Callout>
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="primary" disabled={isProcessing}>
          Add Exception
        </Button>
      </SheetTrigger>
      <SheetContent className="flex min-w-full flex-col bg-gray-100 sm:min-w-[45rem]">
        <SheetHeader>
          <SheetTitle>Add Schedule Exceptions</SheetTitle>
          <SheetDescription>
            Configure absences or add availability beyond the regular schedule.
          </SheetDescription>
        </SheetHeader>

        <div className="-mx-6 mb-16 overflow-auto px-6 pb-16 pt-6">
          <div className="rounded-md bg-white p-4 shadow">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Exception Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Holiday Leave, Conference"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* <FormField
                  control={form.control}
                  name="is_available"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel required>Exception Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={(value) =>
                            field.onChange(value === "true")
                          }
                          defaultValue={field.value ? "true" : "false"}
                          className="flex space-x-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="false" id="unavailable" />
                            <label
                              htmlFor="unavailable"
                              className="text-sm font-medium leading-none"
                            >
                              Unavailable
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="true" id="modify" />
                            <label
                              htmlFor="modify"
                              className="text-sm font-medium leading-none"
                            >
                              Modify Schedule
                            </label>
                          </div>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                /> */}

                {isAvailable && (
                  <FormField
                    control={form.control}
                    name="slot_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>Appointment Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select appointment type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ScheduleSlotTypes.map((type) => (
                              <SelectItem key={type} value={type}>
                                {t(`SCHEDULE_SLOT_TYPE__${type}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="from_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {isAvailable ? "Valid From" : "Unavailable From"}
                        </FormLabel>
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
                    name="to_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {isAvailable ? "Valid Till" : "Unavailable Until"}
                        </FormLabel>
                        <DatePicker
                          date={field.value}
                          onChange={(date) => field.onChange(date)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isAvailable && (
                  <FormField
                    control={form.control}
                    name="unavailable_all_day"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Full Day Unavailable</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {isAvailable
                            ? "Start Time"
                            : "From (Unavailable Time)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!isAvailable && isAllDay}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>
                          {isAvailable ? "End Time" : "To (Unavailable Time)"}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!isAvailable && isAllDay}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!isAvailable && (
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reason (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Type your reason here"
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {isAvailable && (
                  <>
                    <div className="flex gap-4">
                      <FormField
                        control={form.control}
                        name="tokens_allowed"
                        render={({ field }) => (
                          <FormItem className="w-[180px]">
                            <FormLabel required>Tokens Allowed</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={0}
                                placeholder="10"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(parseInt(e.target.value))
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {renderTimeAllocationCallout()}
                    </div>

                    <Callout variant="warning" badge="Warning">
                      You have 7 unbooked and 3 booked OP appointments for this
                      day. Saving this configuration will overwrite all existing
                      appointments.
                    </Callout>
                  </>
                )}

                <SheetFooter>
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isProcessing}
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={isProcessing}
                  >
                    {isAvailable ? "Modify Schedule" : "Confirm Unavailability"}
                  </Button>
                </SheetFooter>
              </form>
            </Form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
