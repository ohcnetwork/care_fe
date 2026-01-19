import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";
import { ResourceCategoryList } from "@/components/Common/ResourceCategoryList";
import { ActivityDefinitionList as ActivityDefinitionListComponent } from "@/pages/Facility/settings/activityDefinition/ActivityDefinitionListComponent";
import { ResourceCategoryResourceType } from "@/types/base/resourceCategory/resourceCategory";
import { Status } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

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
        itemSearchConfig={{
          listItems: {
            queryFn: activityDefinitionApi.listActivityDefinition,
            queryParams: {
              status: Status.active,
            },
          },
          queryKeyPrefix: "activityDefinitionsSearch",
        }}
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
