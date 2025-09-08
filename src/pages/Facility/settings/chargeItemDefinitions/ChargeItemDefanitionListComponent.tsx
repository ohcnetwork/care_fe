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
  CHARGE_ITEM_DEFINITION_STATUS_COLORS,
  ChargeItemDefinitionRead,
  ChargeItemDefinitionStatus,
} from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import query from "@/Utils/request/query";

// Charge item card component for mobile view
function ChargeItemCard({
  definition,
  facilityId,
}: {
  definition: ChargeItemDefinitionRead;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge
                  variant={
                    CHARGE_ITEM_DEFINITION_STATUS_COLORS[definition.status]
                  }
                  className="text-xs"
                >
                  {t(definition.status)}
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
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/charge_item_definitions/${definition.slug}`,
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
function ChargeItemTableRow({
  definition,
  facilityId,
}: {
  definition: ChargeItemDefinitionRead;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <TableRow className="hover:bg-gray-50 cursor-pointer">
      <TableCell
        className="font-medium cursor-pointer"
        onClick={() =>
          navigate(
            `/facility/${facilityId}/settings/charge_item_definitions/${definition.slug}`,
          )
        }
      >
        <div className="flex items-center space-x-3">
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
        <Badge
          variant={CHARGE_ITEM_DEFINITION_STATUS_COLORS[definition.status]}
          className="text-xs"
        >
          {t(definition.status)}
        </Badge>
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {definition.category.title}
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {definition.price_components.length > 0
          ? `${definition.price_components.length} ${t("price_components")}`
          : t("no_price_components")}
      </TableCell>
      <TableCell>
        <div className="flex items-center justify-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() =>
                    navigate(
                      `/facility/${facilityId}/settings/charge_item_definitions/${definition.slug}`,
                    )
                  }
                >
                  <CareIcon icon="l-edit" className="h-4 w-4" />
                  {t("edit")}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("edit_charge_item")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ChargeItemListProps {
  facilityId: string;
  categorySlug: string;
}

export function ChargeItemList({
  facilityId,
  categorySlug,
}: ChargeItemListProps) {
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

  // Fetch charge items for current category
  const { data: chargeItemsResponse, isLoading: isLoadingChargeItems } =
    useQuery({
      queryKey: ["chargeItemDefinitions", facilityId, categorySlug, qParams],
      queryFn: query.debounced(
        chargeItemDefinitionApi.listChargeItemDefinition,
        {
          pathParams: { facilityId },
          queryParams: {
            title: qParams.search,
            status: qParams.status,
            category: categorySlug,
            limit: resultsPerPage,
            offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
            ordering: "-created_date",
          },
        },
      ),
    });

  const chargeItems = chargeItemsResponse?.results || [];

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
                placeholder={t("search_definitions")}
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
                options={Object.values(ChargeItemDefinitionStatus)}
                label={t("status")}
                onClear={() => updateQuery({ status: undefined })}
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
        {chargeItemsResponse && chargeItemsResponse.count > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {t("showing")} {chargeItems.length} {t("of")}{" "}
            {chargeItemsResponse.count} {t("charge_items")}
          </div>
        )}

        {/* Content */}
        {isLoadingChargeItems ? (
          <TableSkeleton count={5} />
        ) : chargeItems.length === 0 ? (
          <EmptyState
            icon="l-file"
            title={t("no_charge_items_found")}
            description={t("no_charge_items_in_category")}
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
                        <TableHead className="w-[35%]">{t("title")}</TableHead>
                        <TableHead className="w-[15%]">{t("status")}</TableHead>
                        <TableHead className="w-[20%]">
                          {t("category")}
                        </TableHead>
                        <TableHead className="w-[15%]">
                          {t("price_components")}
                        </TableHead>
                        <TableHead className="w-[15%] text-center">
                          {t("actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {chargeItems.map((definition) => (
                        <ChargeItemTableRow
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
                {chargeItems.map((definition) => (
                  <ChargeItemCard
                    key={definition.slug}
                    definition={definition}
                    facilityId={facilityId}
                  />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {chargeItemsResponse &&
              chargeItemsResponse.count > resultsPerPage && (
                <div className="mt-6 flex justify-center">
                  <Pagination totalCount={chargeItemsResponse.count} />
                </div>
              )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
