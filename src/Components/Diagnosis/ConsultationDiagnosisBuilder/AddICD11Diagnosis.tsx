import { useState } from "react";
import { useTranslation } from "react-i18next";
import AutocompleteFormField from "../../Form/FormFields/Autocomplete";
import {
  ActiveConditionVerificationStatuses,
  CreateDiagnosis,
  ICD11DiagnosisModel,
} from "../types";
import { useAsyncOptions } from "../../../Common/hooks/useAsyncOptions";
import { listICD11Diagnosis } from "../../../Redux/actions";
import ConditionVerificationStatusMenu from "../ConditionVerificationStatusMenu";
import { classNames } from "../../../Utils/utils";

interface AddICD11DiagnosisProps {
  className?: string;
  onAdd: (object: CreateDiagnosis) => Promise<boolean>;
  disallowed: ICD11DiagnosisModel[];
  disabled?: boolean;
}

export default function AddICD11Diagnosis(props: AddICD11DiagnosisProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ICD11DiagnosisModel>();
  const [adding, setAdding] = useState(false);
  const hasError = !!props.disallowed.find((d) => d?.id === selected?.id);

  const { fetchOptions, isLoading, options } =
    useAsyncOptions<ICD11DiagnosisModel>("id");

  const handleAdd = async (status: CreateDiagnosis["verification_status"]) => {
    if (!selected) return;

    setAdding(true);
    const added = await props.onAdd({
      diagnosis_object: selected,
      diagnosis: selected.id,
      verification_status: status,
      is_principal: false,
    });
    setAdding(false);

    if (added) {
      setSelected(undefined);
    }
  };

  return (
    <div
      className={classNames(props.className, "flex w-full items-start gap-2")}
    >
      <AutocompleteFormField
        id="icd11-search"
        name="icd11_search"
        className="w-full"
        disabled={props.disabled || adding}
        placeholder={t("search_icd11_placeholder")}
        value={selected}
        onChange={(e) => setSelected(e.value)}
        options={options(selected ? [selected] : undefined)}
        optionLabel={(option) => option.label}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(listICD11Diagnosis({ query }))}
        isLoading={isLoading}
        error={hasError ? t("diagnosis_already_added") : undefined}
      />
      <ConditionVerificationStatusMenu
        className="mt-0.5"
        disabled={props.disabled || !selected || hasError || adding}
        options={ActiveConditionVerificationStatuses}
        onSelect={(status) => handleAdd(status)}
        size="default"
      />
    </div>
  );
}
