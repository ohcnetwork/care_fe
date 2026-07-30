import { Plus } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { PatientProfileCard } from "@/components/Patient/PatientProfileCard";

import { usePatientContext } from "@/hooks/usePatientUser";

import { PublicPatientRead } from "@/types/emr/patient/patient";

interface PatientSwitcherSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the newly picked patient so callers can flash a confirmation. */
  onSwitched?: (patient: PublicPatientRead) => void;
}

/**
 * Bottom sheet for changing which linked profile the app is showing.
 * Appointments, prescriptions and reports all follow this selection.
 */
export function PatientSwitcherSheet({
  open,
  onOpenChange,
  onSwitched,
}: PatientSwitcherSheetProps) {
  const { t } = useTranslation();
  const { patients, selectedPatient, setSelectedPatient } = usePatientContext();

  const handleSelect = (patient: PublicPatientRead) => {
    onOpenChange(false);
    if (patient.id === selectedPatient?.id) {
      return;
    }
    setSelectedPatient(patient);
    onSwitched?.(patient);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[85dvh] max-w-[480px] overflow-y-auto rounded-t-3xl p-5 pb-7"
      >
        <span
          aria-hidden
          className="mx-auto mb-4 block h-1 w-10 rounded-full bg-gray-300"
        />
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle className="text-xl font-bold tracking-tight">
            {t("patient_switcher__heading")}
          </SheetTitle>
          <SheetDescription className="text-sm">
            {t("patient_switcher__description")}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 flex flex-col gap-2">
          {patients?.map((patient) => (
            <PatientProfileCard
              key={patient.id}
              patient={patient}
              selected={patient.id === selectedPatient?.id}
              onSelect={handleSelect}
            />
          ))}
        </div>

        <Link
          href="/patient/add-profile"
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl border-[1.5px] border-dashed border-gray-300 p-3.5 text-sm font-semibold text-primary-700 hover:border-primary-700 hover:bg-primary-50"
        >
          <Plus className="size-4" strokeWidth={2.2} />
          {t("patient_switcher__link_another")}
        </Link>
      </SheetContent>
    </Sheet>
  );
}
