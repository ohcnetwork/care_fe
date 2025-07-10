import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface OrgSelectProps {
  value?: string; // Organization ID
  onChange: (value?: Organization) => void;
  orgType: string;
  disabled?: boolean;
  className?: string;
  "data-cy"?: string;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
}

export function OrgSelect({
  value,
  onChange,
  orgType,
  disabled,
  className,
  "data-cy": dataCy,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
}: OrgSelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  // Query for search results
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["organizations", orgType, searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        org_type: orgType,
        name: searchQuery || undefined,
      },
    }),
  });

  // Query for selected organization if not in search results
  const { data: selectedData } = useQuery({
    queryKey: ["organizations", orgType, value, "selected"],
    queryFn: query(organizationApi.list, {
      queryParams: {
        org_type: orgType,
        id: value,
      },
    }),
    enabled:
      !!value && !searchResults?.results?.some((org) => org.id === value),
  });

  const searchOptions = searchResults?.results || [];
  const allOptions = value
    ? [...searchOptions, ...(selectedData?.results || [])]
    : searchOptions;

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
      placeholder={placeholder || t("search_organization")}
      inputPlaceholder={inputPlaceholder || t("search_organization")}
      noOptionsMessage={noOptionsMessage || t("no_organization_found")}
      disabled={disabled}
      className={className}
      data-cy={dataCy}
      closeOnSelect
    />
  );
}
