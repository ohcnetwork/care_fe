import { Link } from "@tanstack/react-router";
import { ChevronRight, MapPin, Stethoscope } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EncounterActions } from "@/components/Encounter/EncounterActions";
import {
  EncounterStatusBadge,
  EncounterTimeCell,
  LiveDot,
  PatientMeta,
  patientHomeSearch,
  useEncounterTime,
  viewEncounterParams,
} from "@/components/Encounter/EncounterCardParts";
import { Badge, BadgeVariant } from "@/components/ui/badge";
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

import { cn } from "@/lib/utils";

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

type Encounter = EncounterListRead | EncounterRead;

/**
 * The narrowest the table gets, in its compact layout. Narrower than this,
 * the encounters list shows cards instead. Keep in sync with the table's
 * `min-w-[600px]`.
 */
export const ENCOUNTER_TABLE_MIN_WIDTH = 600;

// The layout follows the table's own width, not the viewport's: the sidebar
// changes how much room the table gets. From 60rem (960px) the table shows
// eight columns; below it, related columns merge into two-line cells.
const WIDE = "hidden @min-[60rem]:table-cell";
const COMPACT = "@min-[60rem]:hidden";

// Secondary details in a row: the location, the practitioner, and the dash
// shown when either is missing.
const DETAIL_TEXT = "text-sm text-soft-foreground";

interface EncounterTableProps {
  encounters: Encounter[];
  facilityId: string;
  /** Shows skeleton rows instead of the encounters. */
  loading?: boolean;
  skeletonRows?: number;
}

/**
 * The list view of the encounters list: one row per encounter, from the
 * list response alone. The whole row opens the encounter through a link
 * stretched over it; the patient name (to Patient Home), the tooltips, the
 * gear and the chevron sit above it. No sorting: the list API isn't asked
 * to order, and the page is only one of many.
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
    <div className="@container">
      {/* Fixed layout: the columns share the width and truncate, so the
          table only scrolls below its minimum width. */}
      <Table className="min-w-[600px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className={cn(headCell, "w-[28%] @min-[60rem]:w-[20%]")}>
              {t("patient")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[11%]")}>
              {t("status")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[15%]")}>
              {t("encounter_table_when")}
            </TableHead>
            <TableHead
              className={cn(headCell, COMPACT, "w-[22%] truncate")}
              title={t("encounter_table_status_time")}
            >
              {t("encounter_table_status_time")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[10%]")}>
              {t("class")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[10%]")}>
              {t("priority")}
            </TableHead>
            <TableHead
              className={cn(headCell, COMPACT, "w-[18%] truncate")}
              title={t("encounter_table_class_priority")}
            >
              {t("encounter_table_class_priority")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[15%]")}>
              {t("location")}
            </TableHead>
            <TableHead className={cn(headCell, WIDE, "w-[14%]")}>
              {t("practitioner")}
            </TableHead>
            <TableHead
              className={cn(headCell, COMPACT, "w-[24%] truncate")}
              title={t("encounter_table_location_practitioner")}
            >
              {t("encounter_table_location_practitioner")}
            </TableHead>
            {/* Fits the gear and the chevron, two standard 40px buttons. */}
            <TableHead className={cn(headCell, "w-25 text-right")}>
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, index) => (
                <SkeletonRow key={index} />
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
    </div>
  );
}

function SkeletonRow() {
  return (
    <TableRow aria-hidden="true" className="[&>td]:py-2">
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Skeleton className="size-8 shrink-0 rounded-lg" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </TableCell>
      <TableCell className={WIDE}>
        <Skeleton className="h-5 w-20 rounded-sm" />
      </TableCell>
      <TableCell className={WIDE}>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </TableCell>
      <TableCell className={COMPACT}>
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-20 rounded-sm" />
          <Skeleton className="h-3.5 w-16" />
        </div>
      </TableCell>
      <TableCell className={WIDE}>
        <Skeleton className="h-5 w-16 rounded-sm" />
      </TableCell>
      <TableCell className={WIDE}>
        <Skeleton className="h-5 w-16 rounded-sm" />
      </TableCell>
      <TableCell className={COMPACT}>
        <div className="space-y-1">
          <Skeleton className="h-5 w-16 rounded-sm" />
          <Skeleton className="h-5 w-14 rounded-sm" />
        </div>
      </TableCell>
      <TableCell className={WIDE}>
        <Skeleton className="h-3.5 w-24" />
      </TableCell>
      <TableCell className={WIDE}>
        <Skeleton className="h-3.5 w-24" />
      </TableCell>
      <TableCell className={COMPACT}>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3.5 w-20" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex justify-end">
          <Skeleton className="size-10 rounded-md" />
        </div>
      </TableCell>
    </TableRow>
  );
}

function EncounterTableRow({
  encounter,
  facilityId,
}: {
  encounter: Encounter;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { patient } = encounter;
  const practitioner = encounter.care_team?.[0]?.member;
  const practitionerName = practitioner ? formatName(practitioner) : undefined;
  const location = encounter.current_location;
  const classLabel = t(`encounter_class__${encounter.encounter_class}`);
  const priorityLabel = t(`encounter_priority__${encounter.priority}`);

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
            {/* The name opens Patient Home; it sits above the row's
                encounter link, and only as wide as the name. */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  to="/facility/$facilityId/patients/home"
                  params={{ facilityId }}
                  search={patientHomeSearch(patient)}
                  className="relative z-10 inline-block max-w-full truncate align-top font-semibold underline decoration-muted-foreground/50 underline-offset-2 hover:decoration-foreground"
                >
                  {patient.name}
                </Link>
              </TooltipTrigger>
              <TooltipContent>{t("patient_home")}</TooltipContent>
            </Tooltip>
            <PatientMeta patient={patient} />
          </div>
        </div>
      </TableCell>

      {/* Wide: status and time in their own columns. */}
      <TableCell className={cn(WIDE, "whitespace-normal")}>
        <StatusBadges encounter={encounter} />
      </TableCell>
      <TableCell className={WIDE}>
        <EncounterTimeCell encounter={encounter} />
      </TableCell>
      {/* Compact: the status above the time; its wording in a tooltip. */}
      <TableCell className={cn(COMPACT, "whitespace-normal")}>
        <div className="flex min-w-0 flex-col gap-1">
          <StatusBadges encounter={encounter} />
          <CompactTime encounter={encounter} />
        </div>
      </TableCell>

      {/* Wide: class and priority in their own columns. */}
      <TableCell className={cn(WIDE, "overflow-hidden")}>
        <TruncatedBadge
          variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
          label={classLabel}
        />
      </TableCell>
      <TableCell className={cn(WIDE, "overflow-hidden")}>
        <TruncatedBadge
          variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
          label={priorityLabel}
        />
      </TableCell>
      {/* Compact: class above priority. */}
      <TableCell className={cn(COMPACT, "overflow-hidden")}>
        <div className="flex min-w-0 flex-col items-start gap-1">
          <TruncatedBadge
            variant={ENCOUNTER_CLASSES_COLORS[encounter.encounter_class]}
            label={classLabel}
          />
          <TruncatedBadge
            variant={ENCOUNTER_PRIORITY_COLORS[encounter.priority]}
            label={priorityLabel}
          />
        </div>
      </TableCell>

      {/* Wide: location and practitioner in their own columns. */}
      <TableCell className={WIDE}>
        {location ? (
          <LocationLabel location={location} />
        ) : (
          <span className={DETAIL_TEXT}>—</span>
        )}
      </TableCell>
      <TableCell className={WIDE}>
        <PractitionerLabel name={practitionerName} />
      </TableCell>
      {/* Compact: location above practitioner, each with its icon so the
          two lines read apart. */}
      <TableCell className={COMPACT}>
        <div className="flex min-w-0 flex-col gap-1">
          {location ? (
            <LocationLabel location={location} />
          ) : (
            <span className={cn(DETAIL_TEXT, "flex items-center gap-1.5")}>
              <MapPin aria-hidden="true" className="size-4 shrink-0" />—
            </span>
          )}
          <PractitionerLabel name={practitionerName} withIcon />
        </div>
      </TableCell>

      <TableCell>
        {/* Covers the row so a click anywhere opens the encounter. It is
            separate from the chevron, so only the chevron shows the
            tooltip; the chevron is the link for keyboards and readers. */}
        <Link
          to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/$tab"
          params={viewEncounterParams(encounter, facilityId)}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0"
        />
        {/* The gear (Restart, completed encounters only) and the chevron
            sit above the row's link, which still takes clicks beside them. */}
        <div className="relative z-10 ml-auto flex w-fit items-center gap-0.5">
          <EncounterActions encounter={encounter} triggerSize="default" />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
        </div>
      </TableCell>
    </TableRow>
  );
}

/** The deceased badge, when it applies, and the status badge. */
function StatusBadges({ encounter }: { encounter: Encounter }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-wrap items-center gap-1">
      {encounter.patient.deceased_datetime && (
        <Badge variant="destructive" size="sm">
          {t("deceased")}
        </Badge>
      )}
      <EncounterStatusBadge status={encounter.status} size="sm" />
    </div>
  );
}

/** The time's value alone; its label and context show in a tooltip. */
function CompactTime({ encounter }: { encounter: Encounter }) {
  const time = useEncounterTime(encounter);
  const detail = [time.label, time.context].filter(Boolean).join(" · ");
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Above the row's link, so the tooltip opens on hover. */}
        <span className="relative z-10 flex w-fit max-w-full items-center gap-1.5">
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
      </TooltipTrigger>
      <TooltipContent side="bottom">{detail}</TooltipContent>
    </Tooltip>
  );
}

/** A small badge that truncates its label to the cell's width. */
function TruncatedBadge({
  variant,
  label,
}: {
  variant: BadgeVariant;
  label: string;
}) {
  return (
    <Badge variant={variant} size="sm" className="max-w-full" title={label}>
      <span className="min-w-0 truncate">{label}</span>
    </Badge>
  );
}

/** The location's icon and name; its full path in a tooltip. */
function LocationLabel({
  location,
}: {
  location: NonNullable<Encounter["current_location"]>;
}) {
  const LocationIcon = LocationTypeIcons[location.form];
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {/* Above the row's link, so the tooltip opens on hover. */}
        <span
          className={cn(
            DETAIL_TEXT,
            "relative z-10 flex w-fit max-w-full min-w-0 items-center gap-1.5",
          )}
          title={getLocationPath(location)}
        >
          <LocationIcon aria-hidden="true" className="size-4 shrink-0" />
          <span className="truncate">{location.name}</span>
        </span>
      </TooltipTrigger>
      {location.parent && (
        <TooltipContent side="bottom">
          {getLocationPath(location)}
        </TooltipContent>
      )}
    </Tooltip>
  );
}

/** The practitioner's name, or a dash; the full name on hover. */
function PractitionerLabel({
  name,
  withIcon = false,
}: {
  name?: string;
  withIcon?: boolean;
}) {
  return (
    <span
      // Above the row's link, so the full name shows on hover.
      className={cn(
        DETAIL_TEXT,
        "relative z-10 flex w-fit max-w-full min-w-0 items-center gap-1.5",
      )}
      title={name}
    >
      {withIcon && (
        <Stethoscope aria-hidden="true" className="size-4 shrink-0" />
      )}
      <span className="truncate">{name ?? "—"}</span>
    </span>
  );
}
