import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { ResourceCategoryList } from "@/components/Common/ResourceCategoryList";
import { ProductKnowledgeList as ProductKnowledgeListComponent } from "@/pages/Facility/settings/productKnowledge/ProductKnowledgeListComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { useState } from "react";

interface ProductKnowledgeListProps {
  facilityId: string;
  categorySlug?: string;
}

export default function ProductKnowledgeList({
  facilityId,
  categorySlug,
}: ProductKnowledgeListProps) {
  const { t } = useTranslation();
  const [allowCategoryCreate, setAllowCategoryCreate] = useState(false);

  const onNavigate = (slug: string) => {
    navigate(
      `/facility/${facilityId}/settings/product_knowledge/categories/${slug}`,
    );
  };

  const onCreateItem = () => {
    navigate(
      `/facility/${facilityId}/settings/product_knowledge/categories/${categorySlug}/new`,
    );
  };

  return (
    <Page title={t("product_knowledge")} hideTitleOnPage>
      <ResourceCategoryList
        allowCategoryCreate={allowCategoryCreate}
        facilityId={facilityId}
        categorySlug={categorySlug}
        resourceType={ResourceCategoryResourceType.product_knowledge}
        basePath={`/facility/${facilityId}/settings/product_knowledge`}
        baseTitle={t("product_knowledge")}
        onNavigate={onNavigate}
        onCreateItem={onCreateItem}
        createItemLabel={t("add_product_knowledge")}
        createItemIcon="l-plus"
        createItemTooltip={t("products_can_only_be_added_to_leaf_categories")}
      >
        {categorySlug && (
          <ProductKnowledgeListComponent
            facilityId={facilityId}
            categorySlug={categorySlug}
            setAllowCategoryCreate={setAllowCategoryCreate}
          />
        )}
      </ResourceCategoryList>
    </Page>
  );
}
