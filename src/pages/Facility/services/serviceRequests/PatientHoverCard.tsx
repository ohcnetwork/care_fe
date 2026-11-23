import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { BLOOD_GROUP_CHOICES } from "@/common/constants";
import { Avatar } from "@/components/Common/Avatar";
import { PatientAge } from "@/components/Patient/PatientAge";
import { PatientInfoHoverCard } from "@/components/Patient/PatientInfoHoverCard";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BloodGroupChoices,
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import { ChevronDown, DropletIcon, PanelBottomOpen } from "lucide-react";
import { useTranslation } from "react-i18next";

/** Blood group's short display text (e.g. "A+"); undefined when unset/unknown. */
function shortBloodGroup(bloodGroup?: BloodGroupChoices) {
  return bloodGroup === BloodGroupChoices.Unknown
    ? undefined
    : BLOOD_GROUP_CHOICES.find((choice) => choice.id === bloodGroup)?.text;
}

interface PatientHoverCardProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  facilityId?: string;
  disabled?: boolean;
  compact?: { allergiesCount: number };
  presentation?: "default" | "encounter";
}

export function PatientHoverCard({
  patient,
  facilityId,
  disabled = false,
  compact,
  presentation = "default",
}: PatientHoverCardProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer>
        <DrawerTrigger
          disabled={disabled}
          className={cn(
            "min-w-0 max-w-full lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            compact && "block w-full",
            presentation === "encounter" && "min-w-0 max-w-full text-left",
          )}
        >
          <PatientHoverCardTrigger
            patient={patient}
            disabled={disabled}
            compact={compact}
            presentation={presentation}
          />
        </DrawerTrigger>
        <DrawerContent>
          <DrawerBody className="pb-[max(1rem,env(safe-area-inset-bottom))]">
            <PatientInfoHoverCard
              patient={patient}
              facilityId={facilityId || ""}
            />
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Desktop Popover */}
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "hidden min-w-0 max-w-full lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-10 focus-visible:ring-offset-background",
            presentation === "encounter" && "min-w-0 max-w-full text-left",
          )}
        >
          <PatientHoverCardTrigger
            patient={patient}
            disabled={disabled}
            presentation={presentation}
          />
        </PopoverTrigger>
        <PopoverContent
          className="flex flex-col border border-border shadow-lg p-4 rounded-md w-100"
          side="bottom"
          align="start"
        >
          <PatientInfoHoverCard
            patient={patient}
            facilityId={facilityId || ""}
          />
        </PopoverContent>
      </Popover>
    </>
  );
}

interface PatientHoverCardTriggerProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  disabled?: boolean;
  compact?: { allergiesCount: number };
  presentation?: "default" | "encounter";
}

function PatientHoverCardTrigger({
  patient,
  disabled = false,
  compact,
  presentation = "default",
}: PatientHoverCardTriggerProps) {
  const { t } = useTranslation();

  if (presentation === "encounter") {
    return (
      <span
        data-slot="patient-info-hover-card-trigger"
        className={cn(
          "flex min-w-0 items-center gap-1.5 rounded-sm",
          !disabled &&
            "cursor-pointer hover:bg-soft-background active:bg-soft-background",
        )}
      >
        <span className="text-base font-semibold wrap-anywhere text-foreground underline underline-offset-2">
          {patient.name}
        </span>
        {!disabled && (
          <ChevronDown
            aria-hidden="true"
            className="size-4 shrink-0 text-muted-foreground"
          />
        )}
      </span>
    );
  }

  if (compact) {
    const bloodGroup = shortBloodGroup(patient.blood_group);
    return (
      <div
        data-slot="patient-info-hover-card-trigger"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg bg-background p-3 shadow-sm",
          !disabled &&
            "hover:bg-soft-background active:bg-soft-background cursor-pointer",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h5 className="truncate text-base font-semibold capitalize">
              {patient.name}
            </h5>
            <span className="shrink-0 text-sm text-muted-foreground">
              <PatientAge patient={patient} />, {t(`GENDER__${patient.gender}`)}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {bloodGroup && (
              <Badge variant="yellow" className="gap-1">
                <DropletIcon className="size-3.5" strokeWidth={1.5} />
                {bloodGroup}
              </Badge>
            )}
            {!!compact.allergiesCount && (
              <Badge variant="destructive" className="gap-1">
                <AllergyIcon className="size-3.5" />
                {compact.allergiesCount} {t("allergies")}
              </Badge>
            )}
          </div>
        </div>
        {!disabled && <PanelBottomOpen className="size-5" />}
      </div>
    );
  }

  return (
    <div
      data-slot="patient-info-hover-card-trigger"
      className={cn(
        "flex w-fit max-w-full gap-3 items-center rounded-md text-left",
        !disabled &&
          "hover:bg-soft-background active:bg-soft-background cursor-pointer",
      )}
    >
      <div className="size-12 shrink-0">
        <Avatar name={patient.name} />
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex flex-row gap-2 items-center">
          <h5
            className={cn(
              "min-w-0 text-lg font-semibold wrap-break-word",
              !disabled && "underline",
            )}
          >
            {patient.name}
          </h5>
          {!disabled && <ChevronDown size={16} className="shrink-0" />}
        </div>
        <span className="flex flex-start text-muted-foreground">
          <PatientAge patient={patient} />, {t(`GENDER__${patient.gender}`)}
        </span>
      </div>
    </div>
  );
}
