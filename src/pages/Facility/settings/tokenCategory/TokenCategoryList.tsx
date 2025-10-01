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
import { NavTabs } from "@/components/ui/nav-tabs";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
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
                `/facility/${facilityId}/settings/token_category/${tokenCategory.resource_type}/${tokenCategory.id}`,
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
  resourceType,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
}) {
  const { t } = useTranslation();

  return (
    <Page title={t("token_categories")} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl">
        <div className="">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("token_categories")}
          </h1>
          <div className="mb-6 flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_token_categories")}
              </p>
            </div>
          </div>
        </div>
        <NavTabs
          tabContentClassName="mt-2"
          tabs={{
            ...Object.fromEntries(
              Object.values(SchedulableResourceType).map((resourceType) => [
                resourceType,
                {
                  label: t(resourceType),
                  component: (
                    <TokenCategoryListContent
                      facilityId={facilityId}
                      resourceType={resourceType}
                    />
                  ),
                },
              ]),
            ),
          }}
          currentTab={resourceType as string}
          onTabChange={navigate}
          setPageTitle={false}
        />
      </div>
    </Page>
  );
}

const TokenCategoryListContent = ({
  facilityId,
  resourceType,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
}) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["tokenCategories", facilityId, resourceType, qParams],
    queryFn: query.debounced(tokenCategoryApi.list, {
      pathParams: {
        facility_id: facilityId,
      },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        resource_type: resourceType,
        status: "active",
        name: qParams.search,
      },
    }),
  });

  const tokenCategories = response?.results || [];

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
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
        <Button
          onClick={() =>
            navigate(
              `/facility/${facilityId}/settings/token_category/${resourceType}/new`,
            )
          }
        >
          <CareIcon icon="l-plus" className="mr-2" />
          {t("add_token_category")}
        </Button>
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
          title={t("no_token_categories_found")}
          description={t("no_token_categories_found_description")}
        />
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="grid gap-4 md:hidden">
            {tokenCategories.map((tokenCategory) => (
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
                    <TableHead>{t("shorthand")}</TableHead>
                    <TableHead>{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white">
                  {tokenCategories.map((tokenCategory) => (
                    <TableRow key={tokenCategory.id} className="divide-x">
                      <TableCell className="font-medium">
                        {tokenCategory.name}
                        {tokenCategory.default && (
                          <Badge className="ml-2">{t("default")}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{tokenCategory.shorthand || "-"}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/settings/token_category/${tokenCategory.resource_type}/${tokenCategory.id}`,
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
  );
};
