import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { listICD11Diagnosis } from "../../Redux/actions";
import { ICD11DiagnosisModel } from "../Facility/models";
import { AutocompleteMutliSelect } from "../Form/FormFields/AutocompleteMultiselect";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

type Props =
  // | ({ multiple?: false | undefined } & FormFieldBaseProps<ICD11DiagnosisModel>) // uncomment when single select form field is required and implemented.
  { multiple: true } & FormFieldBaseProps<ICD11DiagnosisModel[]>;

export function DiagnosisSelectFormField(props: Props) {
  const field = useFormFieldPropsResolver(props);
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<ICD11DiagnosisModel>("id");

  if (!props.multiple) {
    return (
      <div className="bg-danger-500 font-bold text-white">
        Component not implemented
      </div>
    );
  }

  return (
    <FormField field={field}>
      <AutocompleteMutliSelect
        id={field.id}
        disabled={field.disabled}
        value={field.value || []}
        onChange={field.handleChange}
        options={options(props.value)}
        optionLabel={(option) => option.label}
        optionValue={(option) => option}
        onQuery={(query) =>
          fetchOptions(listICD11Diagnosis({ query }, field.id || ""))
        }
        isLoading={isLoading}
      />
    </FormField>
  );
}
