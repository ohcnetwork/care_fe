import { CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";
import {
  PatientBadge,
  type PatientBadgeTone,
} from "@/components/Patient/PatientBadge";

import { usePatientAppointments } from "@/hooks/usePatientPortalData";

// Plugin-extended instance — `fromNow()` needs dayjs/plugin/relativeTime.
import dayjs from "@/Utils/dayjs";
import { formatSlotTimeRange } from "@/pages/Appointments/utils";

import {
  AppointmentStatus,
  PublicAppointment,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

type VisitsTab = "upcoming" | "history";

/**
 * The staff-side `APPOINTMENT_STATUS_COLORS` spans six hues; the portal keeps
 * to its own palette — green for a live or finished visit, gray for everything
 * that did not happen.
 */
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
 * History arrives newest-first, so a run of consecutive rows sharing a year is
 * exactly the group the design labels.
 */
function groupVisitsByYear(history: PublicAppointment[]) {
  return history.reduce<{ year: string; visits: PublicAppointment[] }[]>(
    (groups, appointment) => {
      const year = dayjs(appointment.token_slot.start_datetime).format("YYYY");
      const current = groups.at(-1);
      if (current?.year === year) {
        current.visits.push(appointment);
      } else {
        groups.push({ year, visits: [appointment] });
      }
      return groups;
    },
    [],
  );
}

/**
 * Reschedule and cancel used to sit on this card, which put two destructive-ish
 * decisions in front of someone who was only scanning the list. The card now
 * carries the appointment's own detail and opens the visit, where those actions
 * live alongside the full context.
 */
function UpcomingVisitCard({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);

  return (
    <Link
      href={`/patient/visits/${appointment.id}`}
      className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-linear-to-r from-primary-100/50 to-transparent p-4 hover:border-primary-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary-700">
          {start.fromNow()}
        </span>
        {appointment.token && (
          <PatientBadge tone="solid">
            {t("token")} {renderTokenNumber(appointment.token)}
          </PatientBadge>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="w-13 shrink-0 rounded-xl border border-primary-200 bg-white py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700">
            {start.format("ddd")}
          </div>
          <div className="text-xl font-bold leading-tight text-gray-900">
            {start.format("DD")}
          </div>
          <div className="text-[10px] text-gray-500">{start.format("MMM")}</div>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          <span className="truncate text-sm text-gray-600">
            {appointment.token_slot.availability.name} ·{" "}
            {formatSlotTimeRange(appointment.token_slot)}
          </span>
          <span className="truncate text-sm text-gray-600">
            {appointment.facility.name}
          </span>
        </div>
        <ChevronRight className="mt-0.5 size-4.5 shrink-0 text-primary-700" />
      </div>
    </Link>
  );
}

function PastVisitRow({ appointment }: { appointment: PublicAppointment }) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);
  const isMissed =
    appointment.status === AppointmentStatus.NO_SHOW ||
    appointment.status === AppointmentStatus.CANCELLED;

  return (
    <Link
      href={`/patient/visits/${appointment.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 hover:border-gray-300",
        isMissed && "opacity-75",
      )}
    >
      <div className="w-11 shrink-0 text-center">
        <div className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
          {start.format("MMM")}
        </div>
        <div className="text-lg font-bold leading-tight text-gray-900">
          {start.format("DD")}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          {/* A visit that went ahead needs no pill — only the exceptions do. */}
          {appointment.status !== AppointmentStatus.FULFILLED && (
            <PatientBadge tone={VISIT_STATUS_TONES[appointment.status]}>
              {t(appointment.status)}
            </PatientBadge>
          )}
        </div>
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
      </div>
      <ChevronRight className="size-4.5 shrink-0 text-gray-600" />
    </Link>
  );
}

export default function PatientVisits() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<VisitsTab>("upcoming");
  const { upcoming, history, isLoading } = usePatientAppointments();

  return (
    <PatientAppShell
      title={t("visits")}
      headerTabs={
        <PatientHeaderTabs
          value={tab}
          onChange={setTab}
          tabs={[
            { key: "upcoming", label: `${t("upcoming")} · ${upcoming.length}` },
            { key: "history", label: `${t("history")} · ${history.length}` },
          ]}
        />
      }
    >
      <div className="flex flex-col gap-3 p-4">
        {isLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : tab === "upcoming" ? (
          upcoming.length ? (
            upcoming.map((appointment) => (
              <UpcomingVisitCard
                key={appointment.id}
                appointment={appointment}
              />
            ))
          ) : (
            <EmptyState
              icon={<CalendarDays className="size-6 text-primary-700" />}
              title={t("no_appointments")}
              description={t("patient_visits__no_upcoming_description")}
            />
          )
        ) : history.length ? (
          groupVisitsByYear(history).map(({ year, visits }) => (
            <div key={year} className="flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.09em] text-gray-500">
                {year === dayjs().format("YYYY")
                  ? t("patient_visits__earlier_this_year")
                  : year}
              </span>
              {visits.map((appointment) => (
                <PastVisitRow key={appointment.id} appointment={appointment} />
              ))}
            </div>
          ))
        ) : (
          <EmptyState
            icon={<CalendarDays className="size-6 text-primary-700" />}
            title={t("patient_visits__no_history")}
          />
        )}
      </div>
    </PatientAppShell>
  );
}
