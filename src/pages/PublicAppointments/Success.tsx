import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { CalendarPlus, Check, Clock, Share2 } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import Loading from "@/components/Common/Loading";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatPatientAge } from "@/Utils/utils";
import PublicAppointmentApi from "@/types/scheduling/PublicAppointmentApi";
import {
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

/** Local (floating) ICS timestamp — slot datetimes are timezone naive. */
const icsStamp = (value: string) => dayjs(value).format("YYYYMMDDTHHmmss");

function buildCalendarFile(appointment: PublicAppointment, title: string) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//care//appointment//EN",
    "BEGIN:VEVENT",
    `UID:${appointment.id}`,
    `DTSTART:${icsStamp(appointment.token_slot.start_datetime)}`,
    `DTEND:${icsStamp(appointment.token_slot.end_datetime)}`,
    `SUMMARY:${title}`,
    `LOCATION:${appointment.facility.name}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(
    lines.join("\r\n"),
  )}`;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex justify-between gap-3.5">
      <span className="shrink-0 text-sm text-gray-500">{label}</span>
      <span className="text-right text-sm font-semibold text-gray-900">
        {children}
      </span>
    </div>
  );
}

export function AppointmentSuccess(props: { appointmentId: string }) {
  const { appointmentId } = props;
  const { t } = useTranslation();

  const { tokenData } = usePatientContext();

  // Deliberately unscoped: the booking may be for a linked family member
  // rather than the profile the app is currently showing.
  const { data, isLoading } = useQuery({
    queryKey: ["appointment", tokenData?.phoneNumber],
    queryFn: query(PublicAppointmentApi.getAppointments, {
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  const appointment = data?.results.find((entry) => entry.id === appointmentId);

  if (isLoading) {
    return <Loading />;
  }

  if (!appointment) {
    return (
      <div className="mx-auto max-w-[480px] p-10 text-center">
        <p className="text-sm text-gray-600">{t("appointment_not_found")}</p>
        <Button className="mt-6" asChild>
          <Link href="/patient/home">{t("patient_booking__back_to_home")}</Link>
        </Button>
      </div>
    );
  }

  const start = dayjs(appointment.token_slot.start_datetime);
  const resourceName = formatScheduleResourceName(appointment);
  const summaryTitle = t("patient_booking__calendar_title", {
    name: resourceName,
  });

  const handleShare = async () => {
    const text = [
      summaryTitle,
      start.format("ddd, D MMM YYYY · h:mm A"),
      appointment.facility.name,
      appointment.token
        ? `${t("token")} ${renderTokenNumber(appointment.token)}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    if (navigator.share) {
      try {
        await navigator.share({ title: summaryTitle, text });
      } catch {
        // Dismissing the native share sheet is not an error worth surfacing.
      }
      return;
    }

    await navigator.clipboard.writeText(text);
    toast.success(t("copied_to_clipboard"));
  };

  return (
    <div className="min-h-dvh bg-gray-50">
      <div className="mx-auto flex max-w-[480px] flex-col">
        <div className="bg-primary-700 px-7 pb-12 pt-10 text-center text-white">
          <span className="mx-auto mb-3.5 flex size-16 items-center justify-center rounded-full bg-white/20">
            <Check className="size-8" strokeWidth={2.6} />
          </span>
          <h1 className="text-2xl font-bold tracking-tight">
            {t("appointment_booking_success")}
          </h1>
        </div>

        <div className="-mt-6 flex flex-col gap-4 px-4 pb-8">
          <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            {appointment.token && (
              <div className="flex flex-col items-center gap-0.5 border-b border-dashed border-gray-300 pb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {t("patient_booking__your_token")}
                </span>
                <span className="text-[42px] font-bold leading-none tracking-tight text-primary-700">
                  {renderTokenNumber(appointment.token)}
                </span>
              </div>
            )}

            <div className="flex flex-col gap-2.5">
              <DetailRow label={t("patient")}>
                {appointment.patient.name} ·{" "}
                {formatPatientAge(appointment.patient, true)}
              </DetailRow>
              <DetailRow label={t(appointment.resource_type, { count: 1 })}>
                {resourceName}
              </DetailRow>
              <DetailRow label={t("date")}>
                {start.format("ddd, D MMM YYYY · h:mm A")}
              </DetailRow>
              <DetailRow label={t("facility")}>
                {appointment.facility.name}
              </DetailRow>
              <DetailRow label={t("status")}>{t(appointment.status)}</DetailRow>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" asChild>
              <a
                href={buildCalendarFile(appointment, summaryTitle)}
                download={`appointment-${appointment.id}.ics`}
              >
                <CalendarPlus className="size-4" />
                {t("patient_booking__add_to_calendar")}
              </a>
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="size-4" />
              {t("share")}
            </Button>
          </div>

          <div className="flex gap-2.5 rounded-2xl border border-gray-200 bg-white p-4">
            <Clock
              className="mt-0.5 size-4 shrink-0 text-primary-700"
              strokeWidth={1.9}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-900">
                {t("patient_booking__arrive_early_heading")}
              </span>
              <span className="text-xs leading-relaxed text-gray-600">
                {t("patient_booking__arrive_early_description")}
              </span>
            </div>
          </div>

          <Button variant="secondary" size="lg" className="h-12" asChild>
            <Link href="/patient/home">
              {t("patient_booking__back_to_home")}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
