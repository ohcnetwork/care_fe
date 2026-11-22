import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, Clock, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { EncounterActions } from "@/components/Encounter/EncounterActions";
import { PatientAge } from "@/components/Patient/PatientAge";
import { TagBadges } from "@/components/Tags/TagBadges";

import { formatDateTime, formatName, relativeDate } from "@/Utils/utils";
import {
  ENCOUNTER_PRIORITY_COLORS,
  ENCOUNTER_STATUS_COLORS,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { LocationRead } from "@/types/location/location";

import { BedPlate } from "./BedPlate";

interface BedPatientDetailsProps {
  bed: LocationRead;
  encounter: EncounterRead;
  facilityId: string;
}

/**
 * An occupied bed. The whole tile opens the encounter: its link is stretched
 * over the tile, and the other controls sit above it.
 */
export function BedPatientDetails({
  bed,
  encounter,
  facilityId,
}: BedPatientDetailsProps) {
  const { t } = useTranslation();
  const { patient } = encounter;
  const doctor = encounter.care_team?.[0]?.member;
  const admittedAt = encounter.period?.start;
  const isRoutine = !encounter.priority || encounter.priority === "routine";

  return (
    <>
      <div className="flex flex-1 flex-col gap-3 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <BedPlate name={bed.name} state="patient" />
          <div className="flex shrink-0 items-center gap-1.5">
            {/* A patient on an out-of-use bed: flag it without hiding the patient. */}
            {bed.status !== "active" && (
              <Badge variant="secondary" size="sm">
                {t("inactive")}
              </Badge>
            )}
            {admittedAt && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" aria-hidden="true" />
                {relativeDate(admittedAt, true)}
              </p>
            )}
            <div className="relative z-10 empty:hidden">
              <EncounterActions encounter={encounter} />
            </div>
          </div>
        </div>
        <TagBadges tags={bed.tags} size="xs" hierarchyDisplay />

        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-base leading-snug font-semibold break-words">
              {patient.name}
            </h3>
            <Badge
              variant={ENCOUNTER_STATUS_COLORS[encounter.status]}
              size="sm"
              className="mt-0.5"
            >
              {t(`encounter_status__${encounter.status}`)}
            </Badge>
          </div>
          <p className="relative z-10 w-fit text-muted-foreground">
            <PatientAge patient={patient} />
            {" · "}
            {t(`GENDER__${patient.gender}`)}
          </p>
        </div>

        <ul className="space-y-1 text-muted-foreground">
          {doctor && (
            <li className="flex items-center gap-1.5">
              <Stethoscope className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">{formatName(doctor)}</span>
            </li>
          )}
          {admittedAt && (
            <li className="flex items-center gap-1.5">
              <CalendarClock className="size-3.5 shrink-0" aria-hidden="true" />
              <span className="sr-only">{t("admitted")}</span>
              {formatDateTime(admittedAt, "DD/MM/YYYY, hh:mm A")}
            </li>
          )}
        </ul>

        {/* Colour is kept for what needs attention; the rest stays neutral. */}
        <div className="flex flex-wrap gap-1">
          {patient.deceased_datetime && (
            <Badge variant="destructive" size="sm">
              {t("deceased")}
            </Badge>
          )}
          {encounter.encounter_class && (
            <Badge
              variant={
                encounter.encounter_class === "emer" ? "destructive" : "outline"
              }
              size="sm"
            >
              {t(`encounter_class__${encounter.encounter_class}`)}
            </Badge>
          )}
          {encounter.priority && (
            <Badge
              variant={
                isRoutine
                  ? "outline"
                  : ENCOUNTER_PRIORITY_COLORS[encounter.priority]
              }
              size="sm"
            >
              {t(`encounter_priority__${encounter.priority}`)}
            </Badge>
          )}
          <TagBadges
            tags={encounter.tags}
            size="sm"
            hierarchyDisplay
            className="contents"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3.5 py-2">
        <Link
          to="/facility/$facilityId/patients/home"
          params={{ facilityId }}
          search={{
            phone_number: patient.phone_number,
            year_of_birth: patient.year_of_birth?.toString() || "",
            partial_id: patient.id.slice(0, 5),
          }}
          className="relative z-10 rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          {t("patient_home")}
        </Link>
        <Link
          to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
          params={{
            facilityId,
            patientId: patient.id,
            encounterId: encounter.id,
            tab: "updates",
          }}
          className="flex items-center gap-1 font-medium text-primary outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ring"
        >
          {t("view_encounter")}
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </>
  );
}
