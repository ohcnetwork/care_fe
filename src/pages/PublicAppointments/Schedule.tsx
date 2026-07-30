import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isWithinInterval } from "date-fns";
import dayjs from "dayjs";
import { Loader2 } from "lucide-react";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import { PatientSwitcherSheet } from "@/components/Patient/PatientSwitcherSheet";

import { usePatientContext } from "@/hooks/usePatientUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  dateQueryString,
  formatName,
  formatPatientAge,
  goBack,
} from "@/Utils/utils";
import { groupSlotsByAvailability } from "@/pages/Appointments/utils";
import publicFacilityApi from "@/types/facility/publicFacilityApi";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  PublicAppointment,
  SchedulableResourceType,
  TokenSlot,
} from "@/types/scheduling/schedule";
import scheduleApis from "@/types/scheduling/scheduleApi";

import BookingStepLayout from "./BookingStepLayout";

/** Facility → practitioner → slot → reason → confirmation. */
const TOTAL_STEPS = 5;
const SLOT_STEP = 3;
const REASON_STEP = 4;

/** Days offered in the horizontal date strip. */
const DATE_STRIP_DAYS = 6;
const REASON_MAX_LENGTH = 300;

interface AppointmentsProps {
  facilityId: string;
  staffId: string;
  appointmentId?: string;
}

export function ScheduleAppointment(props: AppointmentsProps) {
  const { t } = useTranslation();
  const { facilityId, staffId, appointmentId } = props;
  const queryClient = useQueryClient();

  const { tokenData, selectedPatient } = usePatientContext();

  const [step, setStep] = useState<typeof SLOT_STEP | typeof REASON_STEP>(
    SLOT_STEP,
  );
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<TokenSlot>();
  // Undefined until the patient types, so a rescheduled appointment's existing
  // note can seed the field without an effect that fights user input.
  const [reasonDraft, setReasonDraft] = useState<string>();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  useEffect(() => {
    if (!staffId) {
      toast.error(t("staff_username_not_found"));
      navigate(`/facility/${facilityId}`);
    }
  }, [staffId, facilityId, t]);

  const { data: appointmentData } = useQuery({
    queryKey: ["appointment", tokenData?.phoneNumber],
    queryFn: query(PublicAppointmentApi.getAppointments, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!appointmentId && !!tokenData?.token,
  });

  const appointment = appointmentData?.results.find(
    (entry) => entry.id === appointmentId,
  );

  const reason = reasonDraft ?? appointment?.note ?? "";

  const { data: facilityResponse } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(publicFacilityApi.getAny, {
      pathParams: { id: facilityId },
      silent: true,
    }),
  });

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
        resource_type: SchedulableResourceType.Practitioner,
        resource_id: staffId,
        day: dateQueryString(selectedDate),
      },
      headers: {
        Authorization: `Bearer ${tokenData?.token}`,
      },
      silent: true,
    }),
    select: (data: { results: TokenSlot[] }) =>
      data.results.filter((slot) => {
        // Skip the slot currently in progress and, when rescheduling, the
        // appointment's own slot.
        const isCurrentlyActive = isWithinInterval(new Date(), {
          start: slot.start_datetime,
          end: slot.end_datetime,
        });
        const isCurrentAppointmentSlot =
          appointment && slot.id === appointment.token_slot.id;
        return !isCurrentlyActive && !isCurrentAppointmentSlot;
      }),
    enabled: !!selectedDate && !!tokenData?.token,
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
          Authorization: `Bearer ${tokenData?.token}`,
        },
      }),
      onSuccess: (data: PublicAppointment) => {
        toast.success(t("appointment_created_success"));
        queryClient.invalidateQueries({
          queryKey: ["appointment", tokenData?.phoneNumber],
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
          Authorization: `Bearer ${tokenData?.token}`,
        },
      }),
      onSuccess: (cancelled: PublicAppointment) => {
        toast.success(t("appointment_cancelled"));
        queryClient.invalidateQueries({
          queryKey: ["appointment", tokenData?.phoneNumber],
        });
        createAppointment({ note: reason, patient: cancelled.patient.id });
      },
    });

  const isSubmitting = isCreatingAppointment || isCancellingAppointment;

  // Changing the day invalidates any slot already picked for the previous one.
  const selectDate = (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(undefined);
  };

  const handleConfirm = () => {
    if (appointmentId && appointment) {
      cancelAppointment({
        appointment: appointment.id,
        patient: appointment.patient.id,
      });
      return;
    }
    if (!selectedPatient) {
      toast.error(t("select_patient"));
      return;
    }
    createAppointment({ note: reason, patient: selectedPatient.id });
  };

  if (!userData) {
    return <Loading />;
  }

  const practitionerName = formatName(userData);
  const dateStrip = Array.from({ length: DATE_STRIP_DAYS }, (_, offset) =>
    dayjs().add(offset, "day"),
  );
  const slotGroups = groupSlotsByAvailability(slotsQuery.data ?? []);

  if (step === REASON_STEP) {
    return (
      <BookingStepLayout
        title={t("patient_booking__reason_for_visit")}
        step={REASON_STEP}
        totalSteps={TOTAL_STEPS}
        onBack={() => setStep(SLOT_STEP)}
        footer={
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between rounded-xl bg-gray-100 px-3.5 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-xs text-gray-500">
                  {selectedSlot &&
                    dayjs(selectedSlot.start_datetime).format(
                      "ddd D MMM · h:mm A",
                    )}
                </span>
                <span className="truncate text-sm font-semibold text-gray-900">
                  {practitionerName}
                </span>
              </div>
            </div>
            <Button
              size="lg"
              className="h-12 w-full text-base"
              disabled={isSubmitting || !selectedSlot}
              onClick={handleConfirm}
            >
              {isSubmitting && (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              )}
              {appointmentId
                ? t("reschedule_appointment")
                : t("patient_booking__confirm_appointment")}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          {selectedPatient && !appointmentId && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5">
              <Avatar
                name={selectedPatient.name}
                className="size-9 shrink-0 rounded-full"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-bold text-gray-900">
                  {selectedPatient.name} ·{" "}
                  {formatPatientAge(selectedPatient, true)}
                </span>
                <span className="truncate text-xs text-gray-500">
                  {t(`GENDER__${selectedPatient.gender}`)}
                </span>
              </div>
              {/* Switching happens in place via the shared sheet — the old
                  patient-select page is gone. */}
              <button
                type="button"
                onClick={() => setSwitcherOpen(true)}
                className="shrink-0 text-sm font-semibold text-primary-700"
              >
                {t("change")}
              </button>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label htmlFor="booking-reason" className="text-sm">
              {t("patient_booking__what_brings_you_in")}
            </Label>
            <Textarea
              id="booking-reason"
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              rows={4}
              onChange={(event) => setReasonDraft(event.target.value)}
              placeholder={t("appointment_note")}
            />
            <span className="text-xs text-gray-500">
              {t("patient_booking__reason_hint")} {reason.length}/
              {REASON_MAX_LENGTH}
            </span>
          </div>
        </div>

        <PatientSwitcherSheet
          open={switcherOpen}
          onOpenChange={setSwitcherOpen}
        />
      </BookingStepLayout>
    );
  }

  return (
    <BookingStepLayout
      title={t("patient_booking__pick_a_slot")}
      subtitle={practitionerName}
      step={SLOT_STEP}
      totalSteps={TOTAL_STEPS}
      onBack={() => goBack(`/facility/${facilityId}`)}
      footer={
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{t("selected")}</span>
            <span className="text-sm font-bold text-gray-900">
              {selectedSlot
                ? dayjs(selectedSlot.start_datetime).format(
                    "ddd D MMM · h:mm A",
                  )
                : "-"}
            </span>
          </div>
          <Button
            size="lg"
            className="h-12 w-full text-base"
            disabled={!selectedSlot}
            onClick={() => setStep(REASON_STEP)}
          >
            {t("continue")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5 p-4">
        {facilityResponse?.name && (
          <p className="text-xs text-gray-600">{facilityResponse.name}</p>
        )}

        <div className="flex flex-col gap-2.5">
          <span className="text-sm font-bold text-gray-900">
            {dayjs(selectedDate).format("MMMM YYYY")}
          </span>
          <div className="grid grid-cols-6 gap-1.5">
            {dateStrip.map((day) => {
              const isSelected = day.isSame(dayjs(selectedDate), "day");
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => selectDate(day.toDate())}
                  aria-pressed={isSelected}
                  className={cn(
                    "rounded-xl border py-2 text-center transition-colors",
                    isSelected
                      ? "border-primary-700 bg-primary-700 text-white"
                      : "border-gray-200 bg-white hover:border-gray-300",
                  )}
                >
                  <div
                    className={cn(
                      "text-[10px] font-semibold uppercase",
                      isSelected ? "opacity-85" : "text-gray-500",
                    )}
                  >
                    {day.format("ddd")}
                  </div>
                  <div className="text-lg font-bold">{day.format("D")}</div>
                </button>
              );
            })}
          </div>
        </div>

        {slotsQuery.isLoading ? (
          <p className="text-sm text-gray-600">{t("loading")}</p>
        ) : slotGroups.length ? (
          slotGroups.map(({ availability, slots }) => (
            <div key={availability.name} className="flex flex-col gap-2.5">
              <span className="text-sm font-bold text-gray-900">
                {availability.name}
              </span>
              <div className="grid grid-cols-3 gap-2">
                {slots.map((slot) => {
                  const isFull = slot.allocated >= availability.tokens_per_slot;
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={isFull}
                      onClick={() => setSelectedSlot({ ...slot, availability })}
                      className={cn(
                        "rounded-xl border py-2.5 text-center text-sm font-semibold transition-colors",
                        isSelected
                          ? "border-primary-700 bg-primary-700 text-white"
                          : isFull
                            ? "border-gray-200 bg-white text-gray-400 line-through"
                            : "border-gray-200 bg-white text-gray-900 hover:border-primary-200",
                      )}
                    >
                      {dayjs(slot.start_datetime).format("h:mm A")}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">{t("no_slots_available")}</p>
        )}
      </div>
    </BookingStepLayout>
  );
}
