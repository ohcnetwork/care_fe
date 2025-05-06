import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  PencilIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonetaryValue } from "@/components/ui/monetary-value";
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
  MonetoryComponent,
  MonetoryComponentType,
} from "@/types/base/monetoryComponent/monetoryComponent";
import {
  ChargeItemRead,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import EditChargeItemPopover from "./EditChargeItemPopover";

function formatCurrency(
  amount: number | undefined | null,
  currency: string = "INR",
) {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatPercentage(factor: number | undefined | null) {
  if (factor === undefined || factor === null) return "-";
  return new Intl.NumberFormat("en-IN", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(factor);
}

function getStatusVariant(status: string) {
  switch (status) {
    case "billed":
      return "default";
    case "planned":
      return "outline";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

interface PriceComponentRowProps {
  label: string;
  components: MonetoryComponent[];
  baseAmount: number;
  quantity: number;
}

function PriceComponentRow({
  label,
  components,
  baseAmount,
  quantity,
}: PriceComponentRowProps) {
  if (!components.length) return null;

  return (
    <>
      {components.map((component, index) => {
        const value =
          component.amount !== undefined && component.amount !== null
            ? component.amount * quantity
            : (component.factor || 0) * baseAmount * quantity;

        return (
          <TableRow
            key={`${label}-${index}`}
            className="text-xs text-muted-foreground"
          >
            <TableCell></TableCell>
            <TableCell>
              {component.code && `${component.code.display} `}({label})
            </TableCell>
            <TableCell>
              {component.amount !== undefined && component.amount !== null ? (
                <MonetaryValue value={component.amount} />
              ) : (
                formatPercentage(component.factor)
              )}
            </TableCell>
            <TableCell></TableCell>
            <TableCell>
              {component.monetory_component_type ===
                MonetoryComponentType.discount && `-`}
              <MonetaryValue value={value} />
            </TableCell>
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
  const { qParams, updateQuery } = useFilters({
    limit: 15,
    disableCache: true,
  });

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["chargeItems", qParams, accountId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: qParams.charge_item_status ?? ChargeItemStatus.planned,
      },
    }),
  }) as { data: { results: ChargeItemRead[] } | undefined; isLoading: boolean };

  const toggleItemExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const getComponentsByType = (
    item: ChargeItemRead,
    type: MonetoryComponentType,
  ) => {
    return (
      item.unit_price_components?.filter(
        (c) => c.monetory_component_type === type,
      ) || []
    );
  };

  const getBaseComponent = (item: ChargeItemRead) => {
    return item.unit_price_components?.find(
      (c) => c.monetory_component_type === MonetoryComponentType.base,
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("charge_items")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t("billable_items_for_account")}
          </p>
        </div>
      </CardHeader>
      <Tabs
        value={qParams.charge_item_status ?? ChargeItemStatus.planned}
        onValueChange={(value) => updateQuery({ charge_item_status: value })}
        className="mx-4 mb-4"
      >
        <TabsList>
          {Object.values(ChargeItemStatus).map((status) => (
            <TabsTrigger key={status} value={status}>
              {t(status)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <CardContent>
        {isLoading ? (
          <TableSkeleton count={3} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("unit_price")}</TableHead>
                <TableHead>{t("quantity")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead className="w-[120px]">{t("status")}</TableHead>
                <TableHead className="w-[60px]">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!chargeItems?.results?.length ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-muted-foreground"
                  >
                    {t("no_charge_items")}
                  </TableCell>
                </TableRow>
              ) : (
                chargeItems.results.flatMap((item) => {
                  const isExpanded = expandedItems[item.id] || false;
                  const baseComponent = getBaseComponent(item);
                  const baseAmount = baseComponent?.amount || 0;

                  const mainRow = (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
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
                      <TableCell className="font-medium">
                        {item.title}
                        {item.description && (
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(baseAmount)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(item.total_price)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant={getStatusVariant(item.status)}>
                            {t(item.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
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
                          <EditChargeItemPopover
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
                        MonetoryComponentType.discount,
                      )}
                      baseAmount={baseAmount}
                      quantity={item.quantity}
                    />,
                    <PriceComponentRow
                      key={`${item.id}-taxes`}
                      label={t("taxes")}
                      components={getComponentsByType(
                        item,
                        MonetoryComponentType.tax,
                      )}
                      baseAmount={baseAmount}
                      quantity={item.quantity}
                    />,
                  ];

                  // Add a summary row
                  const summaryRow = (
                    <TableRow
                      key={`${item.id}-summary`}
                      className="bg-muted/30 font-medium"
                    >
                      <TableCell></TableCell>
                      <TableCell>{t("total")}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell>{formatCurrency(item.total_price)}</TableCell>
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  );

                  return [mainRow, ...detailRows, summaryRow].filter(Boolean);
                })
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

export default ChargeItemsTable;
