import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";

import { Avatar } from "@/components/Common/Avatar";

import { usePatientContext } from "@/hooks/usePatientUser";

interface PatientSwitcherProps {
  className?: string;
}

export function PatientSwitcher({ className }: PatientSwitcherProps) {
  const { t } = useTranslation();
  const { handleMenuOpenChange } = useAppSidebar();

  const patientUserContext = usePatientContext();

  if (!patientUserContext || !patientUserContext.selectedPatient) {
    return null;
  }

  return (
    <div className={cn("flex min-w-0", className)}>
      <Select
        onOpenChange={handleMenuOpenChange}
        disabled={patientUserContext.patients?.length === 0}
        value={
          patientUserContext.selectedPatient
            ? patientUserContext.selectedPatient.id
            : "Book "
        }
        onValueChange={(value) => {
          const patient = patientUserContext.patients?.find(
            (patient) => patient.id === value,
          );
          if (patient) {
            patientUserContext.setSelectedPatient(patient);
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="max-w-full gap-2 font-normal shadow-sm"
          aria-label={patientUserContext.selectedPatient.name}
        >
          <SelectValue placeholder={t("select_patient")}>
            <span className="truncate">
              {patientUserContext.selectedPatient.name}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {patientUserContext.patients?.map((patient) => (
            <SelectItem key={patient.id} value={patient.id}>
              <div className="flex flex-row items-center gap-2">
                <Avatar name={patient.name} className="size-5" />
                {patient.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
