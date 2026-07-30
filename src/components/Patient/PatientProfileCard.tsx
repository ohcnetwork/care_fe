import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Avatar } from "@/components/Common/Avatar";

import { formatPatientAge } from "@/Utils/utils";
import {
  BloodGroupChoices,
  PublicPatientRead,
} from "@/types/emr/patient/patient";

/**
 * `34 yrs · Female · O+`, dropping the blood group when it is not recorded.
 */
export function patientMetaLine(
  patient: PublicPatientRead,
  t: (key: string) => string,
): string {
  const parts = [
    formatPatientAge(patient, true),
    t(`GENDER__${patient.gender}`),
  ];
  if (
    patient.blood_group &&
    patient.blood_group !== BloodGroupChoices.Unknown
  ) {
    parts.push(t(`BLOOD_GROUP__${patient.blood_group}`));
  }
  return parts.join(" · ");
}

interface PatientProfileCardProps {
  patient: PublicPatientRead;
  selected: boolean;
  onSelect: (patient: PublicPatientRead) => void;
  /** Replaces the meta line, e.g. with a contextual hint in the switcher. */
  subtitle?: React.ReactNode;
}

export function PatientProfileCard({
  patient,
  selected,
  onSelect,
  subtitle,
}: PatientProfileCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      onClick={() => onSelect(patient)}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-3.5 rounded-2xl border p-4 text-left transition-colors",
        selected
          ? "border-primary-700 bg-primary-50"
          : "border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <Avatar name={patient.name} className="size-11 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-bold text-gray-900">{patient.name}</span>
        <span className="truncate text-[13px] text-gray-600">
          {subtitle ?? patientMetaLine(patient, t)}
        </span>
      </div>
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-full",
          selected
            ? "bg-primary-700 text-white"
            : "border-[1.5px] border-gray-300",
        )}
      >
        {selected && <Check className="size-3.5" strokeWidth={3.2} />}
      </span>
    </button>
  );
}
