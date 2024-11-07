import { debounce } from "lodash-es";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ICD11DiagnosisModel } from "@/components/Diagnosis/types";
import { getDiagnosesByIds } from "@/components/Diagnosis/utils";
import AutocompleteMultiSelectFormField from "@/components/Form/FormFields/AutocompleteMultiselect";

import { Error } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { mergeQueryOptions } from "@/Utils/utils";

export const FILTER_BY_DIAGNOSES_KEYS = [
  "diagnoses",
  "diagnoses_confirmed",
  "diagnoses_unconfirmed",
  "diagnoses_provisional",
  "diagnoses_differential",
] as const;

export const DIAGNOSES_FILTER_LABELS = {
  diagnoses: "Diagnoses (of any verification status)",
  diagnoses_unconfirmed: "Unconfirmed Diagnoses",
  diagnoses_provisional: "Provisional Diagnoses",
  diagnoses_differential: "Differential Diagnoses",
  diagnoses_confirmed: "Confirmed Diagnoses",
} as const;

export type DiagnosesFilterKey = (typeof FILTER_BY_DIAGNOSES_KEYS)[number];

interface Props {
  name: DiagnosesFilterKey;
  value?: string;
  onChange: (event: { name: DiagnosesFilterKey; value: string }) => void;
}
export default function DiagnosesFilter(props: Props) {
  const { t } = useTranslation();
  const [diagnoses, setDiagnoses] = useState<ICD11DiagnosisModel[]>([]);
  const { res, data, loading, refetch } = useQuery(routes.listICD11Diagnosis, {
    silent: true,
    prefetch: false,
  });

  useEffect(() => {
    if (res?.status === 500) {
      Error({ msg: "ICD-11 Diagnosis functionality is facing issues." });
    }
  }, [res?.status]);

  useEffect(() => {
    if (!props.value) {
      setDiagnoses([]);
      return;
    }
    if (diagnoses.map((d) => d.id).join(",") === props.value) {
      return;
    }

    // Re-use the objects which we already have, fetch the rest.
    const ids = props.value.split(",");
    const existing = diagnoses.filter(({ id }) => ids.includes(id));
    const objIds = existing.map((o) => o.id);
    const diagnosesToBeFetched = ids.filter((id) => !objIds.includes(id));
    getDiagnosesByIds(diagnosesToBeFetched).then((data) => {
      const retrieved = data.filter(Boolean) as ICD11DiagnosisModel[];
      setDiagnoses([...existing, ...retrieved]);
    });
  }, [props.value]);

  return (
    <AutocompleteMultiSelectFormField
      id={props.name}
      label={DIAGNOSES_FILTER_LABELS[props.name]}
      labelClassName="text-sm"
      name="icd11_search"
      className="w-full"
      placeholder={t("search_icd11_placeholder")}
      minQueryLength={2}
      value={diagnoses}
      onChange={(e) => {
        setDiagnoses(e.value);
        props.onChange({
          name: props.name,
          value: e.value.map((o) => o.id).join(","),
        });
      }}
      options={mergeQueryOptions(diagnoses, data ?? [], (obj) => obj.id)}
      optionLabel={(option) => option.label}
      optionValue={(option) => option}
      onQuery={debounce((query: string) => refetch({ query: { query } }), 300)}
      isLoading={loading}
    />
  );
}
