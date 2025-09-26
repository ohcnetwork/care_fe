import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRightSquare,
  BarChart3,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem } from "@/components/ui/command";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/Common/Table";

import useFilters from "@/hooks/useFilters";

import CareIcon from "@/CAREUI/icons/CareIcon";
import query from "@/Utils/request/query";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";
import { ProductKnowledgeStatus } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import {
  SUPPLY_REQUEST_PRIORITY_COLORS,
  SUPPLY_REQUEST_STATUS_COLORS,
  SupplyRequestPriority,
  SupplyRequestRead,
  SupplyRequestStatus,
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
        ordering: "-created_date",
      },
    }),
  });

  const requests = response?.results || [];
  const productKnowledges = productKnowledgeResponse?.results || [];

  const selectedProduct = productKnowledges.find((p) => p.id === qParams.item);

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <ProductKnowledgeSelect
          value={selectedProduct}
          onChange={(product) => updateQuery({ item: product?.id })}
          placeholder={t("search_by_item")}
          className="placeholder:font-semibold"
        />

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
                  variant={
                    SUPPLY_REQUEST_STATUS_COLORS[
                      effectiveStatus as SupplyRequestStatus
                    ]
                  }
                  className="ml-2"
                >
                  {t(effectiveStatus)}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0" align="start">
            <Command>
              <CommandGroup>
                {Object.values(SupplyRequestStatus)
                  .filter((status) => status !== SupplyRequestStatus.draft)
                  .map((status) => (
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
                  variant={
                    SUPPLY_REQUEST_PRIORITY_COLORS[
                      qParams.priority as SupplyRequestPriority
                    ]
                  }
                  className="ml-2"
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
          icon={<CareIcon icon="l-box" className="text-primary size-6" />}
          title={t("no_requests_found")}
          description={t("no_requests_found_description")}
        />
      ) : (
        <div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("item")}</TableHead>
                <TableHead>{t("qty_requested")}</TableHead>
                <TableHead>{t("deliver_to")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("action")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request: SupplyRequestRead) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-gray-50 divide-x"
                >
                  <TableCell className="font-semibold w-1/3">
                    {request.item.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold min-w-8 text-right">
                        {request.quantity}
                      </span>
                      <span className="text-gray-600 capitalize">
                        {request.item.base_unit.display}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{request.deliver_to.name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={SUPPLY_REQUEST_STATUS_COLORS[request.status]}
                    >
                      {t(request.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={SUPPLY_REQUEST_PRIORITY_COLORS[request.priority]}
                    >
                      {t(request.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell className="w-10">
                    <Button
                      variant="outline"
                      className="font-semibold"
                      onClick={() => {
                        const params = new URLSearchParams(
                          qParams as Record<string, string>,
                        ).toString();
                        navigate(
                          `/facility/${facilityId}/locations/${locationId}/internal_transfers/to_dispatch/${request.id}?${params}`,
                        );
                      }}
                    >
                      <ArrowUpRightSquare strokeWidth={1.5} />
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
