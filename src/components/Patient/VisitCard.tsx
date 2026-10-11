import { ChevronRight } from "lucide-react";
import { Link } from "raviger";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  PatientBadge,
  type PatientBadgeTone,
} from "@/components/Patient/PatientBadge";

import dayjs from "@/Utils/dayjs";
import { formatSlotTimeRange } from "@/pages/Appointments/utils";

import {
  AppointmentStatus,
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

export const VISIT_STATUS_TONES: Record<AppointmentStatus, PatientBadgeTone> = {
  proposed: "neutral",
  pending: "neutral",
  booked: "primary",
  arrived: "primary",
  checked_in: "primary",
  waitlist: "neutral",
  in_consultation: "primary",
  fulfilled: "success",
  noshow: "neutral",
  cancelled: "neutral",
  entered_in_error: "neutral",
  rescheduled: "neutral",
};

/**
 * One visit — highlighted with slot time and a relative-time eyebrow for
 * `upcoming`, or a flatter row with a status pill for `past`. Reschedule and
 * cancel are deliberately absent from either: both actions want the full
 * appointment in front of you, which lives on the visit screen this card opens.
 */
export function VisitCard({
  appointment,
  variant,
  eyebrow,
}: {
  appointment: PublicAppointment;
  variant: "upcoming" | "past";
  eyebrow?: ReactNode;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);
  const isUpcoming = variant === "upcoming";
  const isMissed =
    appointment.status === AppointmentStatus.NO_SHOW ||
    appointment.status === AppointmentStatus.CANCELLED;

  return (
    <Link
      href={`/patient/visits/${appointment.id}`}
      className={cn(
        "flex rounded-2xl border p-3.5 hover:border-gray-300",
        isUpcoming
          ? "flex-col gap-3 border-primary-200 bg-linear-to-r from-primary-100/50 to-transparent p-4 hover:border-primary-700"
          : "items-center gap-3 border-gray-200 bg-white",
        !isUpcoming && isMissed && "opacity-75",
      )}
    >
      {isUpcoming && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-primary-700">
            {eyebrow ?? start.fromNow()}
          </span>
          {appointment.token && (
            <PatientBadge tone="solid">
              {t("token")} {renderTokenNumber(appointment.token)}
            </PatientBadge>
          )}
        </div>
      )}

      <div className="flex items-start gap-3">
        {isUpcoming ? (
          <div className="w-13 shrink-0 rounded-xl border border-primary-200 bg-white py-1.5 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700">
              {start.format("ddd")}
            </div>
            <div className="text-xl font-bold leading-tight text-gray-900">
              {start.format("DD")}
            </div>
            <div className="text-[10px] text-gray-500">
              {start.format("MMM")}
            </div>
          </div>
        ) : (
          <div className="w-11 shrink-0 text-center">
            <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
              {start.format("MMM")}
            </div>
            <div className="text-lg font-bold leading-tight text-gray-900">
              {start.format("DD")}
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "truncate font-bold text-gray-900",
                !isUpcoming && "text-sm",
              )}
            >
              {formatScheduleResourceName(appointment)}
            </span>
            {!isUpcoming &&
              appointment.status !== AppointmentStatus.FULFILLED && (
                <PatientBadge tone={VISIT_STATUS_TONES[appointment.status]}>
                  {t(appointment.status)}
                </PatientBadge>
              )}
          </div>

          {isUpcoming ? (
            <>
              <span className="truncate text-sm text-gray-600">
                {appointment.token_slot.availability.name} ·{" "}
                {formatSlotTimeRange(appointment.token_slot)}
              </span>
              <span className="truncate text-sm text-gray-600">
                {appointment.facility.name}
              </span>
            </>
          ) : (
            <>
              <span className="truncate text-xs text-gray-600">
                {appointment.facility.name}
              </span>
              <span className="truncate text-xs text-gray-600">
                {[
                  start.format("h:mm A"),
                  appointment.token &&
                    `${t("token")} ${renderTokenNumber(appointment.token)}`,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </>
          )}
        </div>

        <ChevronRight
          className={cn(
            "size-4.5 shrink-0",
            isUpcoming ? "mt-0.5 text-primary-700" : "text-gray-600",
          )}
        />
      </div>
    </Link>
  );
}
