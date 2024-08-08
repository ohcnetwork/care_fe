import { Autocomplete } from "../Form/FormFields/Autocomplete";
import FormField from "../Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "../Form/FormFields/Utils";
import {
  classNames,
  formatName,
  isUserOnline,
  mergeQueryOptions,
} from "../../Utils/utils";
import { UserRole } from "../../Common/constants";
import { useEffect, useState } from "react";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { UserBareMinimum } from "../Users/models";

type BaseProps = FormFieldBaseProps<UserBareMinimum> & {
  placeholder?: string;
  userType?: UserRole;
  noResultsError?: string;
};

type LinkedFacilitySearchProps = BaseProps & {
  facilityId: string;
  homeFacility?: undefined;
};

type UserSearchProps = BaseProps & {
  facilityId?: undefined;
  homeFacility?: string;
};

type Props = UserSearchProps | LinkedFacilitySearchProps;

/**
 * **Deprecated.**
 *
 * This component simply acts as a proxy to the `UserAutocomplete` or
 * `LinkedFacilityUserAutocomplete` components based on the props passed. Use
 * those components directly instead.
 */
export default function UserAutocompleteFormField(props: Props) {
  if (props.facilityId) {
    return <LinkedFacilityUserAutocomplete {...props} />;
  }
  return <UserAutocomplete {...(props as UserSearchProps)} />;
}

export const LinkedFacilityUserAutocomplete = (
  props: LinkedFacilitySearchProps,
) => {
  const field = useFormFieldPropsResolver(props);

  const [query, setQuery] = useState("");

  const { data, loading } = useQuery(routes.getFacilityUsers, {
    pathParams: { facility_id: props.facilityId },
    query: {
      user_type: props.userType,
      search_text: query,
      limit: 50,
      offset: 0,
    },
  });

  const options = mergeQueryOptions(
    field.value && !query ? [field.value] : [],
    data?.results ?? [],
    (obj) => obj.username,
  );

  const noResultError =
    (!query &&
      !loading &&
      field.required &&
      !options.length &&
      props.noResultsError) ||
    undefined;

  useEffect(() => {
    if (noResultError) {
      field.handleChange(undefined as unknown as UserBareMinimum);
    }
  }, [noResultError]);

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled || !!noResultError}
        // Voluntarily casting type as true to ignore type errors.
        required={field.required as true}
        placeholder={noResultError || props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options}
        optionLabel={formatName}
        optionIcon={userOnlineDot}
        optionDescription={(option) =>
          `${option.user_type} - ${option.username}`
        }
        optionValue={(option) => option}
        onQuery={setQuery}
        isLoading={loading}
      />
    </FormField>
  );
};
export const UserAutocomplete = (props: UserSearchProps) => {
  const field = useFormFieldPropsResolver(props);

  const [query, setQuery] = useState("");

  const { data, loading } = useQuery(routes.userList, {
    query: {
      home_facility: props.homeFacility,
      user_type: props.userType,
      search_text: query,
      limit: 50,
      offset: 0,
    },
  });

  const options = mergeQueryOptions(
    field.value && !query ? [field.value] : [],
    data?.results ?? [],
    (obj) => obj.username,
  );

  const noResultError =
    (!query &&
      !loading &&
      field.required &&
      !options.length &&
      props.noResultsError) ||
    undefined;

  useEffect(() => {
    if (noResultError) {
      field.handleChange(undefined as unknown as UserBareMinimum);
    }
  }, [noResultError]);

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled || !!noResultError}
        // Voluntarily casting type as true to ignore type errors.
        required={field.required as true}
        placeholder={noResultError || props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={options}
        optionLabel={formatName}
        optionIcon={userOnlineDot}
        optionDescription={(option) =>
          `${option.user_type} - ${option.username}`
        }
        optionValue={(option) => option}
        onQuery={setQuery}
        isLoading={loading}
      />
    </FormField>
  );
};

const userOnlineDot = (user: UserBareMinimum) => (
  <div
    className={classNames(
      "mr-4 size-2.5 rounded-full ",
      isUserOnline(user) ? "bg-primary-500" : "bg-secondary-400",
    )}
  />
);
