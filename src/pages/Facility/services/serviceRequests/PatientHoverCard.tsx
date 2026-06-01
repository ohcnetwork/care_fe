import { Avatar } from "@/components/Common/Avatar";
import { PatientInfoHoverCard } from "@/components/Patient/PatientInfoHoverCard";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import { formatPatientAge } from "@/Utils/utils";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PatientHoverCardProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  facilityId?: string;
  disabled?: boolean;
  truncateEnabled?: boolean;
}

export function PatientHoverCard({
  patient,
  facilityId,
  disabled = false,
  truncateEnabled = true,
}: PatientHoverCardProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer>
        <DrawerTrigger
          disabled={disabled}
          className="w-full min-w-0 lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <PatientHoverCardTrigger patient={patient} disabled={disabled} />
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
          className="hidden max-w-full min-w-0 lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-10 focus-visible:ring-offset-background"
        >
          <PatientHoverCardTrigger
            patient={patient}
            disabled={disabled}
            truncateEnabled={truncateEnabled}
          />
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
  truncateEnabled?: boolean;
}

function PatientHoverCardTrigger({
  patient,
  disabled = false,
  truncateEnabled = false,
}: PatientHoverCardTriggerProps) {
  const { t } = useTranslation();

  return (
    <div
      data-slot="patient-info-hover-card-trigger"
      className={cn(
        "flex gap-3 items-center rounded-md min-w-46",
        !disabled && "hover:bg-gray-50 active:bg-gray-50 cursor-pointer",
      )}
    >
      <div className="size-12 shrink-0">
        <Avatar name={patient.name} />
      </div>

      <div
        className={cn(
          "flex flex-col min-w-0",
          truncateEnabled ? "max-w-md" : "max-w-full",
        )}
      >
        <h5
          className={cn(
            "text-lg font-semibold truncate text-start",
            !disabled && "underline",
          )}
        >
          {patient.name}
        </h5>
        <span className="flex flex-start text-gray-700">
          {formatPatientAge(patient, true)}, {t(`GENDER__${patient.gender}`)}
        </span>
      </div>
      {!disabled && <ChevronDown size={16} className="self-start mt-1" />}
    </div>
  );
}
