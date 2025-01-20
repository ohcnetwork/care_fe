import { useEffect, useState } from "react";

import { Autocomplete } from "@/components/Form/FormFields/Autocomplete";
import FormField from "@/components/Form/FormFields/FormField";
import {
  FormFieldBaseProps,
  useFormFieldPropsResolver,
} from "@/components/Form/FormFields/Utils";
import { UserType } from "@/components/Users/UserFormValidations";
import { UserBareMinimum } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import {
  classNames,
  formatName,
  isUserOnline,
  mergeQueryOptions,
} from "@/Utils/utils";

import { Avatar } from "./Avatar";

type BaseProps = FormFieldBaseProps<UserBareMinimum> & {
  placeholder?: string;
  userType?: UserType;
  noResultsError?: string;
};

type UserSearchProps = BaseProps & {
  facilityId?: undefined;
  homeFacility?: string;
};

export default function UserAutocomplete(props: UserSearchProps) {
  const field = useFormFieldPropsResolver(props);
  const [query, setQuery] = useState("");
  const [disabled, setDisabled] = useState(false);

  const { data, loading } = useTanStackQueryInstead(routes.userList, {
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

const userOnlineDot = (user: UserBareMinimum) => (
  <div
    className={classNames(
      "mr-4 size-2.5 rounded-full",
      isUserOnline(user) ? "bg-primary-500" : "bg-secondary-400",
    )}
  />
);
