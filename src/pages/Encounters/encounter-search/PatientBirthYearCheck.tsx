import { useMutation } from "@tanstack/react-query";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  getPartialId,
  PartialPatientModel,
  PatientRead,
} from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import mutate from "@/Utils/request/mutate";

interface PatientBirthYearCheckProps {
  patient: PartialPatientModel;
  /** Receives the full record, whose id replaces the temporary partial id. */
  onVerified: (patient: PatientRead) => void;
  onCancel: () => void;
}

/**
 * Asks for a partial record's year of birth with the existing
 * `search_retrieve` check. Lives in the search popup, outside its listbox.
 */
export function PatientBirthYearCheck({
  patient,
  onVerified,
  onCancel,
}: PatientBirthYearCheckProps) {
  const { t } = useTranslation();
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();

  const { mutate: verify, isPending } = useMutation({
    mutationFn: mutate(patientApi.searchRetrieve, { silent: true }),
    onSuccess: (verified) => onVerified(verified as PatientRead),
    onError: () => setError(t("encounter_search_verify_failed")),
  });

  const submit = () => {
    if (!/^\d{4}$/.test(year)) {
      setError(t("valid_year_of_birth"));
      return;
    }
    setError(null);
    verify({
      phone_number: patient.phone_number ?? "",
      year_of_birth: year,
      partial_id: getPartialId(patient),
    });
  };

  return (
    <form
      data-slot="patient-birth-year-check"
      aria-label={t("verify_patient_identity")}
      className="flex flex-col gap-2 border-t p-3"
      onSubmit={(event) => {
        event.preventDefault();
        event.stopPropagation();
        submit();
      }}
    >
      <label htmlFor={inputId} className="text-sm">
        {t("encounter_search_verify_prompt", { name: patient.name })}
      </label>
      <div className="flex gap-2">
        <Input
          id={inputId}
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          placeholder={t("encounter_search_year_placeholder")}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? errorId : undefined}
          value={year}
          onChange={(event) => {
            if (/^\d{0,4}$/.test(event.target.value)) {
              setYear(event.target.value);
              setError(null);
            }
          }}
        />
        <Button type="submit" variant="primary" disabled={isPending}>
          {t("verify")}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("cancel")}
        </Button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
