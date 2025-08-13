import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useQueryParams } from "raviger";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Trans } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

import Callout from "@/CAREUI/display/Callout";
import CareIcon from "@/CAREUI/icons/CareIcon";
import WeekdayCheckbox, {
  DayOfWeek,
} from "@/CAREUI/interactive/WeekdayCheckbox";

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
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import useBreakpoints from "@/hooks/useBreakpoints";

import mutate from "@/Utils/request/mutate";
import { Time } from "@/Utils/types";
import { dateQueryString } from "@/Utils/utils";
import {
  calculateSlotDuration,
  getSlotsPerSession,
  getTokenDuration,
} from "@/pages/Scheduling/utils";
import { ScheduleAvailabilityCreateRequest } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface Props {
  facilityId: string;
  userId: string;
  trigger?: React.ReactNode;
}

type QueryParams = {
  sheet?: "create_template" | null;
};

export default function CreateScheduleTemplateSheet({
  facilityId,
  userId,
  trigger,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Voluntarily masking the setQParams function to merge with other query params if any (since path is not unique within the user availability tab)
  const [qParams, _setQParams] = useQueryParams<QueryParams>();
  const setQParams = (p: QueryParams) => _setQParams(p, { overwrite: false });

  const weekdayFormat = useBreakpoints({
    default: "alphabet",
    md: "short",
  } as const);

  const formSchema = z
    .object({
      name: z.string().min(1, t("field_required")),
      valid_from: z
        .date({ required_error: t("field_required") })
        .min(dayjs().startOf("day").toDate(), {
          message: t("schedule_creation_for_past_validation_error"),
        }),
      valid_to: z.date({ required_error: t("field_required") }),

      weekdays: z
        .array(z.number() as unknown as z.ZodType<DayOfWeek>)
        .min(1, t("schedule_weekdays_min_error")),
      availabilities: z
        .array(
          z
            .discriminatedUnion("slot_type", [
              // Schema for appointment type
              z.object({
                slot_type: z.literal("appointment"),
                name: z.string().min(1, t("field_required")),
                reason: z.string().trim(),
                start_time: z.string().min(1, t("field_required")) as z.ZodType<
                  Time | undefined
                >,
                end_time: z.string().min(1, t("field_required")) as z.ZodType<
                  Time | undefined
                >,
                slot_size_in_minutes: z
                  .number()
                  .min(1, t("number_min_error", { min: 0 })),
                tokens_per_slot: z
                  .number()
                  .min(1, t("number_min_error", { min: 0 })),
                is_auto_fill: z.boolean().optional(),
                num_of_slots: z
                  .number()
                  .min(1, t("number_min_error", { min: 0 })),
              }),
              // Schema for open and closed types
              z.object({
                slot_type: z.enum(["open", "closed"]),
                name: z.string().min(1, t("field_required")),
                reason: z.string().trim(),
                start_time: z
                  .string()
                  .min(1, t("field_required")) as unknown as z.ZodType<Time>,
                end_time: z
                  .string()
                  .min(1, t("field_required")) as unknown as z.ZodType<Time>,
                slot_size_in_minutes: z.literal(null),
                tokens_per_slot: z.literal(null),
              }),
            ])
            .refine(
              (data) => {
                // Validate each availability's time range
                const startTime = dayjs(data.start_time, "HH:mm");
                const endTime = dayjs(data.end_time, "HH:mm");
                return startTime.isBefore(endTime);
              },
              {
                message: t("start_time_must_be_before_end_time"),
                path: ["start_time"], // This will show error at the start_time field
              },
            ),
        )
        .min(1, t("schedule_sessions_min_error")),
    })
    .refine(
      (data) => !dayjs(data.valid_to).isBefore(dayjs(data.valid_from), "day"),
      {
        path: ["valid_to"],
        message: t("to_date_equal_or_after_from_date"),
      },
    );

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      valid_from: undefined,
      valid_to: undefined,
      weekdays: [],
      availabilities: [
        {
          name: "",
          slot_type: "appointment",
          reason: "",
          start_time: undefined,
          end_time: undefined,
          tokens_per_slot: null as unknown as undefined,
          slot_size_in_minutes: null as unknown as undefined,
          is_auto_fill: false,
          num_of_slots: 1,
        },
      ],
    },
  });

  const { mutate: createTemplate, isPending } = useMutation({
    mutationFn: mutate(scheduleApis.templates.create, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success("Schedule template created successfully");
      setQParams({ sheet: null });
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["user-schedule-templates", { facilityId, userId }],
      });
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    createTemplate({
      valid_from: dateQueryString(values.valid_from),
      valid_to: dateQueryString(values.valid_to),
      name: values.name,
      user: userId,
      availabilities: values.availabilities.map(
        (availability) =>
          ({
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
          }) as ScheduleAvailabilityCreateRequest,
      ),
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
        <Trans
          i18nKey="schedule_slots_allocation_callout"
          values={{
            slots: Math.floor(slotsPerSession),
            token_duration: tokenDuration.toFixed(1).replace(".0", ""),
          }}
        />
      </Callout>
    );
  };

  const updateSlotDuration = (index: number) => {
    const isAutoFill = form.watch(`availabilities.${index}.is_auto_fill`);
    if (isAutoFill) {
      const start = form.watch(`availabilities.${index}.start_time`);
      const end = form.watch(`availabilities.${index}.end_time`);
      const numOfSlots = form.watch(`availabilities.${index}.num_of_slots`);
      if (!start || !end) return;
      const duration = calculateSlotDuration(start, end, numOfSlots);
      form.setValue(`availabilities.${index}.slot_size_in_minutes`, duration);
    }
  };

  return (
    <Sheet
      open={qParams.sheet === "create_template"}
      onOpenChange={(open) =>
        setQParams({ sheet: open ? "create_template" : null })
      }
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="primary" disabled={isPending}>
            {t("create_template")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex min-w-full flex-col bg-gray-100 sm:min-w-fit">
        <SheetHeader>
          <SheetTitle>{t("create_schedule_template")}</SheetTitle>
          <SheetDescription className="sr-only">
            {t("create_schedule_template")}
          </SheetDescription>
        </SheetHeader>

        <div className="-mx-6 mb-16 overflow-auto px-6 pb-16 pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel aria-required>
                      {t("schedule_template_name")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t("schedule_template_name_placeholder")}
                        {...field}
                      />
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
                      <FormLabel aria-required>{t("valid_from")}</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={(date) => field.onChange(date)}
                        disabled={(date) =>
                          dayjs(date).isBefore(dayjs(), "day")
                        }
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
                      <FormLabel aria-required>{t("valid_to")}</FormLabel>
                      <DatePicker
                        date={field.value}
                        onChange={(date) => field.onChange(date)}
                        disabled={(date) =>
                          dayjs(date).isBefore(dayjs(), "day")
                        }
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div>
                <FormLabel className="text-lg font-semibold">
                  {t("weekly_schedule")}
                </FormLabel>
                <span className="block text-sm">
                  {t("schedule_weekdays_description")}
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
                            format={weekdayFormat}
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
                    className="flex flex-col rounded-lg bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between pb-6">
                      <div className="flex items-center gap-2">
                        <CareIcon
                          icon="l-clock"
                          className="text-lg text-blue-600"
                        />
                        <span className="font-semibold">
                          {form.watch(`availabilities.${index}.name`)}
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
                        <span className="ml-2">{t("remove")}</span>
                      </Button>
                    </div>

                    <div className="flex flex-col gap-x-6 gap-y-4">
                      <div className="items-stretch">
                        <FormField
                          control={form.control}
                          name={`availabilities.${index}.name`}
                          render={({ field }) => (
                            <FormItem className="col-span-2">
                              <FormLabel aria-required>
                                {t("session_title")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder={t("session_title_placeholder")}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* <FormField
                        control={form.control}
                        name={`availabilities.${index}.slot_type`}
                        render={({ field }) => (
                          <FormItem className="col-span-2 md:col-span-1">
                            <FormLabel aria-required>{t("session_type")}</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue asChild>
                                    <span>
                                      {t(
                                        `SCHEDULE_AVAILABILITY_TYPE__${field.value}`,
                                      )}
                                    </span>
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {["appointment", "open", "closed"].map(
                                  (type) => (
                                    <SelectItem key={type} value={type}>
                                      <p>
                                        {t(
                                          `SCHEDULE_AVAILABILITY_TYPE__${type}`,
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {t(
                                          `SCHEDULE_AVAILABILITY_TYPE_DESCRIPTION__${type}`,
                                        )}
                                      </p>
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      /> */}
                      <div className="flex flex-wrap">
                        <FormField
                          control={form.control}
                          name={`availabilities.${index}.start_time`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col w-full">
                              <FormLabel aria-required>
                                {t("start_time")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    updateSlotDuration(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`availabilities.${index}.end_time`}
                          render={({ field }) => (
                            <FormItem className="flex flex-col w-full mt-2">
                              <FormLabel aria-required>
                                {t("end_time")}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    updateSlotDuration(index);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {form.watch(`availabilities.${index}.slot_type`) ===
                        "appointment" && (
                        <>
                          <div className="flex flex-wrap mt-0 pt-2 gap-2">
                            <div className="w-full gap-x-2 grid grid-cols-[auto_1fr_auto] mb-2 bg-gray-50 p-3 rounded-lg">
                              <CareIcon
                                icon="l-bolt"
                                className="text-lg text-blue-600"
                              />
                              <Label
                                htmlFor={`auto-fill-${index}`}
                                className="text-sm font-medium cursor-pointer col-start-2"
                              >
                                {t("auto_fill_slot_duration")}
                              </Label>
                              <Switch
                                className="col-start-3"
                                id={`auto-fill-${index}`}
                                checked={form.watch(
                                  `availabilities.${index}.is_auto_fill`,
                                )}
                                onCheckedChange={(checked) => {
                                  form.setValue(
                                    `availabilities.${index}.is_auto_fill`,
                                    checked,
                                  );
                                  if (checked) {
                                    updateSlotDuration(index);
                                  }
                                }}
                              />
                              {form.watch(
                                `availabilities.${index}.is_auto_fill`,
                              ) && (
                                <div className="row-start-2 col-start-2 col-span-2">
                                  <FormField
                                    control={form.control}
                                    name={`availabilities.${index}.num_of_slots`}
                                    render={({ field }) => (
                                      <FormItem className="flex flex-col mt-2 space-y-0">
                                        <Label className="text-sm font-light">
                                          {t("number_of_slots")}
                                        </Label>
                                        <FormControl>
                                          <Input
                                            type="number"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            min={1}
                                            defaultValue={1}
                                            {...field}
                                            className="shadow-none"
                                            onChange={(e) => {
                                              field.onChange(
                                                e.target.valueAsNumber,
                                              );
                                              updateSlotDuration(index);
                                            }}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              )}
                            </div>

                            <FormField
                              control={form.control}
                              name={`availabilities.${index}.slot_size_in_minutes`}
                              render={({ field }) => (
                                <FormItem className="flex grow flex-col">
                                  <FormLabel
                                    aria-required
                                    className="whitespace-nowrap "
                                  >
                                    {t("schedule_slot_size_label")}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      min={0}
                                      placeholder="e.g. 10"
                                      {...field}
                                      value={field.value ?? ""}
                                      onChange={(e) => {
                                        field.onChange(e.target.valueAsNumber);
                                      }}
                                      disabled={form.watch(
                                        `availabilities.${index}.is_auto_fill`,
                                      )}
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
                                <FormItem className="flex flex-col grow">
                                  <FormLabel
                                    aria-required
                                    className="whitespace-nowrap"
                                  >
                                    {t("patients_per_slot")}
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      pattern="[0-9]*"
                                      min={0}
                                      placeholder="e.g. 1"
                                      {...field}
                                      value={field.value ?? ""}
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
                          <div className="col-span-2 mb-2">
                            {timeAllocationCallout(index)}
                          </div>
                        </>
                      )}
                    </div>

                    <div>
                      <FormField
                        control={form.control}
                        name={`availabilities.${index}.reason`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("remarks")}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t("remarks_placeholder")}
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
                      slot_type: "appointment",
                      reason: "",
                      start_time: undefined,
                      end_time: undefined,
                      tokens_per_slot: null as unknown as number,
                      slot_size_in_minutes: null as unknown as number,
                      is_auto_fill: false,
                      num_of_slots: 1,
                    },
                  ]);
                }}
              >
                <CareIcon icon="l-plus" className="text-lg" />
                <span>{t("add_another_session")}</span>
              </Button>

              <SheetFooter className="absolute inset-x-0 bottom-0 border-t border-gray-200 bg-white p-6">
                <SheetClose asChild>
                  <Button
                    variant="outline"
                    type="button"
                    disabled={isPending}
                    onClick={() => form.reset()}
                  >
                    {t("cancel")}
                  </Button>
                </SheetClose>

                <Button variant="primary" type="submit" disabled={isPending}>
                  {isPending ? t("saving") : t("save")}
                </Button>
              </SheetFooter>
            </form>
          </Form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
