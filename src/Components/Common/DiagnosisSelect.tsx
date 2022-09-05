import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { listICD11Diagnosis } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "./HelperInputFields";
import { debounce } from "lodash";
import { ICD11DiagnosisModel } from "../Facility/models";

interface DiagnosisSelectProps {
  name: string;
  margin?: string;
  errors?: string;
  className?: string;
  searchAll?: boolean;
  multiple?: boolean;
  facility?: string;
  location?: string;
  showAll?: boolean;
  selected: ICD11DiagnosisModel[] | null;
  setSelected: (selected: ICD11DiagnosisModel[] | null) => void;
}

export const DiagnosisSelect = (props: DiagnosisSelectProps) => {
  const { name, selected, setSelected, margin, errors, className = "" } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisList, setDiagnosisList] = useState<
    Array<ICD11DiagnosisModel>
  >([]);

  const handleValueChange = (current: ICD11DiagnosisModel[] | null) => {
    if (!current) {
      setDiagnosisList([]);
      setIsLoading(false);
    }
    setSelected(current);
  };

  const handelSearch = (e: any) => {
    setIsLoading(true);
    fetchDiagnosis(e.target.value);
    setIsLoading(false);
  };

  const fetchDiagnosis = useMemo(
    () =>
      debounce(async (text: string) => {
        const res = await dispatchAction(
          listICD11Diagnosis({ query: text }, "")
        );

        if (res && res.data) {
          setDiagnosisList(res.data);
        }
      }, 300),
    [dispatchAction]
  );

  return (
    <AutoCompleteAsyncField
      name={name}
      multiple={true}
      variant="outlined"
      margin={margin}
      defaultValue={selected}
      options={diagnosisList}
      onSearch={handelSearch}
      onChange={(e: object, selected: ICD11DiagnosisModel[]) =>
        handleValueChange(selected)
      }
      loading={isLoading}
      placeholder="Search diagnosis"
      noOptionsText="No results found"
      renderOption={(option: ICD11DiagnosisModel) => <div>{option.label}</div>}
      getOptionSelected={(
        option: ICD11DiagnosisModel,
        value: ICD11DiagnosisModel
      ) => option.id === value.id}
      getOptionLabel={(option: ICD11DiagnosisModel) => option?.label || ""}
      filterOptions={(options: ICD11DiagnosisModel[]) => options}
      errors={errors}
      className={className}
    />
  );
};
