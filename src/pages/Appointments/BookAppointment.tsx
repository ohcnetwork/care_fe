import { useMutation, useQuery } from "@tanstack/react-query";
import { format, isBefore, isSameDay, startOfToday } from "date-fns";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import Page from "@/components/Common/Page";

import useAppHistory from "@/hooks/useAppHistory";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString, formatDisplayName, formatName } from "@/Utils/utils";
import {
  groupSlotsByAvailability,
  useAvailabilityHeatmap,
} from "@/pages/Appointments/utils";
import scheduleApis from "@/types/scheduling/scheduleApis";

interface Props {
  facilityId: string;
  patientId: string;
}

export default function BookAppointment(props: Props) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();

  const [resourceId, setResourceId] = useState<string>();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [reason, setReason] = useState("");
  const [selectedSlotId, setSelectedSlotId] = useState<string>();

  const resourcesQuery = useQuery({
    queryKey: ["availableResources", props.facilityId],
    queryFn: query(scheduleApis.appointments.availableUsers, {
      pathParams: {
        facility_id: props.facilityId,
      },
    }),
  });
  const resource = resourcesQuery.data?.users.find((r) => r.id === resourceId);

  const heatmapQuery = useAvailabilityHeatmap({
    facilityId: props.facilityId,
    userId: resourceId,
    month: selectedMonth,
  });

  const slotsQuery = useQuery({
    queryKey: [
      "slots",
      props.facilityId,
      resourceId,
      dateQueryString(selectedDate),
    ],
    queryFn: query(scheduleApis.slots.getSlotsForDay, {
      pathParams: { facility_id: props.facilityId },
      body: {
        user: resourceId,
        day: dateQueryString(selectedDate),
      },
    }),
    enabled: !!resourceId && !!selectedDate,
  });

  const { mutateAsync: createAppointment } = useMutation({
    mutationFn: mutate(scheduleApis.slots.createAppointment, {
      pathParams: {
        facility_id: props.facilityId,
        slot_id: selectedSlotId ?? "",
      },
    }),
  });

  const renderDay = (date: Date) => {
    const isSelected = isSameDay(date, selectedDate);
    const isBeforeToday = isBefore(date, startOfToday());

    const availability = heatmapQuery.data?.[dateQueryString(date)];

    if (
      heatmapQuery.isFetching ||
      !availability ||
      availability.total_slots === 0 || // TODO: replace this with stripes. -- indicates day is not available
      isBeforeToday
    ) {
      return (
        <button
          disabled
          onClick={() => {
            setSelectedDate(date);
            setSelectedSlotId(undefined);
          }}
          className={cn(
            "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden border border-gray-200",
            isSelected ? "ring-2 ring-primary-500" : "",
          )}
        >
          <div className="relative z-10">
            <span>{date.getDate()}</span>
          </div>
        </button>
      );
    }

    const { booked_slots, total_slots } = availability;
    const bookedPercentage = booked_slots / total_slots;
    const tokensLeft = total_slots - booked_slots;
    const isFullyBooked = tokensLeft <= 0;

    return (
      <button
        disabled={isBeforeToday || isFullyBooked}
        onClick={() => {
          setSelectedDate(date);
          setSelectedSlotId(undefined);
        }}
        className={cn(
          "h-full w-full hover:bg-gray-50 rounded-lg relative overflow-hidden border-2 hover:scale-105 hover:shadow-md transition-all",
          isSelected ? "border-primary-500" : "border-gray-200",
          isFullyBooked ? "bg-gray-200" : "bg-white",
        )}
      >
        <div className="relative z-10">
          <span>{date.getDate()}</span>
          {Number.isFinite(tokensLeft) && (
            <span
              className={cn(
                "text-xs text-gray-500 block font-semibold",
                bookedPercentage >= 0.8
                  ? "text-red-500"
                  : bookedPercentage >= 0.5
                    ? "text-yellow-500"
                    : "text-primary-500",
              )}
            >
              {tokensLeft} left
            </span>
          )}
        </div>
        {!isFullyBooked && (
          <div
            className={cn(
              "absolute bottom-0 left-0 w-full transition-all",
              bookedPercentage > 0.8
                ? "bg-red-100"
                : bookedPercentage > 0.5
                  ? "bg-yellow-100"
                  : "bg-primary-100",
            )}
            style={{ height: `${Math.min(bookedPercentage * 100, 100)}%` }}
          />
        )}
      </button>
    );
  };

  const handleSubmit = async () => {
    if (!resourceId) {
      toast.error("Please select a practitioner");
      return;
    }
    if (!selectedSlotId) {
      toast.error("Please select a slot");
      return;
    }

    try {
      const data = await createAppointment({
        patient: props.patientId,
        reason_for_visit: reason,
      });
      toast.success("Appointment created successfully");
      navigate(
        `/facility/${props.facilityId}/patient/${props.patientId}/appointments/${data.id}`,
      );
    } catch (error) {
      toast.error("Failed to create appointment");
    }
  };

  return (
    <Page title={t("book_appointment")}>
      <hr className="mt-6 mb-8" />
      <div className="container mx-auto p-4 max-w-5xl">
        <div className="mb-8">
          {/* TODO: confirm how to rename this since we are keeping it abstract / not specific to doctor */}
          <h1 className="text-lg font-bold mb-2">{t("book_appointment")}</h1>
        </div>

        <div className="space-y-8">
          <div>
            <Label className="mb-2">{t("reason_for_visit")}</Label>
            <Textarea
              placeholder={t("reason_for_visit_placeholder")}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2">
            <div>
              <label className="block mb-2">{t("select_practitioner")}</label>
              <Select
                disabled={resourcesQuery.isLoading}
                value={resourceId}
                onValueChange={(value) => setResourceId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("show_all")}>
                    {resource && (
                      <div className="flex items-center gap-2">
                        <Avatar
                          imageUrl={resource.profile_picture_url}
                          name={formatName(resource)}
                          className="size-6 rounded-full"
                        />
                        <span>{formatName(resource)}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {resourcesQuery.data?.users.map((user) => (
                    <SelectItem key={user.username} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          imageUrl={user.profile_picture_url}
                          name={formatDisplayName(user)}
                          className="size-6 rounded-full"
                        />
                        <span>{formatDisplayName(user)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            className={cn(
              "grid grid-cols-1 md:grid-cols-2 gap-12",
              !resourceId && "opacity-50 pointer-events-none",
            )}
          >
            <div>
              <Calendar
                month={selectedMonth}
                onMonthChange={(month) => {
                  setSelectedMonth(month);
                  setSelectedSlotId(undefined);
                }}
                renderDay={renderDay}
                className="mb-6"
                highlightToday={false}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{t("available_time_slots")}</h3>
              </div>
              <ScrollArea>
                <div className="max-h-96">
                  {slotsQuery.data == null && (
                    <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                      <p className="text-gray-400">
                        {t("to_view_available_slots_select_resource_and_date")}
                      </p>
                    </div>
                  )}
                  {slotsQuery.data?.results.length === 0 && (
                    <div className="flex items-center justify-center py-32 border-2 border-gray-200 border-dashed rounded-lg text-center">
                      <p className="text-gray-400">
                        {t("no_slots_available_for_this_date")}
                      </p>
                    </div>
                  )}
                  {!!slotsQuery.data?.results.length &&
                    groupSlotsByAvailability(slotsQuery.data.results).map(
                      ({ availability, slots }) => (
                        <div key={availability.name}>
                          <h4 className="text-lg font-semibold mb-3">
                            {availability.name}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {slots.map((slot) => {
                              const percentage =
                                slot.allocated / availability.tokens_per_slot;

                              return (
                                <Button
                                  key={slot.id}
                                  size="lg"
                                  variant={
                                    selectedSlotId === slot.id
                                      ? "outline_primary"
                                      : "outline"
                                  }
                                  onClick={() => {
                                    if (selectedSlotId === slot.id) {
                                      setSelectedSlotId(undefined);
                                    } else {
                                      setSelectedSlotId(slot.id);
                                    }
                                  }}
                                  disabled={
                                    slot.allocated ===
                                    availability.tokens_per_slot
                                  }
                                  className="flex flex-col items-center group gap-0"
                                >
                                  <span className="font-semibold">
                                    {format(slot.start_datetime, "HH:mm")}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-xs group-hover:text-inherit",
                                      percentage >= 1
                                        ? "text-gray-400"
                                        : percentage >= 0.8
                                          ? "text-red-600"
                                          : percentage >= 0.6
                                            ? "text-yellow-600"
                                            : "text-green-600",
                                    )}
                                  >
                                    {availability.tokens_per_slot -
                                      slot.allocated}{" "}
                                    left
                                  </span>
                                </Button>
                              );
                            })}
                          </div>
                          <Separator className="my-6" />
                        </div>
                      ),
                    )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" type="button" onClick={() => goBack()}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedSlotId}
              onClick={handleSubmit}
            >
              {t("schedule_appointment")}
            </Button>
          </div>
        </div>
      </div>
    </Page>
  );
}
