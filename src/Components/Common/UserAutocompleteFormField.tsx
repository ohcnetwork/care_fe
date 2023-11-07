import { UserRole } from "@/Common/constants";
import { useAsyncOptions } from "@/Common/hooks/useAsyncOptions";
import { Autocomplete } from "@/Components/Form/FormFields/Autocomplete";
import FormField from "@/Components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/Components/Form/FormFields/Utils";
import { UserModel } from "@/Components/Users/models";
import { getFacilityUsers, getUserList } from "@/Redux/actions";
import { isUserOnline } from "@/Utils/utils";

type Props = FormFieldBaseProps<UserModel> & {
  placeholder?: string;
  facilityId?: string;
  homeFacility?: string;
  userType?: UserRole;
  showActiveStatus?: boolean;
};

export default function UserAutocompleteFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const { fetchOptions, isLoading, options } = useAsyncOptions<UserModel>(
    "id",
    { queryResponseExtractor: (data) => data.results }
  );

  let search_filter: {
    limit: number;
    offset: number;
    home_facility?: string;
    user_type?: string;
    search_text?: string;
  } = { limit: 5, offset: 0 };

  if (props.showActiveStatus && props.userType) {
    search_filter = { ...search_filter, user_type: props.userType };
  }

  if (props.homeFacility) {
    search_filter = { ...search_filter, home_facility: props.homeFacility };
  }

  const getStatusIcon = (option: UserModel) => {
    if (!props.showActiveStatus) return null;

    return (
      <div className="mr-6 mt-[2px]">
        <svg
          className={`h-3 w-3 ${
            isUserOnline(option) ? "text-green-500" : "text-gray-400"
          }`}
          fill="currentColor"
          viewBox="0 0 8 8"
        >
          <circle cx="4" cy="4" r="4" />
        </svg>
      </div>
    );
  };

  return (
    <FormField field={field}>
      <div className="relative">
        <Autocomplete
          id={field.id}
          disabled={field.disabled}
          placeholder={props.placeholder}
          value={field.value}
          onChange={field.handleChange}
          options={options(field.value && [field.value])}
          optionLabel={getUserFullName}
          optionIcon={getStatusIcon}
          optionDescription={(option) => `${option.user_type}`}
          optionValue={(option) => option}
          onQuery={(query) =>
            fetchOptions(
              props.facilityId
                ? getFacilityUsers(props.facilityId, {
                    ...search_filter,
                    search_text: query,
                  })
                : getUserList({ ...search_filter, search_text: query })
            )
          }
          isLoading={isLoading}
        />
      </div>
    </FormField>
  );
}

const getUserFullName = (user: UserModel) => {
  const personName = user.first_name + " " + user.last_name;
  return personName.trim().length > 0 ? personName : user.username || "";
};
