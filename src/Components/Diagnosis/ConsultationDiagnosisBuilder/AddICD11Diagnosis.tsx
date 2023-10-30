import { useState } from "react";
import { useTranslation } from "react-i18next";
import AutocompleteFormField from "../../Form/FormFields/Autocomplete";
import {
  ActiveConditionVerificationStatuses,
  CreateDiagnosis,
  ICD11DiagnosisModel,
} from "../types";
import { FieldError } from "../../Form/FieldValidators";
import { useAsyncOptions } from "../../../Common/hooks/useAsyncOptions";
import { listICD11Diagnosis } from "../../../Redux/actions";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import DropdownMenu, { DropdownItem } from "../../Common/components/Menu";
import ConditionVerificationStatusMenu from "../ConditionVerificationStatusMenu";

interface AddICD11DiagnosisProps {
  className?: string;
  onAdd: (object: CreateDiagnosis) => Promise<FieldError>;
  disallowed: ICD11DiagnosisModel[];
  disabled?: boolean;
}

export default function AddICD11Diagnosis(props: AddICD11DiagnosisProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ICD11DiagnosisModel>();
  const [adding, setAdding] = useState(false);
  const hasError = !!props.disallowed.find((d) => d.id === selected?.id);

  const { fetchOptions, isLoading, options } =
    useAsyncOptions<ICD11DiagnosisModel>("id");

  const handleAdd = async (status: CreateDiagnosis["verification_status"]) => {
    if (!selected) return;

    setAdding(true);
    const added = await props.onAdd({
      diagnosis: selected.id,
      verification_status: status,
    });
    setAdding(false);

    if (added) {
      setSelected(undefined);
    }
  };

  return (
    <div className={props.className}>
      <div className="flex w-full flex-col items-start gap-2 md:flex-row">
        <AutocompleteFormField
          id="icd11-search"
          name="icd11_search"
          disabled={props.disabled || adding}
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
          disabled={props.disabled || !selected || hasError || adding}
          options={ActiveConditionVerificationStatuses}
          onSelect={(status) => handleAdd(status)}
        />
        <DropdownMenu
          id="add-icd11-diagnosis-menu"
          title={t("add_diagnosis")}
          icon={<CareIcon icon="l-plus-circle" className="text-lg" />}
        >
          {ActiveConditionVerificationStatuses.map((status) => (
            <DropdownItem
              key={status}
              id={`add-icd11-diagnosis-as-${status}`}
              onClick={() => handleAdd(status)}
              icon={<CareIcon icon="l-plus-circle" className="text-lg" />}
            >
              Add as {t(status)}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </div>
    </div>
  );
}
