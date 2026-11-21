import {
  Ban,
  Biohazard,
  Bookmark,
  CircleCheck,
  CircleOff,
  LucideIcon,
  ShieldAlert,
  SprayCan,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TagBadges } from "@/components/Tags/TagBadges";

import { LocationRead, OperationalStatus } from "@/types/location/location";

import { BedBookingSheet } from "./BedBookingSheet";
import { BedPlate } from "./BedPlate";
import { getBedState } from "./bedState";

const STATE_BADGES = {
  reserved: { label: "reserved", variant: "amber" },
  free: { label: "free", variant: "green" },
  unavailable: { label: "unavailable", variant: "secondary" },
} as const;

const UNAVAILABLE_ICONS = {
  C: Ban,
  H: SprayCan,
  I: ShieldAlert,
  K: Biohazard,
  O: CircleOff,
  U: CircleOff,
} as const satisfies Record<OperationalStatus, LucideIcon>;

interface BedVacantDetailsProps {
  bed: LocationRead;
  facilityId: string;
}

/**
 * A bed without a patient: ready for one, reserved for one, or the reason it
 * cannot take one.
 */
export function BedVacantDetails({ bed, facilityId }: BedVacantDetailsProps) {
  const { t } = useTranslation();
  const [bookingOpen, setBookingOpen] = useState(false);
  const state = getBedState(bed);
  if (state === "patient") return null;
  const badge = STATE_BADGES[state];
  const isInactive = bed.status !== "active";
  const Icon =
    state === "free"
      ? CircleCheck
      : state === "reserved"
        ? Bookmark
        : isInactive
          ? CircleOff
          : UNAVAILABLE_ICONS[bed.operational_status];

  return (
    <div className="flex flex-1 flex-col gap-3 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <BedPlate name={bed.name} state={state} />
        <Badge variant={badge.variant} size="sm" className="shrink-0">
          {t(badge.label)}
        </Badge>
      </div>
      <p className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-4 shrink-0" aria-hidden="true" />
        {state === "free"
          ? t("ready_for_admission")
          : state === "reserved"
            ? t("bed_reserved_hint")
            : isInactive
              ? t("inactive")
              : t(`location_operational_status__${bed.operational_status}`)}
      </p>
      {state === "reserved" && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="self-start"
            onClick={() => setBookingOpen(true)}
          >
            {t("view_encounter")}
          </Button>
          <BedBookingSheet
            bed={bed}
            facilityId={facilityId}
            open={bookingOpen}
            onOpenChange={setBookingOpen}
          />
        </>
      )}
      <TagBadges tags={bed.tags} size="xs" hierarchyDisplay />
    </div>
  );
}
