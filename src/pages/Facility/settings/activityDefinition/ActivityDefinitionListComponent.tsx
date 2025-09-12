import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

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
        <div className="flex items-start justify-between">
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
              <h3 className="font-medium text-gray-900 truncate">
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
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/activity_definitions/${definition.slug}`,
                )
              }
            >
              <CareIcon icon="l-edit" className="h-4 w-4" />
              {t("see_details")}
            </Button>
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
    <TableRow className="hover:bg-gray-50 cursor-pointer">
      <TableCell
        className="font-medium cursor-pointer"
        onClick={() =>
          navigate(
            `/facility/${facilityId}/settings/activity_definitions/${definition.slug}`,
          )
        }
      >
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
      <TableCell className="text-sm text-gray-500">
        {/* TODO: Add resource category title when it's available & Fix the same for product knowledge */}
        {/* {definition.category.title} */}
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/settings/activity_definitions/${definition.slug}`,
                    )
                  }
                >
                  <CareIcon icon="l-edit" className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("edit_activity_definition")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
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
  });

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // TODO: Remove this once we have a default status (robo's PR)
  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: "active" });
    }
  }, [qParams.status, updateQuery]);

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
        ordering: "-created_date",
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
    <TooltipProvider>
      <div>
        {/* Header with filters and view toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CareIcon icon="l-search" className="size-5" />
              </span>
              <Input
                placeholder={t("search_activity_definitions")}
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
                value={qParams.category || ""}
                onValueChange={(value) => updateQuery({ category: value })}
                options={Object.values(Classification)}
                label={t("category")}
                onClear={() => updateQuery({ category: undefined })}
              />
            </div>
          </div>

          {/* View Toggle - Desktop only */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-sm text-gray-500">{t("view")}:</span>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-r-none"
              >
                <CareIcon icon="l-table" className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="rounded-l-none"
              >
                <CareIcon icon="l-th-large" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        {activityDefinitionsResponse &&
          activityDefinitionsResponse.count > 0 && (
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
            icon="l-clipboard-alt"
            title={t("no_activity_definitions_found")}
            description={t("no_activity_definitions_in_category")}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            {viewMode === "table" && (
              <div className="hidden lg:block">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[30%]">{t("title")}</TableHead>
                        <TableHead className="w-[15%]">
                          {t("classification")}
                        </TableHead>
                        <TableHead className="w-[15%]">{t("status")}</TableHead>
                        <TableHead className="w-[15%]">{t("kind")}</TableHead>
                        <TableHead className="w-[15%]">
                          {t("category")}
                        </TableHead>
                        <TableHead className="w-[10%] text-right">
                          {t("actions")}
                        </TableHead>
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
            )}

            {/* Mobile Card View */}
            <div className={`${viewMode === "cards" ? "block" : "lg:hidden"}`}>
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
    </TooltipProvider>
  );
}
