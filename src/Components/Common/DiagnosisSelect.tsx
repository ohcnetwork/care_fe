import { useState, useMemo } from "react";
import { useDispatch } from "react-redux";
import { listICD11Diagnosis } from "../../Redux/actions";
import { AutoCompleteAsyncField } from "./HelperInputFields";
import { debounce } from "lodash";

interface DiagnosisModel {
  id: string;
  label: string;
}
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
  selected: DiagnosisModel[] | null;
  setSelected: (selected: DiagnosisModel | DiagnosisModel[] | null) => void;
}

export const DiagnosisSelect = (props: DiagnosisSelectProps) => {
  const { name, selected, setSelected, margin, errors, className = "" } = props;
  const dispatchAction: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisList, setDiagnosisList] = useState<Array<DiagnosisModel>>([]);

  const handleValueChange = (current: DiagnosisModel | null) => {
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
          setDiagnosisList(
            res.data.map((item: DiagnosisModel) => ({
              id: item.label,
              label: item.label,
            }))
          );
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
      onChange={(e: object, selected: DiagnosisModel) =>
        handleValueChange(selected)
      }
      loading={isLoading}
      placeholder="Search diagnosis"
      noOptionsText="No results found"
      renderOption={(option: DiagnosisModel) => <div>{option.label}</div>}
      getOptionSelected={(option: DiagnosisModel, value: DiagnosisModel) =>
        option.id === value.id
      }
      getOptionLabel={(option: DiagnosisModel) => option?.label || ""}
      filterOptions={(options: DiagnosisModel[]) => options}
      errors={errors}
      className={className}
    />
  );
};
