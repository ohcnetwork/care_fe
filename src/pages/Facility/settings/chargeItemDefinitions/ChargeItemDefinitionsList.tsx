import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { ResourceCategoryList } from "@/components/Common/ResourceCategoryList";
import { ChargeItemList } from "@/pages/Facility/settings/chargeItemDefinitions/ChargeItemDefinitionListComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { useState } from "react";

interface ChargeItemDefinitionsListProps {
  facilityId: string;
  categorySlug?: string;
}

export function ChargeItemDefinitionsList({
  facilityId,
  categorySlug,
}: ChargeItemDefinitionsListProps) {
  const { t } = useTranslation();
  const [allowCategoryCreate, setAllowCategoryCreate] = useState(false);

  const onNavigate = (slug: string) => {
    navigate(
      `/facility/${facilityId}/settings/charge_item_definitions/categories/${slug}`,
    );
  };

  const onCreateItem = () => {
    navigate(
      `/facility/${facilityId}/settings/charge_item_definitions/categories/${categorySlug}/new`,
    );
  };

  return (
    <Page title={t("charge_item_definitions")} hideTitleOnPage>
      <ResourceCategoryList
        allowCategoryCreate={allowCategoryCreate}
        facilityId={facilityId}
        categorySlug={categorySlug}
        resourceType={ResourceCategoryResourceType.charge_item_definition}
        basePath={`/facility/${facilityId}/settings/charge_item_definitions`}
        baseTitle={t("charge_item_definitions")}
        onNavigate={onNavigate}
        onCreateItem={onCreateItem}
        createItemLabel={t("add_definition")}
        createItemIcon="l-plus"
        createItemTooltip={t(
          "charge_items_can_only_be_added_to_leaf_categories",
        )}
      >
        {categorySlug && (
          <ChargeItemList
            facilityId={facilityId}
            categorySlug={categorySlug}
            setAllowCategoryCreate={setAllowCategoryCreate}
          />
        )}
      </ResourceCategoryList>
    </Page>
  );
}
