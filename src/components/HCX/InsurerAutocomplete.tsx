import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import routes from "../../Redux/api";
import { mergeQueryOptions } from "../../Utils/utils";
import useQuery from "../../Utils/request/useQuery";
import { useState } from "react";

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
