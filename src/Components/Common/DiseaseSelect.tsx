import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { listICD11Diagnosis } from "../../Redux/actions";
import { ICD11DiagnosisModel } from "../Facility/models";
import AutoCompleteAsync from "../Form/AutoCompleteAsync";

interface DiagnosisSelectProps {
  name: string;
  errors?: string;
  selected?: string;
  setSelected: (selected: string) => void;
}

export const DiseaseSelect = (props: DiagnosisSelectProps) => {
  const { name, selected, setSelected, errors } = props;
  const dispatch: any = useDispatch();

  const fetchDisease = useCallback(
    async (search: string) => {
      const res = await dispatch(listICD11Diagnosis({ query: search }, ""));
      return res?.data;
    },
    [dispatch]
  );

  return (
    <AutoCompleteAsync
      name={name}
      selected={selected}
      fetchData={fetchDisease}
      onChange={(selected: ICD11DiagnosisModel) => setSelected(selected.label)}
      placeholder="Search disease"
      optionLabel={(option: ICD11DiagnosisModel) => option?.label || ""}
      error={errors}
    />
  );
};
