import { useState } from "react";

import { Autocomplete } from "@/components/Form/FormFields/Autocomplete";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { mergeQueryOptions } from "@/Utils/utils";

export type InsurerOptionModel = {
  name: string;
  code: string;
};

type Props = FormFieldBaseProps<InsurerOptionModel> & {
  placeholder?: string;
};

export default function InsurerAutocomplete(props: Props) {
  const field = useFormFieldPropsResolver(props);

  const [query, setQuery] = useState("");

  const { data, loading } = useQuery(routes.hcx.policies.listPayors, {
    query: { query, limit: 10 },
  });

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        // Voluntarily casting type as true to ignore type errors.
        required={field.required as true}
        disabled={field.disabled}
        placeholder={props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={mergeQueryOptions(
          field.value ? [field.value] : [],
          data ?? [],
          (obj) => obj.code,
        )}
        optionLabel={(option) => option.name}
        optionDescription={(option) => option.code}
        optionValue={(option) => option}
        onQuery={setQuery}
        isLoading={loading}
      />
    </FormField>
  );
}
