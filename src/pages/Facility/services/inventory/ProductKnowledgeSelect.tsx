import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import query from "@/Utils/request/query";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface ProductKnowledgeSelectProps {
  value?: ProductKnowledgeBase;
  onChange: (value: ProductKnowledgeBase) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export function ProductKnowledgeSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder,
}: ProductKnowledgeSelectProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["productKnowledge", "search", search],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        status: ProductKnowledgeStatus.active,
        name: search,
      },
    }),
  });

  const productKnowledges = data?.results || [];

  return (
    <Autocomplete
      value={value?.id || ""}
      onSearch={setSearch}
      onChange={(selectedId) => {
        if (!selectedId) {
          onChange({} as any);
          return;
        }
        const selectedProductKnowledge = productKnowledges.find(
          (p) => p.id === selectedId,
        );
        if (selectedProductKnowledge) {
          onChange(selectedProductKnowledge);
        }
      }}
      options={productKnowledges.map(({ name, id }) => ({
        label: name,
        value: id,
      }))}
      isLoading={isLoading}
      placeholder={placeholder || t("search_product_knowledge")}
      noOptionsMessage={t("no_product_knowledge_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
    />
  );
}
