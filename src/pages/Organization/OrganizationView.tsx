import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import Pagination from "@/components/Common/Pagination";

import query from "@/Utils/request/query";
import { Organization, getOrgLabel } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationView({ id, navOrganizationId }: Props) {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 12; // 3x4 grid

  const { data: children, isLoading } = useQuery({
    queryKey: ["organization", id, "children", page, limit, searchQuery],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: id,
        offset: (page - 1) * limit,
        limit,
        name: searchQuery || undefined,
      },
    }),
  });

  // Hack for the sidebar to work
  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}`
    : `/organization/${id}`;

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
      <div className="space-y-6">
        <div className="flex flex-col justify-between items-start gap-4">
          <h2 className="text-lg font-semibold">{t("organizations")}</h2>
          <div className="w-72">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1); // Reset to first page on search
              }}
              className="w-full"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children?.results?.length ? (
                children.results.map((orgChild: Organization) => (
                  <Card key={orgChild.id}>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
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
                              View Details
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
                    {searchQuery
                      ? t("no_organizations_found_matching", { searchQuery })
                      : t("no_sub_organizations_found")}
                  </CardContent>
                </Card>
              )}
            </div>
            {children && children.count > limit && (
              <div className="flex justify-center">
                <Pagination
                  data={{ totalCount: children.count }}
                  onChange={(page, _) => setPage(page)}
                  defaultPerPage={limit}
                  cPage={page}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </OrganizationLayout>
  );
}
