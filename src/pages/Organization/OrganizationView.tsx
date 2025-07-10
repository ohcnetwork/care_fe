import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { Organization, getOrgLabel } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import EntityBadge from "./components/EntityBadge";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationView({ id, navOrganizationId }: Props) {
  const { t } = useTranslation();

  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: children, isFetching } = useQuery({
    queryKey: ["organization", id, "children", qParams],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: id,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.name || undefined,
      },
    }),
  });

  // Hack for the sidebar to work
  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}`
    : `/organization/${id}`;

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
      {() => {
        return (
          <div className="space-y-6">
            <div className="flex flex-col justify-between items-start gap-4">
              <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
                <EntityBadge
                  title={t("organizations")}
                  count={children?.count}
                  isFetching={isFetching}
                  translationParams={{ entity: "Organization" }}
                />
              </div>
              <div className="w-72">
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
                  className="w-full border-none shadow-none"
                />
              </div>
            </div>

            {isFetching ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <CardGridSkeleton count={6} />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {children?.results?.length ? (
                    children.results.map((orgChild: Organization) => (
                      <Card key={orgChild.id} className="flex flex-col h-full">
                        <CardContent className="p-6 grow">
                          <div className="space-y-4 grow">
                            <div className="space-y-1 mb-2">
                              <h3 className="text-lg font-semibold">
                                {orgChild.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  {orgChild.org_type}
                                </Badge>
                                {orgChild.metadata?.govt_org_type && (
                                  <Badge variant="outline">
                                    {getOrgLabel(
                                      orgChild.org_type,
                                      orgChild.metadata,
                                    )}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            {orgChild.description && (
                              <p className="text-sm text-gray-500 line-clamp-2">
                                {orgChild.description}
                              </p>
                            )}
                          </div>
                        </CardContent>
                        <div className="p-4 pt-0 mt-auto text-end">
                          <Button variant="link" asChild>
                            <Link href={`${baseUrl}/children/${orgChild.id}`}>
                              {t("view_details")}
                              <CareIcon
                                icon="l-arrow-right"
                                className="size-4"
                              />
                            </Link>
                          </Button>
                        </div>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-full">
                      <CardContent className="p-6 text-center text-gray-500">
                        {qParams.name
                          ? t("no_organizations_found")
                          : t("no_sub_organizations_found")}
                      </CardContent>
                    </Card>
                  )}
                </div>
                {children && children.count > resultsPerPage && (
                  <div className="flex justify-center">
                    <Pagination totalCount={children?.count || 0} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
