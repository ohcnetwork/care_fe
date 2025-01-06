import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
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

import { ScheduleAPIs } from "@/components/Schedule/api";

import useSlug from "@/hooks/useSlug";

import mutate from "@/Utils/request/mutate";
import { Time } from "@/Utils/types";
import { dateQueryString } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

const formSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
  valid_from: z.date({ required_error: "From date is required" }),
  valid_to: z.date({ required_error: "To date is required" }),
  start_time: z
    .string()
    .min(1, "Start time is required") as unknown as z.ZodType<Time>,
  end_time: z
    .string()
    .min(1, "End time is required") as unknown as z.ZodType<Time>,
  unavailable_all_day: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  onRefresh?: () => void;
  user: UserBase;
}

export default function ScheduleExceptionForm({ user, onRefresh }: Props) {
  const [open, setOpen] = useState(false);
  const facilityId = useSlug("facility");

  const form = useForm<FormValues>({
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

  const {
    mutate: createException,
    isPending,
    isSuccess,
  } = useMutation({
    mutationFn: mutate(ScheduleAPIs.exceptions.create, {
      pathParams: { facility_id: facilityId },
    }),
  });

  const unavailableAllDay = form.watch("unavailable_all_day");

  useEffect(() => {
    if (unavailableAllDay) {
      form.setValue("start_time", "00:00");
      form.setValue("end_time", "23:59");
    } else {
      form.resetField("start_time");
      form.resetField("end_time");
    }
  }, [unavailableAllDay]);

  useEffect(() => {
    if (isSuccess) {
      toast.success("Exception created successfully");
      setOpen(false);
      form.reset();
      onRefresh?.();
    }
  }, [isSuccess]);

  async function onSubmit(data: FormValues) {
    createException({
      reason: data.reason,
      valid_from: dateQueryString(data.valid_from),
      valid_to: dateQueryString(data.valid_to),
      start_time: data.start_time,
      end_time: data.end_time,
      user: user.id,
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="primary" disabled={isPending}>
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
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel required>Reason</FormLabel>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="valid_from"
                    render={({ field }) => (
                      <FormItem>
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
                      <FormItem>
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel required>From</FormLabel>
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
                        <FormLabel required>To</FormLabel>
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
                      type="button"
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button variant="primary" type="submit" disabled={isPending}>
                    Confirm Unavailability
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
