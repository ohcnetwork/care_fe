import { useTranslation } from "react-i18next";

import {
  BaseCategoryPickerDefinition,
  ResourceDefinitionCategoryPicker,
} from "@/components/Common/ResourceDefinitionCategoryPicker";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

const productKnowledgeMapper = (
  item: ProductKnowledgeBase,
): BaseCategoryPickerDefinition => ({
  ...item,
  title: item.name,
});

interface ProductKnowledgeSelectProps {
  value?: ProductKnowledgeBase;
  onChange: (value: ProductKnowledgeBase) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  enableFavorites?: boolean;
}

export function ProductKnowledgeSelect({
  value,
  onChange,
  disabled,
  className,
  placeholder,
  enableFavorites = true,
}: ProductKnowledgeSelectProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();

  return (
    <ResourceDefinitionCategoryPicker<ProductKnowledgeBase>
      searchParamName="name"
      facilityId={facilityId}
      value={value}
      onValueChange={(
        selectedValue:
          | ProductKnowledgeBase
          | ProductKnowledgeBase[]
          | undefined,
      ) => {
        if (!selectedValue) {
          onChange({} as ProductKnowledgeBase);
          return;
        }
        onChange(
          Array.isArray(selectedValue) ? selectedValue[0] : selectedValue,
        );
      }}
      placeholder={placeholder || t("select_product_knowledge")}
      disabled={disabled}
      className={className}
      resourceType={ResourceCategoryResourceType.product_knowledge}
      listDefinitions={{
        queryFn: productKnowledgeApi.listProductKnowledge,
        queryParams: {
          facility: facilityId,
          status: ProductKnowledgeStatus.active,
        },
      }}
      mapper={productKnowledgeMapper}
      translations={{
        searchPlaceholder: "search_product_knowledge",
        selectPlaceholder: "select_product_knowledge",
        noResultsFound: "no_product_knowledge_found_for",
        noItemsFound: "no_product_knowledge_found",
      }}
      enableFavorites={enableFavorites}
      favoritesConfig={
        enableFavorites
          ? {
              listFavorites: {
                queryFn: productKnowledgeApi.listFavorites,
              },
              addFavorite: {
                queryFn: productKnowledgeApi.addFavorite,
              },
              removeFavorite: {
                queryFn: productKnowledgeApi.removeFavorite,
              },
            }
          : undefined
      }
    />
  );
}
