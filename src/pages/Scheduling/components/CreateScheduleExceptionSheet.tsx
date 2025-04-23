import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useQueryParams } from "raviger";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import * as z from "zod";

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
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import { Time } from "@/Utils/types";
import { dateQueryString } from "@/Utils/utils";
import { useIsUserSchedulableResource } from "@/pages/Scheduling/useIsUserSchedulableResource";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface Props {
  facilityId: string;
  userId: string;
  trigger?: React.ReactNode;
}

type QueryParams = {
  sheet?: "add_exception" | null;
  valid_from?: string | null;
  valid_to?: string | null;
};

export default function CreateScheduleExceptionSheet({
  facilityId,
  userId,
  trigger,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  // Voluntarily masking the setQParams function to merge with other query params if any (since path is not unique within the user availability tab)
  const [qParams, _setQParams] = useQueryParams<QueryParams>();
  const setQParams = (p: QueryParams) => _setQParams(p, { overwrite: false });

  const formSchema = z
    .object({
      reason: z.string().min(1, t("field_required")),
      valid_from: z
        .date({ required_error: t("field_required") })
        .min(dayjs().startOf("day").toDate(), {
          message: t("schedule_exception_creation_for_past_validation_error"),
        }),
      valid_to: z
        .date({ required_error: t("field_required") })
        .min(dayjs().startOf("day").toDate(), {
          message: t("schedule_exception_creation_for_past_validation_error"),
        }),
      start_time: z
        .string()
        .min(1, t("field_required")) as unknown as z.ZodType<Time>,

      end_time: z
        .string()
        .min(1, t("field_required")) as unknown as z.ZodType<Time>,

      unavailable_all_day: z.boolean(),
    })
    .refine(
      (data) => {
        if (data.unavailable_all_day) return true;
        const startTime = dayjs(data.start_time, "HH:mm");
        const endTime = dayjs(data.end_time, "HH:mm");
        return startTime.isBefore(endTime);
      },
      {
        message: t("start_time_must_be_before_end_time"),
        path: ["end_time"],
      },
    )
    .refine(
      (data) => {
        if (data.unavailable_all_day) return true;
        const startTime = dayjs(data.start_time, "HH:mm");
        const now = dayjs();
        if (dayjs(data.valid_from).isSame(now, "day")) {
          return now.isBefore(startTime);
        }
        return true;
      },
      {
        message: t("start_time_must_be_in_the_future"),
        path: ["start_time"],
      },
    )
    .refine(
      (data) => !dayjs(data.valid_to).isBefore(dayjs(data.valid_from), "day"),
      {
        path: ["valid_to"],
        message: t("valid_till_equal_or_after_valid_from"),
      },
    );
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      valid_from: undefined,
      valid_to: undefined,
      start_time: undefined,
      end_time: undefined,
      reason: "",
      unavailable_all_day: false,
    },
  });

  useEffect(() => {
    if (qParams.valid_from) {
      form.setValue("valid_from", new Date(qParams.valid_from));
    }
  }, [qParams.valid_from, form]);

  useEffect(() => {
    if (qParams.valid_to) {
      form.setValue("valid_to", new Date(qParams.valid_to));
    }
  }, [qParams.valid_to, form]);

  const { mutate: createException, isPending } = useMutation({
    mutationFn: mutate(scheduleApis.exceptions.create, {
      pathParams: { facility_id: facilityId },
    }),
    onSuccess: () => {
      toast.success(t("exception_created"));
      setQParams({ sheet: null, valid_from: null, valid_to: null });
      form.reset();
      queryClient.invalidateQueries({
        queryKey: ["user-schedule-exceptions", { facilityId, userId }],
      });
    },
  });

  const { data: isSchedulableResource } = useIsUserSchedulableResource(
    facilityId,
    userId,
  );

  const unavailableAllDay = form.watch("unavailable_all_day");

  useEffect(() => {
    if (unavailableAllDay) {
      form.setValue("start_time", "00:00");
      form.setValue("end_time", "23:59");
    } else {
      form.resetField("start_time");
      form.resetField("end_time");
    }
  }, [unavailableAllDay, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    createException({
      reason: data.reason,
      valid_from: dateQueryString(data.valid_from),
      valid_to: dateQueryString(data.valid_to),
      start_time: data.start_time,
      end_time: data.end_time,
      user: userId,
    });
  }

  return (
    <Sheet
      open={qParams.sheet === "add_exception"}
      onOpenChange={(open) =>
        setQParams({
          sheet: open ? "add_exception" : null,
          valid_from: null,
          valid_to: null,
        })
      }
    >
      <SheetTrigger asChild>
        {trigger ?? (
          <Button
            variant="primary"
            disabled={isPending || !isSchedulableResource}
          >
            {t("add_exception")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="flex min-w-full flex-col bg-gray-100 sm:min-w-[45rem]">
        <SheetHeader>
          <SheetTitle>{t("add_schedule_exceptions")}</SheetTitle>
          <SheetDescription>
            {t("add_schedule_exceptions_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="-mx-6 mb-16 overflow-auto px-6 pb-16 pt-6">
          <div className="rounded-md bg-white p-4 shadow-sm">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("reason")}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Holiday Leave, Conference, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>{t("valid_from")}</FormLabel>
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
                      <FormItem>
                        <FormLabel aria-required>{t("valid_to")}</FormLabel>
                        <DatePicker
                          date={field.value}
                          onChange={(date) => field.onChange(date)}
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                        <FormLabel>{t("full_day_unavailable")}</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel aria-required>From</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={unavailableAllDay}
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
                        <FormLabel aria-required>To</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={unavailableAllDay}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <SheetFooter>
                  <SheetClose asChild>
                    <Button
                      variant="outline"
                      className="mt-2 md:mt-0"
                      type="button"
                      disabled={isPending}
                    >
                      {t("cancel")}
                    </Button>
                  </SheetClose>
                  <Button variant="primary" type="submit" disabled={isPending}>
                    {t("confirm_unavailability")}
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
