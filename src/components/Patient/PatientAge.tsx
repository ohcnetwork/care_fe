import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PatientListRead,
  PatientRead,
  PublicPatientRead,
} from "@/types/emr/patient/patient";
import { formatPatientAge, formatPatientAgeBreakdown } from "@/Utils/utils";

interface PatientAgeProps {
  patient: PatientRead | PatientListRead | PublicPatientRead;
  abbreviated?: boolean;
}

/**
 * Renders a patient's age with a hover tooltip showing the full years/months/days breakdown.
 * Use this component on interactive (non-print) surfaces.
 */
export function PatientAge({ patient, abbreviated = true }: PatientAgeProps) {
  const ageString = formatPatientAge(patient, abbreviated);
  const breakdown = formatPatientAgeBreakdown(patient);

  if (!breakdown) {
    return <span>{ageString}</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-default">{ageString}</span>
      </TooltipTrigger>
      <TooltipContent>
        <span>{breakdown}</span>
      </TooltipContent>
    </Tooltip>
  );
}
