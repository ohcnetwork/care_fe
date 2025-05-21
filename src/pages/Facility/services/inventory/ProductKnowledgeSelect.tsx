import { useQuery } from "@tanstack/react-query";
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
}

export function ProductKnowledgeSelect({
  value,
  onChange,
  disabled,
  className,
}: ProductKnowledgeSelectProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();

  const { data, isLoading } = useQuery({
    queryKey: ["productKnowledge"],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: ProductKnowledgeStatus.active,
      },
    }),
  });

  const productKnowledges = data?.results || [];

  return (
    <Autocomplete
      value={value?.id || ""}
      onChange={(selectedId) => {
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
      placeholder={t("search_product_knowledge")}
      noOptionsMessage={t("no_product_knowledge_found")}
      disabled={disabled}
      className={className}
      closeOnSelect
    />
  );
}
