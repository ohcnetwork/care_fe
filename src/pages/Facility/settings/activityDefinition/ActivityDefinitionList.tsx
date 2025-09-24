import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { ResourceCategoryList } from "@/components/Common/ResourceCategoryList";
import { ActivityDefinitionList as ActivityDefinitionListComponent } from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionListComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { useState } from "react";

interface ActivityDefinitionListProps {
  facilityId: string;
  categorySlug?: string;
}

export default function ActivityDefinitionList({
  facilityId,
  categorySlug,
}: ActivityDefinitionListProps) {
  const { t } = useTranslation();
  const [allowCategoryCreate, setAllowCategoryCreate] = useState(false);

  const onNavigate = (slug: string) => {
    navigate(
      `/facility/${facilityId}/settings/activity_definitions/categories/${slug}`,
    );
  };

  const onCreateItem = () => {
    navigate(
      `/facility/${facilityId}/settings/activity_definitions/categories/${categorySlug}/new`,
    );
  };

  return (
    <Page title={t("activity_definitions")} hideTitleOnPage>
      <ResourceCategoryList
        allowCategoryCreate={allowCategoryCreate}
        facilityId={facilityId}
        categorySlug={categorySlug}
        resourceType={ResourceCategoryResourceType.activity_definition}
        basePath={`/facility/${facilityId}/settings/activity_definitions`}
        baseTitle={t("activity_definition")}
        onNavigate={onNavigate}
        onCreateItem={onCreateItem}
        createItemLabel={t("add_activity_definition")}
        createItemIcon="l-plus"
        createItemTooltip={t(
          "activity_definitions_can_only_be_added_to_leaf_categories",
        )}
      >
        {categorySlug && (
          <ActivityDefinitionListComponent
            facilityId={facilityId}
            categorySlug={categorySlug}
            setAllowCategoryCreate={setAllowCategoryCreate}
          />
        )}
      </ResourceCategoryList>
    </Page>
  );
}
