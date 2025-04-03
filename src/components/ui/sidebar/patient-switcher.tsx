import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import { usePatientContext } from "@/hooks/usePatientUser";

interface PatientSwitcherProps {
  className?: string;
}

export function PatientSwitcher({ className }: PatientSwitcherProps) {
  const { t } = useTranslation();
  const { open } = useSidebar();

  const patientUserContext = usePatientContext();

  if (!patientUserContext || !patientUserContext.selectedPatient) {
    return null;
  }

  return (
    <div className={cn("mx-2 mt-4 mb-2 flex flex-wrap flex-row", className)}>
      <Select
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
        <Tooltip>
          <TooltipTrigger asChild>
            <SelectTrigger>
              <SelectValue
                asChild
                placeholder={
                  patientUserContext.patients?.length === 0
                    ? t("no_patients")
                    : t("select_patient")
                }
              >
                <>
                  {open && (
                    <div className="flex flex-row justify-between items-center gap-2 w-full text-primary-800">
                      <Avatar
                        name={
                          patientUserContext.selectedPatient?.name || "User"
                        }
                        className="h-5 w-5"
                      />
                      <div className="flex flex-row items-center justify-between w-full gap-2">
                        <span className="font-semibold truncate max-w-32">
                          {patientUserContext.selectedPatient?.name}
                        </span>
                        <span className="text-xs text-secondary-600">
                          {t("switch")}
                        </span>
                      </div>
                    </div>
                  )}
                  {!open && (
                    <div className="flex flex-row items-center -ml-1.5">
                      <Avatar
                        name={
                          patientUserContext.selectedPatient?.name || "User"
                        }
                        className="h-4 w-4"
                      />
                    </div>
                  )}
                </>
              </SelectValue>
            </SelectTrigger>
          </TooltipTrigger>
          {!open && (
            <TooltipContent side="right" align="center">
              <p>{patientUserContext.selectedPatient?.name}</p>
            </TooltipContent>
          )}
        </Tooltip>
        <SelectContent>
          {patientUserContext.patients?.map((patient) => (
            <SelectItem key={patient.id} value={patient.id}>
              <div className="flex flex-row items-center gap-2">
                <Avatar name={patient.name} className="h-5 w-5" />
                {patient.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
