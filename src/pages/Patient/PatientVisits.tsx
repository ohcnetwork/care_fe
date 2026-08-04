import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

import {
  PatientAppShell,
  PatientHeaderTabs,
} from "@/components/Patient/PatientAppShell";
import { VisitCard } from "@/components/Patient/VisitCard";

import { usePatientAppointments } from "@/hooks/usePatientPortalData";

// Plugin-extended instance — `fromNow()` needs dayjs/plugin/relativeTime.
import dayjs from "@/Utils/dayjs";
import { PublicAppointment } from "@/types/scheduling/schedule";

type VisitsTab = "upcoming" | "history";

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
            {
              key: "upcoming",
              label: `${t("upcoming")}${!isLoading ? ` · ${upcoming.length}` : " ···"}`,
            },
            {
              key: "history",
              label: `${t("history")}${!isLoading ? ` · ${history.length}` : " ···"}`,
            },
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
              <VisitCard
                key={appointment.id}
                variant="upcoming"
                appointment={appointment}
              />
            ))
          ) : (
            <EmptyState
              icon={
                <CalendarDays
                  className="size-7 text-gray-500 mx-3"
                  strokeWidth={1.6}
                />
              }
              title={t("no_appointments")}
              description={t("patient_visits__no_upcoming_description")}
              className="gap-3 rounded-2xl border-gray-300 px-5 py-7 shadow-none"
              action={
                <Button className="w-full" asChild>
                  <Link href="/nearby_facilities">
                    {t("patient_home__book_first_appointment")}
                  </Link>
                </Button>
              }
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
                <VisitCard
                  key={appointment.id}
                  variant="past"
                  appointment={appointment}
                />
              ))}
            </div>
          ))
        ) : (
          <EmptyState
            icon={
              <CalendarDays
                className="size-7 text-gray-500 mx-3"
                strokeWidth={1.6}
              />
            }
            title={t("no_appointments")}
            description={t("patient_visits__no_upcoming_description")}
            className="gap-3 rounded-2xl border-gray-300 px-5 py-7 shadow-none"
            action={
              <Button className="w-full" asChild>
                <Link href="/nearby_facilities">
                  {t("patient_home__book_first_appointment")}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </PatientAppShell>
  );
}
