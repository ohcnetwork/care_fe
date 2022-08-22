import { useState, useEffect, useCallback } from "react";
import { AutoCompleteAsyncField } from "../Common/HelperInputFields";
import { listICD11Diagnosis } from "../../Redux/actions";
import { useDispatch } from "react-redux";

const DiagnosisSelect = ({ value, setDiagnosis }) => {
  const dispatchAction: any = useDispatch();
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      setLoading(true);
      const result = await dispatchAction(
        listICD11Diagnosis({ query: searchTerm || value })
      );
      setDiagnosisOptions(result?.data || []);
      setLoading(false);
    };

    if (searchTerm.length > 2 || value) {
      fetchDiagnosis();
    }
  }, [dispatchAction, searchTerm, value]);

  return (
    <AutoCompleteAsyncField
      name="diagnosis"
      value={value}
      options={diagnosisOptions}
      onSearch={(e) => setSearchTerm(e.target.value)}
      onChange={(_e: any, diagnosis: any) => setDiagnosis(diagnosis)}
      renderOption={(option: any) => <div>{option?.label}</div>}
      getOptionSelected={(option: any, value: any) => option?.label === value}
      getOptionLabel={(option: any) => option?.label || ""}
      variant="outlined"
      placeholder="Start typing diagnosis"
      loading={loading}
    />
  );
};

export default DiagnosisSelect;
