import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { listMedibaseMedicines } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { MedibaseMedicine } from "./models";

export default function MedibaseAutocompleteFormField(
  props: FormFieldBaseProps<MedibaseMedicine>
) {
  const field = useFormFieldPropsResolver(props);
  const { isLoading, options, fetchOptions } =
    useAsyncOptions<MedibaseMedicine>("id");

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        value={field.value}
        required
        onChange={field.handleChange}
        options={options(field.value && [field.value])}
        optionLabel={(option) => option.name.toUpperCase()}
        optionDescription={(option) => <OptionDescription medicine={option} />}
        optionValue={(option) => option}
        optionIcon={(option) =>
          option.type === "brand" ? (
            <OptionChip name="Brand" value={option.company || ""} />
          ) : (
            <OptionChip value={option.type} />
          )
        }
        onQuery={(query) => fetchOptions(listMedibaseMedicines(query))}
        isLoading={isLoading}
      />
    </FormField>
  );
}

const OptionDescription = ({ medicine }: { medicine: MedibaseMedicine }) => {
  return (
    <div className="p-1">
      {medicine.atc_classification && (
        <span className="text-xs">
          ATC Class: {medicine.atc_classification}
        </span>
      )}
      <div className="mt-2 flex w-full flex-wrap gap-2">
        <OptionChip name="CIMS Class" value={medicine.cims_class} />
        {medicine.generic && (
          <OptionChip name="Generic" value={medicine.generic} />
        )}
      </div>
    </div>
  );
};

const OptionChip = (props: { name?: string; value: string }) => {
  return (
    <div className="mt-1 flex h-fit max-w-fit gap-1 whitespace-nowrap rounded-full border border-secondary-400 bg-secondary-100 px-2 text-center text-xs uppercase sm:mt-0">
      <span className="font-normal text-gray-800">
        {props.name && props.name + ":"}
      </span>
      <span className="font-medium text-gray-900">{props.value}</span>
    </div>
  );
};
