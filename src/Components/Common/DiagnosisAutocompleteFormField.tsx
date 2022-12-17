import CareIcon from "../../CAREUI/icons/CareIcon";
import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { listICD11Diagnosis } from "../../Redux/actions";
import { ICD11DiagnosisModel } from "../Facility/models";
import AutocompleteMultiSelectFormField from "../Form/FormFields/AutocompleteMultiselect";
import { FormFieldBaseProps } from "../Form/FormFields/Utils";

type Props =
  | ({ multiple?: false | undefined } & FormFieldBaseProps<string>)
  | ({ multiple: true } & FormFieldBaseProps<string[]>);

export function DiagnosisSelectFormField(props: Props) {
  const { fetchOptions, isLoading, options } =
    useAsyncOptions<ICD11DiagnosisModel>();

  if (props.multiple) {
    return (
      <AutocompleteMultiSelectFormField
        {...props}
        options={options}
        optionLabel={(option) => option.label}
        optionValue={(option) => option.id}
        onQuery={(query) => fetchOptions(listICD11Diagnosis({ query }, ""))}
        dropdownIcon={
          isLoading && (
            <CareIcon className="care-l-spinner animate-spin -mb-1.5" />
          )
        }
      />
    );
  }

  return (
    <div className="bg-danger-500 text-white font-bold">
      Component not implemented
    </div>
  );
}
