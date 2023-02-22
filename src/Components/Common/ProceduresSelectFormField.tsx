import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { listPMJYPackages } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";

type Props = FormFieldBaseProps<string>;

export function ProceduresSelectFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const dispatch = useDispatch<any>();
  const [options, setOptions] = useState<string[]>([]);

  const query = async (query: string) => {
    const res = await dispatch(listPMJYPackages(query));
    if (res?.data) {
      setOptions(res.data.map((o: any) => o.name));
    }
  };

  useEffect(() => {
    query(props.value ?? "");
  }, []);

  console.log("Options", options);
  console.log("Field:", field.value, "|", options.includes(field.value));
  console.log("Props", props);

  return (
    <FormField field={field}>
      <Autocomplete
        required={false}
        id={field.id}
        disabled={field.disabled}
        value={field.value || []}
        onChange={(o) => {
          console.log("onChange", o);
          field.handleChange(o);
        }}
        options={options}
        optionLabel={(option) => option}
        optionValue={(option) => option}
        onQuery={query}
        // isLoading={isLoading}
        allowRawInput
      />
    </FormField>
  );
}
