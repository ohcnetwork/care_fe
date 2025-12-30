import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Card, CardContent } from "@/components/ui/card";

import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { useCareApps } from "@/hooks/useCareApps";

import EntityBadge from "./components/EntityBadge";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationAnalyticsPlug({
  id,
  navOrganizationId,
}: Props) {
  const { t } = useTranslation();
  const careApps = useCareApps();

  const { qParams, Pagination, updateQuery } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const resultsPerPage = 15;

  const analytics = careApps.flatMap((c) =>
    !c.isLoading &&
    c.organizationNavItems &&
    c.organizationNavItems(id, qParams, resultsPerPage)
      ? c.organizationNavItems(id, qParams, resultsPerPage)
      : [],
  );

  const isFetching = careApps.some((c) => c.isLoading);

  const handleView = (analyticsId: string) => {
    const baseUrl = navOrganizationId
      ? `/organization/${navOrganizationId}/children/${id}`
      : `/organization/${id}`;
    navigate(`${baseUrl}/analytics/${analyticsId}`);
  };

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
      {() => {
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap">
              <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
                <EntityBadge
                  title={t("analytics")}
                  count={analytics.length}
                  isFetching={isFetching}
                  customTranslation="analytics_count"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <SearchInput
                options={[
                  {
                    key: "name",
                    type: "text",
                    placeholder: t("search_by_name"),
                    value: qParams.name || "",
                    display: t("name"),
                  },
                ]}
                onSearch={(key, value) =>
                  updateQuery({
                    [key]: value || undefined,
                  })
                }
                className="w-full max-w-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isFetching ? (
                <CardGridSkeleton count={6} />
              ) : analytics.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_analytics_found")}
                  </CardContent>
                </Card>
              ) : (
                analytics.map((item: Record<string, unknown>) => (
                  <Card
                    key={item.id as string}
                    className="overflow-hidden bg-white rounded-lg transition-all hover:shadow-lg cursor-pointer hover:scale-[1.02]"
                    onClick={() => handleView(item.id as string)}
                  >
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {(item.name as string) || "Untitled"}
                      </h3>

                      {item.description ? (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {item.description as string}
                        </p>
                      ) : null}

                      <div className="mt-2 flex items-center text-sm text-primary">
                        <span>{t("view_dashboard")}</span>
                        <CareIcon
                          icon="l-arrow-right"
                          className="size-4 ml-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
            <Pagination totalCount={analytics.length} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
