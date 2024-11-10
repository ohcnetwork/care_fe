import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import ConditionVerificationStatusMenu from "@/components/Diagnosis/ConditionVerificationStatusMenu";
import {
  ActiveConditionVerificationStatuses,
  CreateDiagnosis,
  ICD11DiagnosisModel,
} from "@/components/Diagnosis/types";
import AutocompleteFormField from "@/components/Form/FormFields/Autocomplete";

import { Error } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { classNames, mergeQueryOptions } from "@/Utils/utils";

interface AddICD11DiagnosisProps {
  className?: string;
  onAdd: (object: CreateDiagnosis) => Promise<boolean>;
  disallowed: ICD11DiagnosisModel[];
  disabled?: boolean;
  prefill?: ICD11DiagnosisModel;
  onSelect?: (selected: ICD11DiagnosisModel) => unknown;
}

export default function AddICD11Diagnosis(props: AddICD11DiagnosisProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<ICD11DiagnosisModel>();
  const [adding, setAdding] = useState(false);
  const hasError = !!props.disallowed.find((d) => d?.id === selected?.id);

  const { res, data, loading, refetch } = useQuery(routes.listICD11Diagnosis, {
    prefetch: false,
    silent: true,
  });

  useEffect(() => {
    if (res?.status === 500) {
      Error({ msg: "ICD-11 Diagnosis functionality is facing issues." });
    }
  }, [res?.status]);

  useEffect(() => props.prefill && setSelected(props.prefill), [props.prefill]);

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
        onChange={(e) => {
          setSelected(e.value);
          props.onSelect?.(e.value);
        }}
        options={mergeQueryOptions(
          selected ? [selected] : [],
          data ?? [],
          (obj) => obj.id,
        )}
        optionLabel={(option) => option.label}
        optionValue={(option) => option}
        minQueryLength={2}
        onQuery={(query) => refetch({ query: { query } })}
        isLoading={loading}
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
