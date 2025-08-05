import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { Role } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

interface RoleSelectProps {
  value?: Role;
  onChange: (value: Role) => void;
  disabled?: boolean;
  className?: string;
}

export function RoleSelect({
  value,
  onChange,
  disabled,
  className,
}: RoleSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", searchTerm],
    queryFn: query.debounced(roleApi.listRoles, {
      queryParams: { name: searchTerm },
    }),
  });

  const options = mergeAutocompleteOptions(
    roles?.results.map((role) => ({
      label: role.name,
      value: role.id,
    })) || [],
    value ? { label: value.name, value: value.id } : undefined,
  );

  return (
    <Autocomplete
      value={value?.id || ""}
      onChange={(selectedId) => {
        const selectedRole = roles?.results.find((r) => r.id === selectedId);
        if (selectedRole) {
          onChange(selectedRole);
        } else {
          onChange(undefined as any);
        }
      }}
      onSearch={setSearchTerm}
      options={options}
      isLoading={isLoading}
      placeholder={t("select_role")}
      inputPlaceholder={t("search_roles")}
      noOptionsMessage={t("no_roles_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
    />
  );
}
