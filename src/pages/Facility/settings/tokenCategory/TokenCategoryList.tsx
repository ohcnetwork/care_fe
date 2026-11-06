import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";

import { ActionButtons } from "@/pages/Facility/settings/ActionButtons";
import { TokenCategoryFormContent } from "@/pages/Facility/settings/tokenCategory/TokenCategoryForm";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { getPermissions } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  SCHEDULABLE_RESOURCE_TYPE_COLORS,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import tokenCategoryApi from "@/types/tokens/tokenCategory/tokenCategoryApi";

export default function TokenCategoryList({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery } = useFilters({ limit: 0, disableCache: true });
  const { facility } = useCurrentFacility();
  const { hasPermission } = usePermissions();
  const { canWriteTokenCategory } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );

  return (
    <Page title={t("token_categories")} hideTitleOnPage>
      <div className="container mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("token_categories")}
          </h1>
          <p className="text-gray-600 text-sm">
            {t("manage_token_categories")}
          </p>
        </div>

        <div className="relative mb-6 w-full md:w-75">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CareIcon icon="l-search" className="size-5" />
          </span>
          <Input
            placeholder={t("search_token_categories")}
            aria-label={t("search_token_categories")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full pl-10"
          />
        </div>

        <div className="space-y-8">
          {Object.values(SchedulableResourceType).map((resourceType) => (
            <TokenCategoryGroup
              key={resourceType}
              facilityId={facilityId}
              resourceType={resourceType}
              search={qParams.search}
              canWrite={canWriteTokenCategory}
            />
          ))}
        </div>
      </div>
    </Page>
  );
}

function TokenCategoryGroup({
  facilityId,
  resourceType,
  search,
  canWrite,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
  search?: string;
  canWrite: boolean;
}) {
  const { t } = useTranslation();
  const headingId = `token-category-group-${resourceType}`;

  // Each resource type usually has only a handful of categories, so fetch them
  // all and filter locally instead of paginating every group separately.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["tokenCategories", facilityId, { resource_type: resourceType }],
    queryFn: query.paginated(tokenCategoryApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { resource_type: resourceType },
    }),
  });

  const allCategories = data?.results ?? [];
  const searchText = search?.trim().toLowerCase();
  const tokenCategories = searchText
    ? allCategories.filter(
        (category) =>
          category.name.toLowerCase().includes(searchText) ||
          category.shorthand.toLowerCase().includes(searchText),
      )
    : allCategories;

  return (
    <section aria-labelledby={headingId} data-cy={headingId}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h2 id={headingId} className="text-lg font-semibold text-gray-900">
          {t(resourceType)}
        </h2>
        {!isLoading && !isError && (
          <Badge variant={SCHEDULABLE_RESOURCE_TYPE_COLORS[resourceType]}>
            {allCategories.length}
          </Badge>
        )}
        <p className="w-full text-sm text-gray-500">
          {t(`token_category_group_description__${resourceType}`)}
        </p>
      </div>

      {isError ? (
        <div className="rounded-lg border border-dashed bg-white px-4 py-6 text-center text-sm text-gray-500">
          {t("failed_to_load_categories")}
        </div>
      ) : (
        <div className="rounded-lg border bg-white">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>{t("name")}</TableHead>
                <TableHead className="w-32">{t("shorthand")}</TableHead>
                <TableHead className="w-48">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-5 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-36" />
                    </TableCell>
                  </TableRow>
                ))
              ) : tokenCategories.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-6 text-center text-sm text-gray-500"
                  >
                    {searchText
                      ? t("no_token_categories_found")
                      : t("no_token_categories_for_resource_type", {
                          resource_type: t(resourceType),
                        })}
                  </TableCell>
                </TableRow>
              ) : (
                tokenCategories.map((tokenCategory) => (
                  <TableRow key={tokenCategory.id}>
                    <TableCell className="font-medium">
                      {tokenCategory.name}
                      {tokenCategory.default && (
                        <Badge variant="primary" className="ml-2">
                          {t("default")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="font-mono">
                      {tokenCategory.shorthand || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <ActionButtons
                          viewPath={`/facility/${facilityId}/settings/token_category/${tokenCategory.id}`}
                          editPath={
                            canWrite
                              ? `/facility/${facilityId}/settings/token_category/${tokenCategory.id}/edit`
                              : undefined
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
              {canWrite && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={3} className="p-0">
                    <AddTokenCategoryPopover
                      facilityId={facilityId}
                      resourceType={resourceType}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}

function AddTokenCategoryPopover({
  facilityId,
  resourceType,
}: {
  facilityId: string;
  resourceType: SchedulableResourceType;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const title = t("add_token_category_for_resource_type", {
    resource_type: t(resourceType),
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-medium text-primary-700 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-primary-500"
        >
          <CareIcon icon="l-plus" className="size-4" />
          {title}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[min(24rem,calc(100vw-2rem))] p-4"
        aria-label={title}
      >
        <h3 className="mb-4 text-base font-semibold text-gray-900">{title}</h3>
        <TokenCategoryFormContent
          facilityId={facilityId}
          resourceType={resourceType}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
