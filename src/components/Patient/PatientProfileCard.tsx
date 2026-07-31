import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

/** Monogram for a patient circle; splits on spaces so any script works. */
export function patientInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0] ?? "")
      .join("")
      .toUpperCase() || "-"
  );
}

/**
 * Portal avatar. Unlike `Avatar` the tint is semantic rather than hashed: the
 * patient you are viewing is primary-filled, everyone else is neutral, so the
 * colour alone tells you whose records are on screen.
 */
export function PatientAvatar({
  name,
  active,
  className,
}: {
  name: string;
  active?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-bold",
        active ? "bg-primary-700 text-white" : "bg-gray-100 text-gray-600",
        className,
      )}
    >
      {patientInitials(name)}
    </span>
  );
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
        "flex w-full items-center gap-3 rounded-2xl p-3.5 text-left transition-colors",
        selected
          ? "border-[1.5px] border-primary-700 bg-primary-50"
          : "border border-gray-200 bg-white hover:border-gray-300",
      )}
    >
      <PatientAvatar
        name={patient.name}
        active={selected}
        className="size-10 text-sm"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-bold text-gray-900">
          {patient.name}
        </span>
        <span className="truncate text-xs text-gray-600">
          {subtitle ?? patientMetaLine(patient, t)}
        </span>
      </div>
      {/* Only the selected row carries a mark — an empty ring on the others
          reads as an unchecked radio the user is meant to fill in. */}
      {selected && (
        <span className="flex size-5.5 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white">
          <Check className="size-3.5" strokeWidth={3.2} />
        </span>
      )}
    </button>
  );
}
