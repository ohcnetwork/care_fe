import { useQuery } from "@tanstack/react-query";
import { ArrowUpRightSquare, X } from "lucide-react";
import { Check, ChevronsUpDown } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { ProductKnowledgeStatus } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SupplyDeliveryRead,
  SupplyDeliveryStatus,
  getSupplyDeliveryStatusBadgeColor,
} from "@/types/inventory/supplyDelivery/supplyDelivery";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";

interface Props {
  facilityId: string;
  locationId: string;
  defaultStatus: SupplyDeliveryStatus;
  mode?: "dispatch" | "receive";
}

export default function SupplyDeliveryTable({
  facilityId,
  locationId,
  defaultStatus,
  mode = "dispatch",
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  // Use defaultStatus when status is not set or is invalid
  const effectiveStatus =
    qParams.status && qParams.status !== "undefined"
      ? qParams.status
      : defaultStatus;

  const { data: productKnowledgeResponse } = useQuery({
    queryKey: ["productKnowledge", facilityId],
    queryFn: query(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        status: ProductKnowledgeStatus.active,
      },
    }),
  });

  const { data: response, isLoading } = useQuery({
    queryKey: [
      "supplyDeliveries",
      facilityId,
      locationId,
      qParams,
      effectiveStatus,
    ],
    queryFn: query.debounced(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        ...(mode === "dispatch"
          ? { origin: locationId }
          : { destination: locationId }),
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        supplied_item_product_knowledge: qParams.item,
      },
    }),
  });

  const deliveries = response?.results || [];
  const productKnowledges = productKnowledgeResponse?.results || [];

  const selectedProduct = productKnowledges.find((p) => p.id === qParams.item);

  const handleSeeDetails = (deliveryId: string) => {
    if (mode === "receive") {
      navigate(
        `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_receive/${deliveryId}`,
      );
    } else {
      // Handle dispatch mode navigation if needed
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between border-gray-300"
            >
              <span className="truncate">
                {selectedProduct ? selectedProduct.name : t("search_by_item")}
              </span>
              {selectedProduct ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuery({ item: undefined });
                  }}
                >
                  <X className="size-3" />
                  <span className="sr-only">{t("clear")}</span>
                </Button>
              ) : (
                <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
            <Command>
              <CommandInput
                className="border-none focus-visible:ring-0"
                placeholder={t("search_product_knowledge")}
              />
              <CommandEmpty>{t("no_product_knowledge_found")}</CommandEmpty>
              <CommandGroup>
                {productKnowledges.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.name}
                    onSelect={() => {
                      updateQuery({ item: product.id });
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        qParams.item === product.id
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {product.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !deliveries.length ? (
        <EmptyState
          icon="l-box"
          title={t("no_deliveries_found")}
          description={t("no_deliveries_found_description")}
        />
      ) : (
        <div className="overflow-hidden rounded-md border-2 border-white shadow-md">
          <Table className="rounded-md">
            <TableHeader className="bg-gray-100 text-gray-700">
              <TableRow className="divide-x">
                <TableHead className="text-gray-700">{t("item")}</TableHead>
                <TableHead className="text-gray-700">
                  {t("qty_requested")}
                </TableHead>
                <TableHead className="text-gray-700">
                  {mode === "dispatch" ? t("deliver_to") : t("deliver_from")}
                </TableHead>
                <TableHead className="text-gray-700">
                  {t("condition")}
                </TableHead>
                <TableHead className="text-gray-700">{t("status")}</TableHead>
                <TableHead className="text-gray-700">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {deliveries.map((delivery: SupplyDeliveryRead) => (
                <TableRow
                  key={delivery.id}
                  className="hover:bg-gray-50 divide-x"
                >
                  <TableCell className="font-semibold text-gray-950">
                    {delivery.supplied_item?.product_knowledge.name ||
                      delivery.supplied_inventory_item?.product
                        .product_knowledge.name}
                  </TableCell>
                  <TableCell className="font-medium text-gray-950 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="font-medium min-w-8 text-right">
                        {delivery.supplied_item_quantity}
                      </span>
                      <span className="font-medium min-w-8 text-right">
                        {delivery.supplied_item?.product_knowledge.definitional
                          ?.dosage_form.display || t("units")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-950">
                    {mode === "dispatch"
                      ? delivery.destination.name
                      : delivery.origin?.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    {delivery.supplied_item_condition && (
                      <Badge
                        variant={
                          delivery.supplied_item_condition === "damaged"
                            ? "destructive"
                            : "secondary"
                        }
                        className="capitalize"
                      >
                        {t(delivery.supplied_item_condition)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge
                      variant="outline"
                      className={getSupplyDeliveryStatusBadgeColor(
                        delivery.status,
                      )}
                    >
                      {t(delivery.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-sm border-gray-400 font-semibold text-sm text-gray-950"
                      onClick={() => handleSeeDetails(delivery.id)}
                    >
                      <ArrowUpRightSquare strokeWidth={1} />
                      {t("see_details")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-4">
        <Pagination totalCount={response?.count || 0} />
      </div>
    </div>
  );
}
