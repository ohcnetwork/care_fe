import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
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
    limit: 12, // 3x4 grid
    cacheBlacklist: ["name"],
  });

  const searchOptions = [
    {
      key: "name",
      type: "text" as const,
      placeholder: "Search by name",
      value: qParams.name || "",
    },
  ];

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const searchParams = {
        name: key === "name" ? value : "",
      };
      updateQuery(searchParams);
    },
    [updateQuery],
  );

  const handleFieldChange = useCallback(() => {
    updateQuery({
      name: undefined,
    });
  }, [updateQuery]);

  const { data: children, isFetching } = useQuery({
    queryKey: [
      "organization",
      id,
      "children",
      qParams.page,
      resultsPerPage,
      qParams.name,
    ],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: id,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        name: qParams.name || undefined,
      },
    }),
    enabled: !!id,
  });

  // Hack for the sidebar to work
  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}`
    : `/organization/${id}`;

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
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
            <SearchByMultipleFields
              id="organization-search"
              key={id}
              options={searchOptions}
              initialOptionIndex={0}
              onSearch={handleSearch}
              onFieldChange={handleFieldChange}
              className="w-full"
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
                  <Card key={orgChild.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap">
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
                          <Button variant="link" asChild>
                            <Link href={`${baseUrl}/children/${orgChild.id}`}>
                              {t("view_details")}
                              <CareIcon
                                icon="l-arrow-right"
                                className="h-4 w-4"
                              />
                            </Link>
                          </Button>
                        </div>
                        {orgChild.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {orgChild.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
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
            {children && children.count > 0 && (
              <div className="flex justify-center">
                <Pagination totalCount={children.count || 0} />
              </div>
            )}
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
}
