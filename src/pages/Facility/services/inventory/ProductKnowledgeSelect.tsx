import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

// Mapper function to map ProductKnowledgeBase to picker definition
const productKnowledgeMapper = (
  item: ProductKnowledgeBase
): BaseCategoryPickerDefinition => ({
  ...item,
  title: item.name,
});

interface ProductKnowledgeSelectProps {
  value?: ProductKnowledgeBase;
  onChange: (value: ProductKnowledgeBase) => void;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  enableFavorites?: boolean;
}

export function ProductKnowledgeSelect({
  value,
  onChange,
  disabled = false,
  readOnly = false,
  className,
  placeholder,
  enableFavorites = true,
}: ProductKnowledgeSelectProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacility();
  const [activeTab, setActiveTab] = useState("all");

  const handleValueChange = (
    selectedValue:
      | ProductKnowledgeBase
      | ProductKnowledgeBase[]
      | undefined
  ) => {
    if (!selectedValue) {
      onChange({} as ProductKnowledgeBase);
      return;
    }

    const selected =
      Array.isArray(selectedValue) && selectedValue.length > 0
        ? selectedValue[0]
        : (selectedValue as ProductKnowledgeBase);

    onChange(selected);
  };

  return (
    <div className={className}>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">{t("all")}</TabsTrigger>
          {enableFavorites && (
            <TabsTrigger value="favorites">{t("favorites")}</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="all" className="mt-2">
          <ResourceDefinitionCategoryPicker<ProductKnowledgeBase>
            searchParamName="name"
            facilityId={facilityId}
            value={value}
            onValueChange={handleValueChange}
            placeholder={placeholder || t("select_product_knowledge")}
            disabled={disabled || readOnly}
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
            enableFavorites={false}
          />
        </TabsContent>

        {enableFavorites && (
          <TabsContent value="favorites" className="mt-2">
            <ResourceDefinitionCategoryPicker<ProductKnowledgeBase>
              searchParamName="name"
              facilityId={facilityId}
              value={value}
              onValueChange={handleValueChange}
              placeholder={placeholder || t("select_product_knowledge")}
              disabled={disabled || readOnly}
              resourceType={ResourceCategoryResourceType.product_knowledge}
            listDefinitions={{
              queryFn: productKnowledgeApi.listFavorites,
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
              enableFavorites={false}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
