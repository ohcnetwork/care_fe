import { useState } from "react";

import {
  ActiveConditionVerificationStatuses,
  ConsultationDiagnosis,
  CreateDiagnosis,
} from "@/components/Diagnosis/types";
import { SelectFormField } from "@/components/Form/FormFields/SelectFormField";

type Option = CreateDiagnosis | ConsultationDiagnosis;

interface Props<T extends Option> {
  className?: string;
  diagnoses: T[];
  onChange: (value?: T) => Promise<void>;
}

const PrincipalDiagnosisSelect = <T extends Option>(props: Props<T>) => {
  const [disabled, setDisabled] = useState(false);
  const value = props.diagnoses.find((d) => d.is_principal);
  const diagnosis = value?.diagnosis_object;

  const options = props.diagnoses.some(isConfirmed)
    ? props.diagnoses.filter(isConfirmedOrPrincipal)
    : props.diagnoses.filter(isActive);

  return (
    <div className={props.className}>
      <div className="rounded-lg border border-secondary-400 bg-secondary-200 p-4">
        <SelectFormField
          id="principal-diagnosis-select"
          name="principal_diagnosis"
          label="Principal Diagnosis"
          value={JSON.stringify(value)}
          disabled={disabled}
          options={options}
          optionLabel={(d) => d.diagnosis_object?.label}
          optionDescription={(d) => (
            <p>
              Categorised under:{" "}
              <span className="font-bold">{d.diagnosis_object?.chapter}</span>
            </p>
          )}
          optionValue={(d) => JSON.stringify(d)} // TODO: momentary hack, figure out a better way to do this
          onChange={async ({ value }) => {
            setDisabled(true);
            await props.onChange(value ? (JSON.parse(value) as T) : undefined);
            setDisabled(false);
          }}
          errorClassName="hidden"
        />
        {diagnosis &&
          (diagnosis.chapter ? (
            <span className="mt-3 flex w-full flex-wrap justify-center gap-x-1 px-2 text-center text-secondary-900">
              <p>This encounter will be categorised under:</p>
              <p className="font-bold">{diagnosis.chapter}</p>
            </span>
          ) : (
            <span className="mt-3 flex w-full flex-wrap justify-center gap-x-1 px-2 text-center italic text-secondary-700">
              This encounter will not be categorised under any chapter as the
              diagnosis does not fall under a chapter.
            </span>
          ))}
      </div>
    </div>
  );
};

export default PrincipalDiagnosisSelect;

const isConfirmed = (d: Option) => d.verification_status === "confirmed";
const isConfirmedOrPrincipal = (d: Option) => isConfirmed(d) || d.is_principal;
const isActive = (d: Option) =>
  ActiveConditionVerificationStatuses.includes(d.verification_status as any);
