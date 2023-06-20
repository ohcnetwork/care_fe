import { useAsyncOptions } from "../../Common/hooks/useAsyncOptions";
import { getUserList } from "../../Redux/actions";
import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import { UserModel } from "../Users/models";

type Props = FormFieldBaseProps<UserModel> & {
  placeholder?: string;
};

export default function UserAutocompleteFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const { fetchOptions, isLoading, options } = useAsyncOptions<UserModel>(
    "id",
    { queryResponseExtractor: (data) => data.results }
  );

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled}
        placeholder={props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options(field.value && [field.value])}
        optionLabel={getUserFullName}
        optionDescription={(option) => `${option.user_type}`}
        optionValue={(option) => option}
        onQuery={(query) =>
          fetchOptions(getUserList({ limit: 5, offset: 0, search_text: query }))
        }
        isLoading={isLoading}
      />
    </FormField>
  );
}

const getUserFullName = (user: UserModel) => {
  const personName = user.first_name + " " + user.last_name;
  return personName.trim().length > 0 ? personName : user.username || "";
};
