import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface AccessibleRoleOrgSelectProps {
  value?: string;
  onChange: (value?: Organization) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
}

/**
 * Select component that shows only role organizations the current user
 * has access to (via the accessible_role_organizations endpoint).
 * For superusers, returns all role orgs. For regular users, returns
 * only orgs they belong to or manage.
 */
export function AccessibleRoleOrgSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
}: AccessibleRoleOrgSelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["accessibleRoleOrganizations", searchQuery],
    queryFn: query.debounced(organizationApi.accessibleRoleOrganizations, {
      queryParams: {
        name: searchQuery || undefined,
      },
    }),
  });

  // Unwrap the nested response: { organization, role } → Organization
  const searchOrgs =
    searchResults?.results?.map((item) => item.organization) || [];

  // Fetch selected org if not in search results
  const { data: selectedData } = useQuery({
    queryKey: ["organizations", "role", value, "selected"],
    queryFn: query(organizationApi.get, {
      pathParams: { id: value! },
    }),
    enabled: !!value && !searchOrgs.some((org) => org.id === value),
  });

  const allOptions =
    value && selectedData && !searchOrgs.some((o) => o.id === value)
      ? [...searchOrgs, selectedData]
      : searchOrgs;

  return (
    <Autocomplete
      value={value || ""}
      onChange={(selectedId) => {
        if (!selectedId) {
          onChange(undefined);
          return;
        }
        const selectedOrg = allOptions.find((org) => org.id === selectedId);
        if (selectedOrg) {
          onChange(selectedOrg);
        }
      }}
      onSearch={setSearchQuery}
      options={allOptions.map((org) => ({
        label: org.name,
        value: org.id,
      }))}
      isLoading={isSearching}
      placeholder={placeholder || t("select_role_organization")}
      inputPlaceholder={inputPlaceholder || t("search_organization")}
      noOptionsMessage={noOptionsMessage || t("no_organization_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
    />
  );
}
