import {
  differenceInMilliseconds,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
} from "date-fns";
import { AnimatePresence, motion } from "motion/react";
import { ReactNode, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { PatientAge } from "@/components/Patient/PatientAge";
import {
  ENCOUNTER_STATUS_COLORS,
  EncounterListRead,
  EncounterRead,
  EncounterStatus,
} from "@/types/emr/encounter/encounter";
import { formatDateTime, parseDate, relativeTime } from "@/Utils/date";

type Encounter = EncounterListRead | EncounterRead;

// ─── Shared minute ticker ────────────────────────────────────────────────────
// One interval for every mounted card and row, started with the first
// subscriber and stopped with the last. It only re-renders; it never refetches.
const tickListeners = new Set<() => void>();
let tickTimer: ReturnType<typeof setInterval> | null = null;
let tick = 0;

function subscribeToMinuteTick(listener: () => void) {
  tickListeners.add(listener);
  tickTimer ??= setInterval(() => {
    tick += 1;
    tickListeners.forEach((notify) => notify());
  }, 60_000);
  return () => {
    tickListeners.delete(listener);
    if (!tickListeners.size && tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
  };
}

const getTick = () => tick;

/** Re-renders at most once a minute, from a single shared timer. */
export function useMinuteTick() {
  return useSyncExternalStore(subscribeToMinuteTick, getTick, getTick);
}

// ─── Time wording ────────────────────────────────────────────────────────────
export interface EncounterTimeInfo {
  /** "Running for", "Scheduled for", "Completed · lasted 4h 25m", … */
  label: string;
  /** "2h 09m", "Today, 2:00 PM", or the not-started text. */
  value: string;
  /** "since today, 8:35 AM", "in 3 hours", "ended 2 days ago". */
  context?: string;
  /** The value reads as cancelled: struck through and muted. */
  struck: boolean;
  /** The encounter is running now: show the pulsing dot. */
  live: boolean;
}

/** "2h 09m" under a day, "3d 4h" from a day on, "45m" under an hour. */
export function formatEncounterDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${String(mins).padStart(2, "0")}m`;
  return `${mins}m`;
}

function formatWhen(date: Date, t: (key: string) => string) {
  const time = formatDateTime(date, "h:mm a");
  if (isToday(date)) return `${t("today")}, ${time}`;
  if (isTomorrow(date)) return `${t("tomorrow")}, ${time}`;
  if (isYesterday(date)) return `${t("yesterday")}, ${time}`;
  return formatDateTime(
    date,
    isSameYear(date, new Date()) ? "EEE d MMM, h:mm a" : "d MMM yyyy, h:mm a",
  );
}

const ENDED_STATUSES: EncounterStatus[] = [
  EncounterStatus.COMPLETED,
  EncounterStatus.DISCHARGED,
];
const CANCELLED_STATUSES: EncounterStatus[] = [
  EncounterStatus.CANCELLED,
  EncounterStatus.ENTERED_IN_ERROR,
  EncounterStatus.DISCONTINUED,
];

/**
 * Words the period for the status, from `period` alone. Ticks once a minute
 * so a running duration stays current.
 */
export function useEncounterTime(encounter: Encounter): EncounterTimeInfo {
  const { t } = useTranslation();
  useMinuteTick();
  const { status, period } = encounter;
  const start = period.start ? parseDate(period.start) : null;
  const end = period.end ? parseDate(period.end) : null;

  if (ENDED_STATUSES.includes(status)) {
    const lasted =
      start && end
        ? formatEncounterDuration(differenceInMilliseconds(end, start))
        : undefined;
    const at = end ?? start;
    return {
      label: lasted
        ? t("encounter_time_completed_lasted", { duration: lasted })
        : t("encounter_time_completed"),
      value: at ? formatWhen(at, t) : t("not_started"),
      context: end
        ? t("encounter_time_ended", { time: relativeTime(end) })
        : undefined,
      struck: false,
      live: false,
    };
  }
  if (CANCELLED_STATUSES.includes(status)) {
    return {
      label: t("encounter_time_was_scheduled_for"),
      value: start ? formatWhen(start, t) : t("not_started"),
      struck: !!start,
      live: false,
    };
  }
  if (status === EncounterStatus.PLANNED) {
    return {
      label: t("encounter_time_scheduled_for"),
      value: start ? formatWhen(start, t) : t("not_started"),
      context: start ? relativeTime(start) : undefined,
      struck: false,
      live: false,
    };
  }
  if (
    status === EncounterStatus.IN_PROGRESS ||
    status === EncounterStatus.ON_HOLD
  ) {
    return {
      label: t("encounter_time_running_for"),
      value: start
        ? formatEncounterDuration(differenceInMilliseconds(new Date(), start))
        : t("not_started"),
      context: start
        ? t("encounter_time_since", { time: formatWhen(start, t) })
        : undefined,
      struck: false,
      live: !!start && status === EncounterStatus.IN_PROGRESS,
    };
  }
  return {
    label: t("start_date"),
    value: start ? formatWhen(start, t) : t("not_started"),
    struck: false,
    live: false,
  };
}

/** A small pulsing dot for a running encounter. */
export function LiveDot() {
  return (
    <span aria-hidden="true" className="relative inline-flex size-1.5 shrink-0">
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60 motion-reduce:hidden" />
      <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
    </span>
  );
}

/**
 * The card's time block: a label line, then the value and its context.
 * `action` sits at its right end, such as the encounter's gear menu.
 */
export function EncounterTimeBlock({
  encounter,
  action,
}: {
  encounter: Encounter;
  action?: ReactNode;
}) {
  const time = useEncounterTime(encounter);
  return (
    <div
      data-slot="encounter-time"
      className="flex items-center gap-2 rounded-lg bg-soft-background px-3 py-2"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="truncate">{time.label}</span>
        </div>
        <div className="flex min-w-0 items-baseline gap-1.5">
          {time.live && <LiveDot />}
          <span
            className={cn(
              "shrink-0 text-sm font-medium tabular-nums",
              time.struck && "text-muted-foreground line-through",
            )}
          >
            {time.value}
          </span>
          {time.context && (
            <span className="truncate text-xs text-muted-foreground">
              {time.context}
            </span>
          )}
        </div>
      </div>
      {action}
    </div>
  );
}

/** The table's When cell: the value above its context, same wording. */
export function EncounterTimeCell({ encounter }: { encounter: Encounter }) {
  const time = useEncounterTime(encounter);
  return (
    <div className="flex min-w-0 flex-col" title={time.label}>
      <span className="flex items-center gap-1.5">
        {time.live && <LiveDot />}
        <span
          className={cn(
            "truncate font-medium tabular-nums",
            time.struck && "text-muted-foreground line-through",
          )}
        >
          {time.value}
        </span>
      </span>
      <span className="truncate text-xs text-muted-foreground">
        {time.context ?? time.label}
      </span>
    </div>
  );
}

// ─── Status badge ────────────────────────────────────────────────────────────
/** The status badge, cross-fading when the status changes. */
export function EncounterStatusBadge({
  status,
  size = "md",
  className,
}: {
  status: EncounterStatus;
  size?: "sm" | "md";
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={status}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="inline-flex"
      >
        <Badge
          variant={ENCOUNTER_STATUS_COLORS[status]}
          size={size}
          dot
          className={className}
        >
          {t(`encounter_status__${status}`)}
        </Badge>
      </motion.span>
    </AnimatePresence>
  );
}

// ─── Patient meta ────────────────────────────────────────────────────────────
/** "12 y · Female · b. 2014": age (with its tooltip), gender, birth year. */
export function PatientMeta({
  patient,
  className,
}: {
  patient: Encounter["patient"];
  className?: string;
}) {
  const { t } = useTranslation();
  const birthYear = patient.date_of_birth
    ? parseDate(patient.date_of_birth).getFullYear()
    : null;
  return (
    <p
      className={cn(
        "flex min-w-0 items-center gap-1 truncate text-xs text-muted-foreground",
        className,
      )}
    >
      <PatientAge patient={patient} abbreviated />
      <span aria-hidden="true">·</span>
      <span className="truncate">{t(`GENDER__${patient.gender}`)}</span>
      {birthYear && (
        <>
          <span aria-hidden="true">·</span>
          <span className="shrink-0">
            {t("encounter_meta_born", { year: birthYear })}
          </span>
        </>
      )}
    </p>
  );
}

// ─── Links ───────────────────────────────────────────────────────────────────
/** Params of the Patient Home link, as the list has always passed them. */
export function patientHomeSearch(patient: Encounter["patient"]) {
  return {
    phone_number: patient.phone_number,
    year_of_birth: patient.year_of_birth?.toString() || "",
    partial_id: patient.id.slice(0, 5),
  };
}

/** Params of the View Encounter link. */
export function viewEncounterParams(encounter: Encounter, facilityId: string) {
  return {
    facilityId,
    patientId: encounter.patient.id,
    encounterId: encounter.id,
    tab: "updates",
  };
}
