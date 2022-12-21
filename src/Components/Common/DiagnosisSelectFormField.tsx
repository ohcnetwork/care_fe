import { useEffect } from "react";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { listICD11Diagnosis } from "../../Redux/actions";
import { ICD11DiagnosisModel } from "../Facility/models";
import { AutocompleteMutliSelect } from "../Form/FormFields/AutocompleteMultiselect";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  resolveFormFieldChangeEventHandler,
} from "../Form/FormFields/Utils";

type Props =
  // | ({ multiple?: false | undefined } & FormFieldBaseProps<string>) // uncomment when single select form field is required and implemented.
  { multiple: true } & FormFieldBaseProps<ICD11DiagnosisModel[]>;

export function DiagnosisSelectFormField(props: Props) {
  const { name } = props;
  const handleChange = resolveFormFieldChangeEventHandler(props);

  const {
    fetchOptions,
    isLoading,
    selectedOptions,
    options,
    setSelectedOptions,
  } = useAsyncOptions<ICD11DiagnosisModel>();

  useEffect(() => {
    handleChange({ name, value: selectedOptions });
  }, [selectedOptions]);

  if (!props.multiple) {
    return (
      <div className="bg-danger-500 text-white font-bold">
        Component not implemented
      </div>
    );
  }

  return (
    <FormField props={props}>
      <AutocompleteMutliSelect
        id={props.id}
        disabled={props.disabled}
        value={selectedOptions}
        options={options}
        optionLabel={(option) => option.label}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(listICD11Diagnosis({ query }, ""))}
        dropdownIcon={
          isLoading && (
            <CareIcon className="care-l-spinner animate-spin -mb-1.5" />
          )
        }
        onChange={setSelectedOptions}
      />
    </FormField>
  );
}
