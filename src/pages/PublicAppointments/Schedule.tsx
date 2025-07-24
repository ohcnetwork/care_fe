import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isWithinInterval } from "date-fns";
import { Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";
import Calendar from "@/CAREUI/interactive/Calendar";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";

import useAppHistory from "@/hooks/useAppHistory";
import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { dateQueryString, formatName } from "@/Utils/utils";
import { TokenSlotButton } from "@/pages/Appointments/components/AppointmentSlotPicker";
import { groupSlotsByAvailability } from "@/pages/Appointments/utils";
import facilityApi from "@/types/facility/facilityApi";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import { Appointment, TokenSlot } from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

interface AppointmentsProps {
  facilityId: string;
  staffId: string;
  appointmentId?: string;
}

export function ScheduleAppointment(props: AppointmentsProps) {
  const { t } = useTranslation();
  const { goBack } = useAppHistory();
  const { facilityId, staffId, appointmentId } = props;
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TokenSlot>();
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const patientUserContext = usePatientContext();
  const tokenData = patientUserContext?.tokenData;

  if (!staffId) {
    toast.error(t("staff_username_not_found"));
    navigate(`/facility/${facilityId}/`);
  } else if (!tokenData) {
    toast.error(t("phone_number_not_found"));
    navigate(`/facility/${facilityId}/appointments/${staffId}/otp/send`);
  }

  const { data: appointmentData } = useQuery({
    queryKey: ["appointment", tokenData?.phoneNumber],
    queryFn: query(PublicAppointmentApi.getAppointments, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!appointmentId && !!tokenData?.token,
  });

  const appointment = appointmentData?.results.find(
    (appointment) => appointment.id === appointmentId,
  );

  useEffect(() => {
    if (appointment) {
      setReason(appointment.note);
    }
  }, [appointment]);

  const { data: facilityResponse, error: facilityError } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(facilityApi.getAnyFacility, {
      pathParams: { id: facilityId },
      silent: true,
    }),
  });

  if (facilityError) {
    toast.error(t("error_fetching_facility_data"));
  }

  const { data: userData, error: userError } = useQuery({
    queryKey: ["user", facilityId, staffId],
    queryFn: query(
      scheduleApis.appointments.getPublicScheduleableFacilityUser,
      {
        pathParams: { facility_id: facilityId, user_id: staffId },
      },
    ),
    enabled: !!facilityId && !!staffId,
  });

  if (userError) {
    toast.error(t("error_fetching_user_data"));
  }

  const slotsQuery = useQuery({
    queryKey: ["slots", facilityId, staffId, selectedDate],
    queryFn: query(PublicAppointmentApi.getSlotsForDay, {
      body: {
        facility: facilityId,
        user: staffId,
        day: dateQueryString(selectedDate),
      },
      headers: {
        Authorization: `Bearer ${tokenData.token}`,
      },
      silent: true,
    }),
    select: (data: { results: TokenSlot[] }) => {
      return data.results.filter((slot) => {
        // Filter out slots that are happening right now
        const isCurrentlyActive = isWithinInterval(new Date(), {
          start: slot.start_datetime,
          end: slot.end_datetime,
        });

        // Filter out the current appointment's slot when rescheduling
        const isCurrentAppointmentSlot =
          appointment && slot.id === appointment.token_slot.id;

        return !isCurrentlyActive && !isCurrentAppointmentSlot;
      });
    },
    enabled: !!selectedDate && !!tokenData.token,
  });

  if (slotsQuery.error) {
    if (
      slotsQuery.error.cause?.errors &&
      Array.isArray(slotsQuery.error.cause.errors) &&
      slotsQuery.error.cause.errors[0][0] === "Resource is not schedulable"
    ) {
      toast.error(t("user_not_available_for_appointments"));
    } else {
      toast.error(t("error_fetching_slots_data"));
    }
  }

  const { mutate: createAppointment, isPending: isCreatingAppointment } =
    useMutation({
      mutationFn: mutate(PublicAppointmentApi.createAppointment, {
        pathParams: { id: selectedSlot?.id || "" },
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      }),
      onSuccess: (data: Appointment) => {
        toast.success(t("appointment_created_success"));
        queryClient.invalidateQueries({
          queryKey: [
            ["patients", tokenData.phoneNumber],
            ["appointment", tokenData.phoneNumber],
          ],
        });
        navigate(`/facility/${facilityId}/appointments/${data.id}/success`, {
          replace: true,
        });
      },
    });

  const { mutate: cancelAppointment, isPending: isCancellingAppointment } =
    useMutation({
      mutationFn: mutate(PublicAppointmentApi.cancelAppointment, {
        headers: {
          Authorization: `Bearer ${tokenData.token}`,
        },
      }),
      onSuccess: (appointment: Appointment) => {
        toast.success(t("appointment_cancelled"));
        queryClient.invalidateQueries({
          queryKey: ["appointment", tokenData.phoneNumber],
        });
        createAppointment({
          note: reason,
          patient: appointment.patient.id,
        });
      },
    });

  const handleRescheduleAppointment = (appointment: Appointment) => {
    cancelAppointment({
      appointment: appointment.id,
      patient: appointment.patient.id,
    });
  };

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

  if (!userData) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-8">
        <div className="flex px-2 pb-4 justify-start">
          <Button
            variant="outline"
            className="border border-secondary-400"
            onClick={() => goBack(`/facility/${facilityId}`)}
          >
            <span className="text-sm underline">{t("back")}</span>
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="sm:w-1/3">
            <Card className={cn("overflow-hidden bg-white")}>
              <div className="flex flex-col">
                <div className="flex flex-col gap-4 py-4 justify-between h-full">
                  <Avatar
                    imageUrl={userData.profile_picture_url}
                    name={`${userData.first_name} ${userData.last_name}`}
                    className="size-96 self-center rounded-sm"
                  />

                  <div className="flex grow flex-col px-4">
                    <h3 className="truncate text-xl font-semibold">
                      {formatName(userData)}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">
                      {userData.user_type}
                    </p>

                    {/* <p className="text-xs mt-4">Education: </p>
                    <p className="text-sm text-gray-500 truncate">
                      {userData.qualification}
                    </p> */}
                  </div>
                </div>

                <div className="mt-auto border-t border-gray-100 bg-gray-50 p-4">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {facilityResponse?.name}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
          <div className="flex-1 mx-2">
            <div className="flex flex-col gap-6">
              <span className="text-base font-semibold">
                {appointmentId
                  ? t("reschedule_appointment_with")
                  : t("book_an_appointment_with")}{" "}
                {formatName(userData)}
              </span>
              <div>
                <Label className="mb-2">{t("note")}</Label>
                <Textarea
                  placeholder={t("appointment_note")}
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
                {slotsQuery.data && slotsQuery.data.length > 0 ? (
                  groupSlotsByAvailability(slotsQuery.data).map(
                    ({ availability, slots }) => (
                      <div key={availability.name}>
                        <h4 className="text-lg font-semibold mb-3">
                          {availability.name}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {slots.map((slot) => (
                            <TokenSlotButton
                              key={slot.id}
                              slot={slot}
                              availability={availability}
                              selectedSlotId={selectedSlot?.id}
                              onClick={() =>
                                setSelectedSlot({ ...slot, availability })
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ),
                  )
                ) : (
                  <div>{t("no_slots_available")}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-secondary-200 h-20">
        {selectedSlot?.id && (
          <div className="container mx-auto flex flex-row justify-end mt-6">
            {(isCreatingAppointment || isCancellingAppointment) && (
              <Loader2 className="size-4 animate-spin self-center mr-2" />
            )}
            {appointment?.status !== "in_consultation" && (
              <Button
                variant="primary_gradient"
                disabled={isCreatingAppointment || isCancellingAppointment}
                onClick={() => {
                  if (appointmentId && appointment) {
                    handleRescheduleAppointment(appointment);
                  } else {
                    navigate(
                      `/facility/${facilityId}/appointments/${staffId}/patient-select`,
                      {
                        query: {
                          slotId: selectedSlot?.id,
                          reason: reason,
                        },
                      },
                    );
                  }
                }}
              >
                {appointmentId ? t("reschedule_appointment") : t("continue")}
                <CareIcon icon="l-arrow-right" className="size-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
