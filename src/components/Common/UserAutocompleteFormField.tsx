import { useEffect, useState } from "react";

import { Autocomplete } from "@/components/Form/FormFields/Autocomplete";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import { UserBareMinimum } from "@/components/Users/models";

import { UserRole } from "@/common/constants";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  formatName,
  isUserOnline,
  mergeQueryOptions,
} from "@/Utils/utils";

import { Avatar } from "./Avatar";

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

export default function UserAutocomplete(props: UserSearchProps) {
  const field = useFormFieldPropsResolver(props);
  const [query, setQuery] = useState("");
  const [disabled, setDisabled] = useState(false);

  const { data, loading } = useQuery(routes.userList, {
    query: {
      home_facility: props.homeFacility,
      user_type: props.userType,
      search_text: query,
      limit: 50,
      offset: 0,
    },
  });

  useEffect(() => {
    if (
      loading ||
      query ||
      !field.required ||
      !props.noResultsError ||
      !data?.results
    ) {
      return;
    }

    if (data.results.length === 0) {
      setDisabled(true);
      field.handleChange(undefined as unknown as UserBareMinimum);
    }
  }, [loading, field.required, data?.results, props.noResultsError]);

  const getAvatar = (option: UserBareMinimum) => {
    return (
      <Avatar
        className="h-11 w-11 rounded-full"
        name={formatName(option)}
        imageUrl={option.read_profile_picture_url}
      />
    );
  };

  return (
    <FormField field={field}>
      <Autocomplete
        id={field.id}
        disabled={field.disabled || disabled}
        required={field.required as true}
        placeholder={(disabled && props.noResultsError) || props.placeholder}
        value={field.value}
        onChange={field.handleChange}
        options={mergeQueryOptions(
          field.value ? [field.value] : [],
          data?.results ?? [],
          (obj) => obj.username,
        )}
        optionLabel={formatName}
        optionIcon={userOnlineDot}
        optionImage={getAvatar}
        optionDescription={(option) =>
          `${option.user_type} - ${option.username}`
        }
        optionValue={(option) => option}
        onQuery={setQuery}
        isLoading={loading}
      />
    </FormField>
  );
}

export const LinkedFacilityUsers = (props: LinkedFacilitySearchProps) => {
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

  const noResultError =
    (!query &&
      !loading &&
      field.required &&
      !data?.results?.length &&
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
        options={mergeQueryOptions(
          field.value ? [field.value] : [],
          data?.results ?? [],
          (obj) => obj.username,
        )}
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
      "mr-4 size-2.5 rounded-full",
      isUserOnline(user) ? "bg-primary-500" : "bg-secondary-400",
    )}
  />
);
