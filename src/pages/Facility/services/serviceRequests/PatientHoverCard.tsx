import { Avatar } from "@/components/Common/Avatar";
import { PatientAge } from "@/components/Patient/PatientAge";
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
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface PatientHoverCardProps {
  patient: PublicPatientRead | PatientListRead | PatientRead;
  facilityId?: string;
  disabled?: boolean;
}

export function PatientHoverCard({
  patient,
  facilityId,
  disabled = false,
}: PatientHoverCardProps) {
  return (
    <>
      {/* Mobile Drawer */}
      <Drawer>
        <DrawerTrigger
          disabled={disabled}
          className="min-w-0 max-w-full lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
          className="hidden min-w-0 max-w-full lg:flex focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-10 focus-visible:ring-offset-background"
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
}

function PatientHoverCardTrigger({
  patient,
  disabled = false,
}: PatientHoverCardTriggerProps) {
  const { t } = useTranslation();

  return (
    <div
      data-slot="patient-info-hover-card-trigger"
      className={cn(
        "flex w-fit max-w-full gap-3 items-center rounded-md text-left",
        !disabled && "hover:bg-gray-50 active:bg-gray-50 cursor-pointer",
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
        <span className="flex flex-start text-gray-700">
          <PatientAge patient={patient} />, {t(`GENDER__${patient.gender}`)}
        </span>
      </div>
    </div>
  );
}
