import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRightSquare,
  BarChart3,
  SlidersHorizontal,
  X,
} from "lucide-react";
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
  SupplyRequestPriority,
  SupplyRequestRead,
  SupplyRequestStatus,
  getSupplyRequestPriorityBadgeColor,
  getSupplyRequestStatusBadgeColor,
} from "@/types/inventory/supplyRequest/supplyRequest";
import supplyRequestApi from "@/types/inventory/supplyRequest/supplyRequestApi";

interface Props {
  facilityId: string;
  locationId: string;
}

export default function ToDispatchSupplyRequestTable({
  facilityId,
  locationId,
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  const effectiveStatus = qParams.status || SupplyRequestStatus.active;

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
      "supplyRequests",
      facilityId,
      locationId,
      qParams,
      effectiveStatus,
    ],
    queryFn: query.debounced(supplyRequestApi.listSupplyRequest, {
      queryParams: {
        deliver_from: locationId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: effectiveStatus,
        priority: qParams.priority,
        item: qParams.item,
        deliver_to_isnull: false,
      },
    }),
  });

  const requests = response?.results || [];
  const productKnowledges = productKnowledgeResponse?.results || [];

  const selectedProduct = productKnowledges.find((p) => p.id === qParams.item);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="w-full justify-between"
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

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="gap-2 font-medium"
            >
              <SlidersHorizontal className="size-4" />
              <span>{t("filter_by_status")}</span>
              {effectiveStatus && (
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2",
                    getSupplyRequestStatusBadgeColor(effectiveStatus),
                  )}
                >
                  {t(effectiveStatus)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandGroup>
                {Object.values(SupplyRequestStatus).map((status) => (
                  <CommandItem
                    key={status}
                    value={status}
                    onSelect={() =>
                      updateQuery({
                        status:
                          effectiveStatus === status
                            ? SupplyRequestStatus.active
                            : status,
                      })
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        effectiveStatus === status
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {t(status)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              className="gap-2 font-medium"
            >
              <BarChart3 className="size-4" />
              <span>{t("filter_by_priority")}</span>
              {qParams.priority && (
                <Badge
                  variant="outline"
                  className={cn(
                    "ml-2",
                    getSupplyRequestPriorityBadgeColor(qParams.priority),
                  )}
                >
                  {t(qParams.priority)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandGroup>
                {Object.values(SupplyRequestPriority).map((priority) => (
                  <CommandItem
                    key={priority}
                    value={priority}
                    onSelect={() =>
                      updateQuery({
                        priority:
                          qParams.priority === priority ? undefined : priority,
                      })
                    }
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        qParams.priority === priority
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {t(priority)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {isLoading ? (
        <TableSkeleton count={5} />
      ) : !requests.length ? (
        <EmptyState
          icon="l-box"
          title={t("no_requests_found")}
          description={t("no_requests_found_description")}
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
                  {t("deliver_to")}
                </TableHead>
                <TableHead className="text-gray-700">{t("status")}</TableHead>
                <TableHead className="text-gray-700">{t("priority")}</TableHead>
                <TableHead className="text-gray-700">{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="bg-white">
              {requests.map((request: SupplyRequestRead) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-gray-50 divide-x"
                >
                  <TableCell className="font-semibold text-gray-950">
                    {request.item.name}
                  </TableCell>
                  <TableCell className="font-medium text-gray-950">
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-8 text-right">
                        {request.quantity}{" "}
                        {request.item.definitional?.dosage_form?.display}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-950">
                    {request.deliver_to.name}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge
                      variant="outline"
                      className={getSupplyRequestStatusBadgeColor(
                        request.status,
                      )}
                    >
                      {t(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge
                      variant="outline"
                      className={getSupplyRequestPriorityBadgeColor(
                        request.priority,
                      )}
                    >
                      {t(request.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shadow-sm border-gray-400 font-semibold text-sm text-gray-950"
                      onClick={() =>
                        navigate(
                          `/facility/${facilityId}/locations/${locationId}/supply_requests/${request.id}/dispatch`,
                        )
                      }
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
