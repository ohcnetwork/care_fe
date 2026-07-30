import { CalendarDays, ChevronRight } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";

import {
  CancelAppointmentButton,
  isAppointmentCancellable,
} from "@/components/Patient/CancelAppointmentButton";
import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";

import { usePatientAppointments } from "@/hooks/usePatientPortalData";

// Plugin-extended instance — `fromNow()` needs dayjs/plugin/relativeTime.
import dayjs from "@/Utils/dayjs";

import {
  APPOINTMENT_STATUS_COLORS,
  PublicAppointment,
  SchedulableResourceType,
  formatScheduleResourceName,
} from "@/types/scheduling/schedule";
import { renderTokenNumber } from "@/types/tokens/token/token";

type VisitsTab = "upcoming" | "history";

function UpcomingVisitCard({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);
  const canReschedule =
    appointment.resource_type === SchedulableResourceType.Practitioner;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary-200 bg-primary-50 p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-widest text-primary-700">
          {start.fromNow()}
        </span>
        {appointment.token && (
          <Badge variant="primary">
            {t("token")} {renderTokenNumber(appointment.token)}
          </Badge>
        )}
      </div>
      <div className="flex items-start gap-3">
        <div className="w-[52px] shrink-0 rounded-xl border border-primary-200 bg-white py-1.5 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wide text-primary-700">
            {start.format("ddd")}
          </div>
          <div className="text-xl font-bold leading-tight text-gray-900">
            {start.format("DD")}
          </div>
          <div className="text-[10px] text-gray-500">{start.format("MMM")}</div>
        </div>
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          <span className="text-[13px] text-gray-600">
            {start.format("h:mm A")} · {appointment.facility.name}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/patient/visits/${appointment.id}`}>
            {t("view_details")}
          </Link>
        </Button>
        {canReschedule && (
          <Button size="sm" asChild>
            <Link
              href={`/facility/${appointment.facility.id}/appointments/${appointment.resource.id}/reschedule/${appointment.id}`}
            >
              {t("reschedule")}
            </Link>
          </Button>
        )}
        {isAppointmentCancellable(appointment) && (
          <CancelAppointmentButton
            appointment={appointment}
            size="sm"
            className="col-span-2"
          />
        )}
      </div>
    </div>
  );
}

function PastVisitRow({ appointment }: { appointment: PublicAppointment }) {
  const { t } = useTranslation();
  const start = dayjs(appointment.token_slot.start_datetime);
  const isMissed =
    appointment.status === "noshow" || appointment.status === "cancelled";

  return (
    <Link
      href={`/patient/visits/${appointment.id}`}
      className={cn(
        "flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 hover:border-gray-300",
        isMissed && "opacity-75",
      )}
    >
      <div className="w-11 shrink-0 text-center">
        <div className="text-[9.5px] font-bold uppercase tracking-wide text-gray-500">
          {start.format("MMM")}
        </div>
        <div className="text-lg font-bold leading-tight text-gray-900">
          {start.format("DD")}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-[14.5px] font-bold text-gray-900">
            {formatScheduleResourceName(appointment)}
          </span>
          <Badge variant={APPOINTMENT_STATUS_COLORS[appointment.status]}>
            {t(appointment.status)}
          </Badge>
        </div>
        <span className="truncate text-xs text-gray-600">
          {appointment.facility.name}
        </span>
      </div>
      <ChevronRight className="size-4 shrink-0 text-gray-400" />
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
          history.map((appointment) => (
            <PastVisitRow key={appointment.id} appointment={appointment} />
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
