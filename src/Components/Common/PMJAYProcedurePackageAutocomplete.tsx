import { useAsyncOptions } from "@/Common/hooks/useAsyncOptions";
import { Autocomplete } from "@/Components/Form/FormFields/Autocomplete";
import FormField from "@/Components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/Components/Form/FormFields/Utils";
import { listPMJYPackages } from "@/Redux/actions";

type PMJAYPackageItem = {
  name?: string;
  code?: string;
  price?: number;
  package_name?: string;
};

type Props = FormFieldBaseProps<PMJAYPackageItem>;

export default function PMJAYProcedurePackageAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props as any);

  const { fetchOptions, isLoading, options } =
    useAsyncOptions<PMJAYPackageItem>("code");

  return (
    <FormField field={field}>
      <Autocomplete
        required
        id={field.id}
        disabled={field.disabled}
        value={field.value}
        onChange={field.handleChange}
        options={options(field.value ? [field.value] : []).map((o) => {
          // TODO: update backend to return price as number instead
          return {
            ...o,
            price:
              o.price && parseFloat(o.price?.toString().replaceAll(",", "")),
          };
        })}
        optionLabel={optionLabel}
        optionDescription={optionDescription}
        optionValue={(option) => option}
        onQuery={(query) => fetchOptions(listPMJYPackages(query))}
        isLoading={isLoading}
      />
    </FormField>
  );
}

const optionLabel = (option: PMJAYPackageItem) => {
  if (option.name) return option.name;
  if (option.package_name) return `${option.package_name} (Package)`;
  return "Unknown";
};

const optionDescription = (option: PMJAYPackageItem) => {
  const code = option.code || "Unknown";
  const packageName = option.package_name || "Unknown";
  return `Package: ${packageName} (${code})`;
};
