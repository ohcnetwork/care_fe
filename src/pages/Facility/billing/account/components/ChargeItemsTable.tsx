import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  ExternalLinkIcon,
  MoreHorizontal,
  PencilIcon,
} from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
  ChargeItemStatus,
  MRP_CODE,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import EditChargeItemSheet from "./EditChargeItemSheet";

interface PriceComponentRowProps {
  label: string;
  components: MonetaryComponent[];
}

function PriceComponentRow({ label, components }: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => {
        return (
          <TableRow key={`${label}-${index}`} className="text-xs text-gray-500">
            <TableCell></TableCell>
            <TableCell>
              {component.code && `${component.code.display} `}({label})
            </TableCell>
            <TableCell></TableCell>
            <TableCell>
              <MonetaryDisplay {...component} />
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

export interface ChargeItemsTableProps {
  facilityId: string;
  accountId: string;
}

export function ChargeItemsTable({
  facilityId,
  accountId,
}: ChargeItemsTableProps) {
  const { t } = useTranslation();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", qParams, accountId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: qParams.charge_item_status,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  }) as {
    data: { results: ChargeItemRead[]; count: number } | undefined;
    isLoading: boolean;
  };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getComponentsByType = (
    item: ChargeItemRead,
    type: MonetaryComponentType,
  ) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetary_component_type === type,
      ) || []
    );
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetary_component_type === MonetaryComponentType.base,
    );
  };

  return (
    <div>
      <div className="mb-4">
        {/* Desktop Tabs */}
        <Tabs
          value={qParams.charge_item_status ?? "all"}
          onValueChange={(value) =>
            updateQuery({
              charge_item_status: value === "all" ? undefined : value,
            })
          }
          className="max-sm:hidden"
        >
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            {Object.values(ChargeItemStatus).map((status) => (
              <TabsTrigger key={status} value={status}>
                {t(status)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {/* Mobile Select */}
        <Select
          value={qParams.charge_item_status ?? "all"}
          onValueChange={(value) =>
            updateQuery({
              charge_item_status: value === "all" ? undefined : value,
            })
          }
        >
          <SelectTrigger className="sm:hidden w-full">
            <SelectValue placeholder={t("filter_by_status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("all")}</SelectItem>
            {Object.values(ChargeItemStatus).map((status) => (
              <SelectItem key={status} value={status}>
                {t(status)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : (
        <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
          <Table className="rounded-lg border shadow-sm w-full bg-white">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b">
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[40px]"></TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("item")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("resource")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("mrp")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("unit_price")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("quantity")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("total")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[120px]">
                  {t("status")}
                </TableHead>
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-[60px]">
                  {t("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {!chargeItems?.results?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    {t("no_charge_items")}
                  </TableCell>
                </TableRow>
              ) : (
                chargeItems.results.flatMap((item) => {
                  const isExpanded = expandedItems[item.id] || false;
                  const baseComponent = getBaseComponent(item);
                  const baseAmount = String(baseComponent?.amount || "0");
                  const mrpAmount = item.unit_price_components.find(
                    (c) =>
                      c.monetary_component_type ===
                        MonetaryComponentType.informational &&
                      c.code?.code === MRP_CODE,
                  )?.amount;
                  const mainRow = (
                    <TableRow
                      key={item.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <TableCell className="border-x p-3 text-gray-950">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleItemExpand(item.id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950 font-medium">
                        {item.title}
                        {item.description && (
                          <p className="text-xs text-gray-500 whitespace-pre-wrap">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        {item.service_resource === "service_request" &&
                          item.service_resource_id && (
                            <Link
                              href={`/facility/${facilityId}/services_requests/${item.service_resource_id}`}
                              className="flex items-center gap-0.5 underline text-gray-600"
                            >
                              {t("service_request")}
                              <ExternalLinkIcon className="size-3" />
                            </Link>
                          )}
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        <MonetaryDisplay amount={mrpAmount} />
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        <MonetaryDisplay amount={baseAmount} />
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950 font-medium">
                        <MonetaryDisplay amount={item.total_price} />
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={CHARGE_ITEM_STATUS_COLORS[item.status]}
                          >
                            {t(item.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="border-x p-3 text-gray-950">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t("actions")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <div
                                className="flex items-center"
                                onClick={() => {
                                  // This will trigger the item to be edited, but actual edit UI is rendered elsewhere
                                  document
                                    .getElementById(
                                      `edit-charge-item-${item.id}`,
                                    )
                                    ?.click();
                                }}
                              >
                                <PencilIcon className="mr-2 h-4 w-4" />
                                <span>{t("edit")}</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Invisible trigger for the edit sheet */}
                        <span className="hidden">
                          <EditChargeItemSheet
                            facilityId={facilityId}
                            item={item}
                            trigger={
                              <Button
                                id={`edit-charge-item-${item.id}`}
                                className="hidden"
                              >
                                Edit
                              </Button>
                            }
                          />
                        </span>
                      </TableCell>
                    </TableRow>
                  );

                  if (!isExpanded) return [mainRow];

                  const detailRows = [
                    <PriceComponentRow
                      key={`${item.id}-discounts`}
                      label={t("discounts")}
                      components={getComponentsByType(
                        item,
                        MonetaryComponentType.discount,
                      )}
                    />,
                    <PriceComponentRow
                      key={`${item.id}-taxes`}
                      label={t("taxes")}
                      components={getComponentsByType(
                        item,
                        MonetaryComponentType.tax,
                      )}
                    />,
                  ];

                  // Add a summary row
                  const summaryRow = (
                    <TableRow
                      key={`${item.id}-summary`}
                      className="bg-muted/30 font-medium border-b"
                    >
                      <TableCell></TableCell>
                      <TableCell className="text-gray-950">
                        {t("total")}
                      </TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell className="p-3">
                        <MonetaryDisplay amount={item.total_price} />
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  );

                  const emptyRow = (
                    <TableRow key={`${item.id}-empty`} className="bg-muted">
                      <TableCell colSpan={7}></TableCell>
                    </TableRow>
                  );

                  return [mainRow, ...detailRows, summaryRow, emptyRow].filter(
                    Boolean,
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination totalCount={chargeItems?.count || 0} />
    </div>
  );
}

export default ChargeItemsTable;
