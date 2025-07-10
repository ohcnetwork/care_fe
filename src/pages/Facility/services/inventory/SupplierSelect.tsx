import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface SupplierSelectProps {
  value?: Organization;
  onChange: (value: Organization) => void;
  disabled?: boolean;
  className?: string;
  showClearButton?: boolean;
}

export function SupplierSelect({
  value,
  onChange,
  disabled,
  className,
  showClearButton = true,
}: SupplierSelectProps) {
  const { t } = useTranslation();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ["organizations", "product_supplier"],
    queryFn: query(organizationApi.list, {
      queryParams: { org_type: "product_supplier" },
    }),
  });

  const options = mergeAutocompleteOptions(
    suppliers?.results.map((supplier) => ({
      label: supplier.name,
      value: supplier.id,
    })) || [],
    value ? { label: value.name, value: value.id } : undefined,
  );

  return (
    <Autocomplete
      value={value?.id || ""}
      onChange={(selectedId) => {
        const selectedSupplier = suppliers?.results.find(
          (s) => s.id === selectedId,
        );
        if (selectedSupplier) {
          onChange(selectedSupplier);
        } else {
          onChange(undefined as any);
        }
      }}
      options={options}
      isLoading={isLoading}
      placeholder={t("select_supplier")}
      inputPlaceholder={t("search_suppliers")}
      noOptionsMessage={t("no_suppliers_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
      showClearButton={showClearButton}
    />
  );
}
