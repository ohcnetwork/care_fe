import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { SCHEDULABLE_RESOURCE_TYPE_COLORS } from "@/types/scheduling/schedule";
import { TokenCategoryRead } from "@/types/tokens/tokenCategory/tokenCategory";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

function TokenCategoryCard({
  tokenCategory,
  facilityId,
}: {
  tokenCategory: TokenCategoryRead;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={
                  SCHEDULABLE_RESOURCE_TYPE_COLORS[tokenCategory.resource_type]
                }
              >
                {t(tokenCategory.resource_type)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">
              {t("name")}: {tokenCategory.name}
            </h3>
            {tokenCategory.shorthand && (
              <p className="mt-1 text-sm text-gray-500">
                {t("shorthand")}: {tokenCategory.shorthand}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate(
                `/facility/${facilityId}/settings/token_category/${tokenCategory.id}`,
              )
            }
          >
            <CareIcon icon="l-edit" className="size-4" />
            {t("see_details")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TokenCategoryList({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // TODO: Remove this once we have a default status (robo's PR)
  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: "active" });
    }
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["tokenCategories", qParams],
    queryFn: query.debounced(tokenCategoryApi.list, {
      pathParams: {
        facility_id: facilityId,
      },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        name: qParams.search,
        ordering: "-created_date",
      },
    }),
  });

  const tokenCategories = response?.results || [];

  return (
    <Page title={t("token_categories")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("token_categories")}
          </h1>
          <div className="mb-6 flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_token_categories")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(`/facility/${facilityId}/settings/token_category/new`)
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_token_category")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_token_categories")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            {/* <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(SchedulableResourceType)}
                  label="status"
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div> */}
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : tokenCategories.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_products_found")}
            description={t("adjust_product_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {tokenCategories.map((tokenCategory: TokenCategoryRead) => (
                <TokenCategoryCard
                  key={tokenCategory.id}
                  tokenCategory={tokenCategory}
                  facilityId={facilityId}
                />
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("resource_type")}</TableHead>
                      <TableHead>{t("shorthand")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {tokenCategories.map((tokenCategory: TokenCategoryRead) => (
                      <TableRow key={tokenCategory.id} className="divide-x">
                        <TableCell className="font-medium">
                          {tokenCategory.name}
                          {tokenCategory.default && (
                            <Badge className="ml-2">{t("default")}</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              SCHEDULABLE_RESOURCE_TYPE_COLORS[
                                tokenCategory.resource_type
                              ]
                            }
                          >
                            {t(tokenCategory.resource_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>{tokenCategory.shorthand || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/facility/${facilityId}/settings/token_category/${tokenCategory.id}`,
                              )
                            }
                          >
                            <CareIcon icon="l-edit" className="size-4" />
                            {t("see_details")}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}
