import { useQuery } from "@tanstack/react-query";
import { format, isSameDay, parseISO } from "date-fns";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { FacilityModel } from "@/components/Facility/models";
import { ScheduleAPIs } from "@/components/Schedule/api";
import { ScheduleResourceUser, TokenSlot } from "@/components/Schedule/types";
import { UserBareMinimum } from "@/components/Users/models";

import * as Notification from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { RequestResult } from "@/Utils/request/types";
import { dateQueryString, getMonthStartAndEnd } from "@/Utils/utils";

import { DoctorModel, getExperience, mockDoctors } from "./Utils";

interface AppointmentsProps {
  facilityId: string;
  staffUsername: string;
}

export function AppointmentsPage(props: AppointmentsProps) {
  const { facilityId, staffUsername } = props;
  const phoneNumber = localStorage.getItem("phoneNumber");
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TokenSlot>();
  const [reason, setReason] = useState("");

  if (!staffUsername) {
    Notification.Error({ msg: "Staff username not found" });
    navigate(`/facility/${facilityId}/`);
  } else if (!phoneNumber) {
    Notification.Error({ msg: "Phone number not found" });
    navigate(`/facility/${facilityId}/appointments/${staffUsername}/otp/send`);
  }

  const { start, end } = getMonthStartAndEnd(selectedMonth);

  const { data: facilityResponse, error: facilityError } = useQuery<
    RequestResult<FacilityModel>
  >({
    queryKey: ["facility", facilityId],
    queryFn: () =>
      request(routes.getAnyFacility, {
        pathParams: { id: facilityId },
        silent: true,
      }),
  });

  if (facilityError) {
    Notification.Error({ msg: "Error while fetching facility data" });
  }

  const { data: doctorResponse, error: doctorError } = useQuery<
    RequestResult<UserBareMinimum>
  >({
    queryKey: ["doctor", staffUsername],
    queryFn: () =>
      request(routes.getUserDetails, {
        pathParams: { username: staffUsername ?? "" },
        silent: true,
      }),
    enabled: !!staffUsername,
  });

  if (doctorError) {
    Notification.Error({ msg: "Error while fetching doctor data" });
  }

  const slotsQuery = useQuery<RequestResult<TokenSlot[]>>({
    queryKey: ["slots", facilityId, staffUsername, start, end],
    queryFn: () =>
      request(ScheduleAPIs.appointments.slots, {
        pathParams: {
          facility_id: facilityId,
        },
        query: {
          doctor_username: staffUsername,
          valid_from: dateQueryString(start),
          valid_to: dateQueryString(end),
        },
        silent: true,
      }),
    enabled: !!staffUsername,
  });

  if (slotsQuery.error) {
    Notification.Error({ msg: "Error while fetching slots data" });
  }

  useEffect(() => {
    setSelectedSlot(undefined);
  }, [selectedDate]);

  const renderDay = (date: Date) => {
    const isSelected = date.toDateString() === selectedDate?.toDateString();

    return (
      <button
        onClick={() => setSelectedDate(date)}
        className={cn(
          "h-full w-full hover:bg-gray-50 rounded-lg",
          isSelected ? "bg-white ring-2 ring-primary-500" : "bg-gray-100",
        )}
      >
        <span>{date.getDate()}</span>
      </button>
    );
  };

  // To Do: Mock, remove/adjust this
  function extendDoctor(
    doctor: UserBareMinimum | undefined,
  ): DoctorModel | undefined {
    if (!doctor) return undefined;
    const randomDoc =
      mockDoctors[Math.floor(Math.random() * mockDoctors.length)];
    return {
      ...doctor,
      role: randomDoc.role,
      education: randomDoc.education,
      experience: randomDoc.experience,
      languages: randomDoc.languages,
      specializations: randomDoc.specializations,
    };
  }

  // To Do: Mock, remove/adjust this
  const doctor: DoctorModel | undefined =
    extendDoctor(doctorResponse?.data) ??
    mockDoctors.find((d) => d.username === staffUsername);

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  // To Do: Mock, remove/adjust this
  const doctorResource: ScheduleResourceUser = {
    id: doctor.id.toString(),
    name: `${doctor.first_name} ${doctor.last_name}`,
  };

  // To Do: Mock, remove/adjust this
  const mockTokenSlots: TokenSlot[] = [
    // Dec 20 - Morning slots
    {
      id: "1",
      start_datetime: "2024-12-20T09:00:00+05:30",
      end_datetime: "2024-12-20T09:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 3,
    },
    {
      id: "2",
      start_datetime: "2024-12-20T09:30:00+05:30",
      end_datetime: "2024-12-20T10:00:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 4,
    },
    // Dec 20 - Evening slots
    {
      id: "3",
      start_datetime: "2024-12-20T14:00:00+05:30",
      end_datetime: "2024-12-20T14:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 0,
    },
    {
      id: "4",
      start_datetime: "2024-12-20T14:30:00+05:30",
      end_datetime: "2024-12-20T15:00:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 2,
    },
    // Dec 21 - Morning slots
    {
      id: "5",
      start_datetime: "2024-12-21T09:00:00+05:30",
      end_datetime: "2024-12-21T09:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 4,
    },
    {
      id: "6",
      start_datetime: "2024-12-21T09:30:00+05:30",
      end_datetime: "2024-12-21T10:00:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 1,
    },
    // Dec 21 - Evening slots
    {
      id: "7",
      start_datetime: "2024-12-21T15:00:00+05:30",
      end_datetime: "2024-12-21T15:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 4,
    },
    // Dec 22 - Morning slots
    {
      id: "8",
      start_datetime: "2024-12-22T10:00:00+05:30",
      end_datetime: "2024-12-22T10:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 2,
    },
    {
      id: "9",
      start_datetime: "2024-12-22T10:30:00+05:30",
      end_datetime: "2024-12-22T11:00:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 4,
    },
    // Dec 22 - Evening slots
    {
      id: "10",
      start_datetime: "2024-12-22T16:00:00+05:30",
      end_datetime: "2024-12-22T16:30:00+05:30",
      resource: doctorResource,
      tokens_count: 4,
      tokens_remaining: 3,
    },
  ];

  // To Do: Mock, remove/adjust this
  const slotsData = slotsQuery.data?.data ?? mockTokenSlots;
  const slotsOfDate = filterSlotsByDate(slotsData, selectedDate);
  const morningSlots = slotsOfDate.filter((slot) => {
    const slotTime = parseISO(slot.start_datetime);
    return slotTime.getHours() <= 12;
  });

  const eveningSlots = slotsOfDate.filter((slot) => {
    const slotTime = parseISO(slot.start_datetime);
    return slotTime.getHours() >= 12;
  });

  const getSlotButtons = (slots: TokenSlot[]) => {
    return slots.map((slot) => (
      <Button
        key={slot.id}
        variant={selectedSlot?.id === slot.id ? "primary" : "outline"}
        onClick={() => {
          if (selectedSlot?.id === slot.id) {
            setSelectedSlot(undefined);
          } else {
            setSelectedSlot(slot);
          }
        }}
        disabled={!slot.tokens_remaining}
      >
        {format(slot.start_datetime, "HH:mm a")}
      </Button>
    ));
  };

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex px-2 pb-4 justify-start">
          <Button
            variant="outline"
            asChild
            className="border border-secondary-400"
          >
            <Link href={`/facility/${facilityId}`}>
              <CareIcon icon="l-square-shape" className="h-4 w-4 mr-1" />
              <span className="text-sm underline">Back</span>
            </Link>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/3">
            <Card className={cn("overflow-hidden bg-white")}>
              <div className="flex flex-col">
                <div className="flex flex-col gap-4 items-center py-4">
                  <div className="h-96 w-96 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={
                        doctor.read_profile_picture_url ||
                        "/images/default-doctor.png"
                      }
                      alt={`${doctor.first_name} ${doctor.last_name}`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex grow flex-col min-w-0 px-3">
                    <h3 className="truncate text-xl font-semibold">
                      {`Dr. ${doctor.first_name} ${doctor.last_name}`}
                    </h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {doctor.role}
                    </p>

                    <p className="text-xs mt-4">Education: </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {doctor.education}
                    </p>

                    <p className="text-xs mt-4">Languages: </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {doctor.languages.join(", ")}
                    </p>

                    <p className="text-sm mt-6">{getExperience(doctor)}</p>
                  </div>
                </div>

                <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {facilityResponse?.data?.name}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex-1 mx-2">
            <div className="flex flex-col gap-6">
              <span className="text-base font-semibold">
                Book an Appointment with Dr. {doctor.first_name}{" "}
                {doctor.last_name}
              </span>
              <div>
                <Label className="mb-2">Reason for visit</Label>
                <Textarea
                  placeholder="Type the reason for visit"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>
              <Calendar
                month={selectedMonth}
                onMonthChange={setSelectedMonth}
                renderDay={renderDay}
                highlightToday={false}
              />
              <div className="space-y-6">
                {slotsData &&
                (morningSlots.length > 0 || eveningSlots.length > 0) ? (
                  <div>
                    <span className="mb-6 text-xs">Available Time Slots</span>
                    <div className="flex flex-col gap-4">
                      {morningSlots.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">
                            Morning Slots: {morningSlots.length}{" "}
                            {morningSlots.length > 1 ? "Slots" : "Slot"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {getSlotButtons(morningSlots)}
                          </div>
                        </div>
                      )}
                      {eveningSlots.length > 0 && (
                        <div className="flex flex-col gap-2">
                          <span className="text-xs text-muted-foreground">
                            Evening Slots: {eveningSlots.length}{" "}
                            {eveningSlots.length > 1 ? "Slots" : "Slot"}
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {getSlotButtons(eveningSlots)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div>No slots available</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-200 h-20">
        {selectedSlot?.id && (
          <div className="container mx-auto flex flex-row justify-end mt-6">
            <Button
              variant="primary_gradient"
              onClick={() => {
                localStorage.setItem(
                  "selectedSlot",
                  JSON.stringify(selectedSlot),
                );
                localStorage.setItem("reason", reason);
                navigate(
                  `/facility/${facilityId}/appointments/${staffUsername}/patient-select`,
                );
              }}
            >
              <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent"></span>
              Continue
              <CareIcon icon="l-arrow-right" className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const filterSlotsByDate = (slots: TokenSlot[], date: Date) => {
  return slots.filter((slot) => {
    const slotDate = parseISO(slot.start_datetime);
    return isSameDay(slotDate, date);
  });
};
