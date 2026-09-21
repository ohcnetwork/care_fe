import { AllergyIcon } from "@/CAREUI/icons/CustomIcons";

import { BLOOD_GROUP_CHOICES } from "@/common/constants";
import { Avatar } from "@/components/Common/Avatar";
import { PatientAge } from "@/components/Patient/PatientAge";
import { PatientInfoHoverCard } from "@/components/Patient/PatientInfoHoverCard";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
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
}

export function PatientHoverCard({
  patient,
  facilityId,
  disabled = false,
  compact,
}: PatientHoverCardProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer>
        <DrawerTrigger
          disabled={disabled}
          className={cn(
            "lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            compact && "block w-full",
          )}
        >
          <PatientHoverCardTrigger
            patient={patient}
            disabled={disabled}
            compact={compact}
          />
        </DrawerTrigger>
        <DrawerContent className="flex flex-col p-4 gap-4">
          <PatientInfoHoverCard
            patient={patient}
            facilityId={facilityId || ""}
          />
        </DrawerContent>
      </Drawer>

      {/* Desktop Popover */}
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          className="hidden lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-10 focus-visible:ring-offset-background"
        >
          <PatientHoverCardTrigger patient={patient} disabled={disabled} />
        </PopoverTrigger>
        <PopoverContent
          className="flex flex-col border border-gray-200 shadow-lg p-4 rounded-md gap-4 w-100"
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
}

function PatientHoverCardTrigger({
  patient,
  disabled = false,
  compact,
}: PatientHoverCardTriggerProps) {
  const { t } = useTranslation();

  if (compact) {
    const bloodGroup = shortBloodGroup(patient.blood_group);
    return (
      <div
        data-slot="patient-info-hover-card-trigger"
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg bg-white p-3 shadow-sm",
          !disabled && "hover:bg-gray-50 active:bg-gray-50 cursor-pointer",
        )}
      >
        <div className="flex min-w-0 flex-col items-start gap-1.5">
          <div className="flex min-w-0 items-baseline gap-1.5">
            <h5 className="truncate text-base font-semibold capitalize">
              {patient.name}
            </h5>
            <span className="shrink-0 text-sm text-gray-700">
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
        "flex w-fit gap-3 items-center rounded-md",
        !disabled && "hover:bg-gray-50 active:bg-gray-50 cursor-pointer",
      )}
    >
      <div className="size-12">
        <Avatar name={patient.name} />
      </div>

      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-center">
          <h5
            className={cn(
              "text-lg font-semibold whitespace-nowrap",
              !disabled && "underline",
            )}
          >
            {patient.name}
          </h5>
          {!disabled && <ChevronDown size={16} />}
        </div>
        <span className="flex flex-start text-gray-700">
          <PatientAge patient={patient} />, {t(`GENDER__${patient.gender}`)}
        </span>
      </div>
    </div>
  );
}
