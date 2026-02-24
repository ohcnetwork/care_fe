import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import TagBadge from "@/components/Tags/TagBadge";

import { ActionButtons } from "@/pages/Facility/settings/ActionButtons";

import useFilters from "@/hooks/useFilters";

import {
  ACTIVITY_DEFINITION_STATUS_COLORS,
  ActivityDefinitionReadSpec,
  Classification,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import query from "@/Utils/request/query";

// Activity definition card component for mobile view
function ActivityDefinitionCard({
  definition,
  facilityId,
}: {
  definition: ActivityDefinitionReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-wrap flex-col md:flex-row items-start justify-between gap-1">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <CareIcon icon="l-clipboard-alt" className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge
                  variant={ACTIVITY_DEFINITION_STATUS_COLORS[definition.status]}
                  className="text-xs"
                >
                  {t(definition.status)}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {t(definition.classification)}
                </Badge>
              </div>
              <h3 className="font-medium text-gray-900 truncate text-lg">
                {definition.title}
              </h3>
              {definition.description && (
                <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                  {definition.description}
                </p>
              )}
              <div className="mt-2 text-xs text-gray-400">
                {t("kind")}: {t(definition.kind)}
              </div>
              {definition.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {definition.tags.map((tag) => (
                    <TagBadge key={tag.id} tag={tag} className="text-xs" />
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <ActivityDefinitionActions
              definition={definition}
              facilityId={facilityId}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table row component for desktop view
function ActivityDefinitionTableRow({
  definition,
  facilityId,
}: {
  definition: ActivityDefinitionReadSpec;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell className="font-medium">
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded bg-gray-100 text-gray-600">
            <CareIcon icon="l-clipboard-alt" className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{definition.title}</div>
            {definition.description && (
              <div className="text-sm text-gray-500 truncate max-w-xs">
                {definition.description}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs">
          {t(definition.classification)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={ACTIVITY_DEFINITION_STATUS_COLORS[definition.status]}
          className="text-xs"
        >
          {t(definition.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {t(definition.kind)}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {definition.tags.length > 0 ? (
            definition.tags.map((tag) => (
              <TagBadge key={tag.id} tag={tag} className="text-xs" />
            ))
          ) : (
            <span className="text-gray-400">—</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <ActivityDefinitionActions
            definition={definition}
            facilityId={facilityId}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ActivityDefinitionListProps {
  facilityId: string;
  categorySlug: string;
  setAllowCategoryCreate: (allow: boolean) => void;
}

export function ActivityDefinitionList({
  facilityId,
  categorySlug,
  setAllowCategoryCreate,
}: ActivityDefinitionListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    defaultQueryParams: {
      status: "active",
    },
  });

  // Fetch activity definitions for current category
  const {
    data: activityDefinitionsResponse,
    isLoading: isLoadingActivityDefinitions,
  } = useQuery({
    queryKey: ["activityDefinitions", facilityId, categorySlug, qParams],
    queryFn: query.debounced(activityDefinitionApi.listActivityDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        title: qParams.search,
        status: qParams.status,
        classification: qParams.classification,
        category: categorySlug,
      },
    }),
  });

  const activityDefinitions = activityDefinitionsResponse?.results || [];

  useEffect(() => {
    if (!qParams.search && qParams.page === "1") {
      setAllowCategoryCreate(!activityDefinitionsResponse?.count);
    }
  }, [
    activityDefinitionsResponse?.count,
    setAllowCategoryCreate,
    qParams.search,
    qParams.page,
  ]);

  return (
    <div>
      {/* Header with filters and view toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative w-full sm:w-auto">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CareIcon icon="l-search" className="size-5" />
          </span>
          <Input
            placeholder={t("search_activity_definition")}
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({ search: e.target.value || undefined })
            }
            className="w-full sm:w-[300px] pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-auto">
          <FilterSelect
            value={qParams.status || ""}
            onValueChange={(value) => updateQuery({ status: value })}
            options={Object.values(Status)}
            label={t("status")}
            onClear={() => updateQuery({ status: undefined })}
          />
        </div>

        {/* classification Filter */}
        <div className="w-full sm:w-auto">
          <FilterSelect
            value={qParams.classification || ""}
            onValueChange={(value) => updateQuery({ classification: value })}
            options={Object.values(Classification)}
            label={t("category")}
            onClear={() => updateQuery({ classification: undefined })}
          />
        </div>
      </div>

      {/* Results count */}
      {activityDefinitionsResponse && activityDefinitionsResponse.count > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          {t("showing")} {activityDefinitions.length} {t("of")}{" "}
          {activityDefinitionsResponse.count} {t("activity_definitions")}
        </div>
      )}

      {/* Content */}
      {isLoadingActivityDefinitions ? (
        <TableSkeleton count={5} />
      ) : activityDefinitions.length === 0 ? (
        <EmptyState
          icon={
            <CareIcon icon="l-clipboard-alt" className="text-primary size-6" />
          }
          title={t("no_activity_definition_found")}
          description={t("no_activity_definitions_in_category")}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[25%]">{t("title")}</TableHead>
                    <TableHead className="w-[12%]">
                      {t("classification")}
                    </TableHead>
                    <TableHead className="w-[10%]">{t("status")}</TableHead>
                    <TableHead className="w-[10%]">{t("kind")}</TableHead>
                    <TableHead className="w-[20%]">{t("tags")}</TableHead>
                    <TableHead className="w-[5%]">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activityDefinitions.map((definition) => (
                    <ActivityDefinitionTableRow
                      key={definition.slug}
                      definition={definition}
                      facilityId={facilityId}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            <div className="grid gap-3">
              {activityDefinitions.map((definition) => (
                <ActivityDefinitionCard
                  key={definition.slug}
                  definition={definition}
                  facilityId={facilityId}
                />
              ))}
            </div>
          </div>

          {/* Pagination */}
          {activityDefinitionsResponse &&
            activityDefinitionsResponse.count > resultsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination totalCount={activityDefinitionsResponse.count} />
              </div>
            )}
        </>
      )}
    </div>
  );
}

function ActivityDefinitionActions({
  definition,
  facilityId,
}: {
  definition: ActivityDefinitionReadSpec;
  facilityId: string;
}) {
  return (
    <ActionButtons
      editPath={`/facility/${facilityId}/settings/activity_definitions/${definition.slug}/edit`}
      viewPath={`/facility/${facilityId}/settings/activity_definitions/${definition.slug}`}
    />
  );
}
