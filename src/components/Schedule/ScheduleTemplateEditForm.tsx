import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { getSlotsPerSession } from "@/components/Schedule/helpers";
import { formatAvailabilityTime } from "@/components/Users/UserAvailabilityTab";

import mutate from "@/Utils/request/mutate";
import { dateQueryString } from "@/Utils/utils";
import {
  AvailabilityDateTime,
  ScheduleAvailability,
  ScheduleTemplate,
} from "@/types/scheduling/schedule";
import { DayOfWeek } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApis";

const templateFormSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  valid_from: z.date({
    required_error: "Valid from date is required",
  }),
  valid_to: z.date({
    required_error: "Valid to date is required",
  }),
});

const availabilityFormSchema = z.object({
  name: z.string().min(1, "Session name is required"),
  tokens_per_slot: z.number().min(1, "Must be greater than 0"),
  reason: z.string(),
});

export default function ScheduleTemplateEditForm({
  template,
  facilityId,
  userId,
}: {
  template: ScheduleTemplate;
  facilityId: string;
  userId: string;
}) {
  return (
    <div>
      <ScheduleTemplateEditor
        template={template}
        facilityId={facilityId}
        userId={userId}
      />
      {template.availabilities.map((availability) => (
        <ScheduleAvailabilityEditor
          key={availability.id}
          availability={availability}
          scheduleId={template.id}
          facilityId={facilityId}
          userId={userId}
        />
      ))}
    </div>
  );
}

const ScheduleTemplateEditor = ({
  template,
  facilityId,
  userId,
}: {
  template: ScheduleTemplate;
  facilityId: string;
  userId: string;
}) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof templateFormSchema>>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: template.name,
      valid_from: new Date(template.valid_from),
      valid_to: new Date(template.valid_to),
    },
  });

  const { mutate: updateTemplate, isPending } = useMutation({
    mutationFn: mutate(scheduleApis.templates.update, {
      pathParams: {
        facility_id: facilityId,
        id: template.id,
      },
    }),
    onSuccess: () => {
      toast.success("Schedule template updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["user-schedule-templates", { facilityId, userId }],
      });
    },
  });

  function onSubmit(values: z.infer<typeof templateFormSchema>) {
    updateTemplate({
      name: values.name,
      valid_from: dateQueryString(values.valid_from),
      valid_to: dateQueryString(values.valid_to),
    });
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

const ScheduleAvailabilityEditor = ({
  availability,
  scheduleId,
  facilityId,
  userId,
}: {
  availability: ScheduleAvailability;
  scheduleId: string;
  facilityId: string;
  userId: string;
}) => {
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof availabilityFormSchema>>({
    resolver: zodResolver(availabilityFormSchema),
    defaultValues: {
      name: availability.name,
      tokens_per_slot: availability.tokens_per_slot,
      reason: availability.reason || "",
    },
  });

  const { mutate: updateAvailability, isPending: isUpdating } = useMutation({
    mutationFn: mutate(scheduleApis.templates.availabilities.update, {
      pathParams: {
        facility_id: facilityId,
        schedule_id: scheduleId,
        id: availability.id,
      },
    }),
    onSuccess: () => {
      toast.success("Schedule availability updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["user-schedule-templates", { facilityId, userId }],
      });
    },
  });

  const { mutate: deleteAvailability, isPending: isDeleting } = useMutation({
    mutationFn: mutate(scheduleApis.templates.availabilities.delete, {
      pathParams: {
        facility_id: facilityId,
        schedule_id: scheduleId,
        id: availability.id,
      },
    }),
    onSuccess: () => {
      toast.success("Schedule availability deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["user-schedule-templates", { facilityId, userId }],
      });
    },
  });

  function onSubmit(values: z.infer<typeof availabilityFormSchema>) {
    updateAvailability({
      name: values.name,
      tokens_per_slot: values.tokens_per_slot,
      reason: values.reason,
    });
  }

  // Group availabilities by day of week
  const availabilitiesByDay = availability.availability.reduce(
    (acc, curr) => {
      const day = curr.day_of_week;
      if (!acc[day]) {
        acc[day] = [];
      }
      acc[day].push(curr);
      return acc;
    },
    {} as Record<DayOfWeek, AvailabilityDateTime[]>,
  );

  // Calculate total slots
  const totalSlots = Math.floor(
    getSlotsPerSession(
      availability.availability[0].start_time,
      availability.availability[0].end_time,
      availability.slot_size_in_minutes,
    ) ?? 0,
  );

  return (
    <div className="mt-4 rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CareIcon icon="l-clock" className="text-lg text-blue-600" />
          <div>
            <span className="font-semibold">{availability.name}</span>
            <p className="text-sm text-gray-500">
              <span className="capitalize">{availability.slot_type}</span>
              <span className="px-2 text-gray-300">|</span>
              <span>{totalSlots} slots</span>
              <span className="px-2 text-gray-300">|</span>
              <span>{availability.slot_size_in_minutes} min.</span>
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <CareIcon icon="l-ellipsis-v" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => deleteAvailability()}
              disabled={isUpdating || isDeleting}
              className="text-red-600"
            >
              <CareIcon icon="l-trash" className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-[2]">
                  <FormLabel required>Session Title</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tokens_per_slot"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel required>Patients per slot</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <span className="text-sm font-medium text-gray-500">Schedule</span>
            <div className="mt-2 space-y-2">
              {Object.entries(availabilitiesByDay).map(([day, times]) => (
                <p
                  key={day}
                  className="flex items-center gap-2 rounded px-3 text-sm"
                >
                  <span className="font-medium w-24 text-gray-600">
                    {DayOfWeek[parseInt(day)].charAt(0) +
                      DayOfWeek[parseInt(day)].slice(1).toLowerCase()}
                  </span>
                  <span className="text-gray-500">
                    {times
                      .map((time) => formatAvailabilityTime([time]))
                      .join(", ")}
                  </span>
                </p>
              ))}
            </div>
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Remarks</FormLabel>
                <FormControl>
                  <Textarea className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button variant="primary" type="submit" disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};
