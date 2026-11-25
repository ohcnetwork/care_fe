import { Link } from "@tanstack/react-router";
import { ChevronRight, House, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EncounterActions } from "@/components/Encounter/EncounterActions";
import {
  EncounterStatusBadge,
  EncounterTimeCell,
  PatientMeta,
  patientHomeSearch,
  viewEncounterParams,
} from "@/components/Encounter/EncounterCardParts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import {
  ENCOUNTER_CLASSES_COLORS,
  ENCOUNTER_PRIORITY_COLORS,
  EncounterListRead,
  EncounterRead,
} from "@/types/emr/encounter/encounter";
import { LocationTypeIcons } from "@/types/location/location";
import { getLocationPath } from "@/types/location/utils";
import { formatName } from "@/Utils/utils";

interface EncounterTableProps {
  encounters: (EncounterListRead | EncounterRead)[];
  facilityId: string;
  /** Shows skeleton rows instead of the encounters. */
  loading?: boolean;
  skeletonRows?: number;
}

/**
 * The list view of the encounters list: one row per encounter, from the
 * list response alone. The whole row opens the encounter through a
 * stretched link on the name; the action buttons sit above it. No sorting:
 * the list API isn't asked to order, and the page is only one of many.
 */
export function EncounterTable({
  encounters,
  facilityId,
  loading = false,
  skeletonRows = 6,
}: EncounterTableProps) {
  const { t } = useTranslation();
  const headCell =
    "sticky top-0 z-20 h-9 bg-soft-background text-xs font-semibold text-muted-foreground";

  return (
    // Fixed layout: the columns share the frame's width and truncate, so the
    // table only scrolls below its minimum width.
    <Table className="min-w-[880px] table-fixed">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className={`${headCell} w-[20%]`}>
            {t("patient")}
          </TableHead>
          <TableHead className={`${headCell} w-[11%]`}>{t("status")}</TableHead>
          <TableHead className={`${headCell} w-[15%]`}>
            {t("encounter_table_when")}
          </TableHead>
          <TableHead className={`${headCell} w-[10%]`}>{t("class")}</TableHead>
          <TableHead className={`${headCell} w-[10%]`}>
            {t("priority")}
          </TableHead>
          <TableHead className={`${headCell} w-[11%]`}>
            {t("location")}
          </TableHead>
          <TableHead className={`${headCell} w-[10%]`}>
            {t("practitioner")}
          </TableHead>
          <TableHead className={`${headCell} w-[8%]`}>
            {t("encounter_id")}
          </TableHead>
          <TableHead className={`${headCell} w-28 text-right`}>
            {t("actions")}
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loading
          ? Array.from({ length: skeletonRows }, (_, index) => (
              <TableRow key={index} aria-hidden="true" className="[&>td]:py-2">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="size-8 rounded-lg" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-20 rounded-sm" />
                </TableCell>
                <TableCell>
                  <div className="space-y-1.5">
                    <Skeleton className="h-3.5 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-sm" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-5 w-16 rounded-sm" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="size-8 rounded-md" />
                  </div>
                </TableCell>
              </TableRow>
            ))
          : encounters.map((encounter) => (
              <EncounterTableRow
                key={encounter.id}
                encounter={encounter}
                facilityId={facilityId}
              />
            ))}
      </TableBody>
    </Table>
  );
}

function EncounterTableRow({
  encounter,
  facilityId,
}: {
  encounter: EncounterListRead | EncounterRead;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { patient } = encounter;
  const practitioner = encounter.care_team?.[0]?.member;
  const location = encounter.current_location;
  const LocationIcon = location ? LocationTypeIcons[location.form] : MapPin;
  const muted = "text-xs text-muted-foreground";

  return (
    <TableRow
      data-cy="encounter-row"
      data-status={encounter.status}
      className="relative transition-colors hover:bg-muted/50 [&>td]:py-2"
    >
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar
            name={patient.name}
            className="size-8 shrink-0 rounded-lg text-[11px]"
          />
          <div className="min-w-0">
            <Link
              to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
              params={viewEncounterParams(encounter, facilityId)}
              // Stretched over the row: the whole row opens the encounter.
              className="block truncate font-semibold outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring"
            >
              {patient.name}
            </Link>
            <PatientMeta patient={patient} />
          </div>
        </div>
      </TableCell>
      <TableCell className="whitespace-normal">
        <div className="flex flex-wrap items-center gap-1">
          {patient.deceased_datetime && (
            <Badge variant="destructive" size="sm">
              {t("deceased")}
            </Badge>
          )}
          <EncounterStatusBadge status={encounter.status} size="sm" />
        </div>
      </TableCell>
      <TableCell>
        <EncounterTimeCell encounter={encounter} />
      </TableCell>
      <TableCell className="overflow-hidden">
        <Badge
          variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
          size="sm"
          className="max-w-full"
          title={t(`encounter_class__${encounter.encounter_class}`)}
        >
          <span className="min-w-0 truncate">
            {t(`encounter_class__${encounter.encounter_class}`)}
          </span>
        </Badge>
      </TableCell>
      <TableCell className="overflow-hidden">
        <Badge
          variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
          size="sm"
          className="max-w-full"
          title={t(`encounter_priority__${encounter.priority}`)}
        >
          <span className="min-w-0 truncate">
            {t(`encounter_priority__${encounter.priority}`)}
          </span>
        </Badge>
      </TableCell>
      <TableCell>
        {location ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`relative z-10 flex min-w-0 items-center gap-1.5 ${muted}`}
                title={getLocationPath(location)}
              >
                <LocationIcon
                  aria-hidden="true"
                  className="size-[13px] shrink-0"
                />
                <span className="truncate">{location.name}</span>
              </span>
            </TooltipTrigger>
            {location.parent && (
              <TooltipContent side="bottom">
                {getLocationPath(location)}
              </TooltipContent>
            )}
          </Tooltip>
        ) : (
          <span className={muted}>—</span>
        )}
      </TableCell>
      <TableCell>
        <span
          className={`block truncate ${muted}`}
          title={practitioner ? formatName(practitioner) : undefined}
        >
          {practitioner ? formatName(practitioner) : "—"}
        </span>
      </TableCell>
      <TableCell>
        <span
          className="block truncate font-mono text-xs text-muted-foreground"
          title={encounter.external_identifier ?? undefined}
        >
          {encounter.external_identifier ?? "—"}
        </span>
      </TableCell>
      <TableCell>
        <div className="relative z-10 flex items-center justify-end gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("patient_home")}
                asChild
              >
                <Link
                  to="/facility/$facilityId/patients/home"
                  params={{ facilityId }}
                  search={patientHomeSearch(patient)}
                >
                  <House aria-hidden="true" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("patient_home")}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={t("view_encounter")}
                asChild
              >
                <Link
                  to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
                  params={viewEncounterParams(encounter, facilityId)}
                >
                  <ChevronRight aria-hidden="true" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("view_encounter")}</TooltipContent>
          </Tooltip>
          <EncounterActions encounter={encounter} />
        </div>
      </TableCell>
    </TableRow>
  );
}
