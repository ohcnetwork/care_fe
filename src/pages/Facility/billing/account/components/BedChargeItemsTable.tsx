import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  PencilIcon,
  PlusIcon,
} from "lucide-react";
import { useQueryParams } from "raviger";
import { useMemo, useState } from "react";
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
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import queryClient from "@/Utils/request/queryClient";
import AddMultipleChargeItemsSheet from "@/pages/Facility/services/serviceRequests/components/AddMultipleChargeItemsSheet";
import { LocationHistory } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
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
            <TableCell className="pl-12"></TableCell>
            <TableCell>
              {component.code && `${component.code.display} `}({label})
            </TableCell>
            <TableCell>
              <MonetaryDisplay {...component} />
            </TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        );
      })}
    </>
  );
}

interface LocationGroupRowProps {
  location: LocationHistory;
  setAddChargeItemState: (state: {
    serviceRequestId: string;
    locationId: string;
    status: boolean;
  }) => void;
}

function LocationGroupRow({
  location,
  setAddChargeItemState,
}: LocationGroupRowProps) {
  const { t } = useTranslation();
  return (
    <TableRow className="bg-blue-50 border-b-2 border-blue-200">
      <TableCell
        className="border-x p-4 font-semibold text-blue-900"
        colSpan={8}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {location.location.name}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setAddChargeItemState({
                serviceRequestId: location.id,
                locationId: location.location.id,
                status: true,
              })
            }
            className=""
          >
            <PlusIcon className="size-4 mr-2" />
            {t("add_charge_items")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function groupChargeItemsByLocation(
  chargeItems: ChargeItemRead[],
): Record<string, ChargeItemRead[]> {
  const grouped: Record<string, ChargeItemRead[]> = {};

  chargeItems.forEach((item) => {
    if (item.service_resource_id) {
      if (!grouped[item.service_resource_id]) {
        grouped[item.service_resource_id] = [];
      }
      grouped[item.service_resource_id].push(item);
    }
  });

  return grouped;
}

export interface BedChargeItemsTableProps {
  facilityId: string;
  accountId: string;
}

export function BedChargeItemsTable({
  facilityId,
  accountId,
}: BedChargeItemsTableProps) {
  const { t } = useTranslation();
  const [{ encounterId }] = useQueryParams();
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const [addChargeItemState, setAddChargeItemState] = useState<{
    serviceRequestId: string;
    locationId: string;
    status: boolean;
  }>({ serviceRequestId: "", locationId: "", status: false });

  const { data: encounter, isLoading: isEncounterLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
      queryParams: facilityId ? { facility: facilityId } : {},
    }),
    enabled: !!encounterId,
  });

  const locationHistory = encounter?.location_history || [];

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: ["bedChargeItems", qParams, accountId],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: qParams.charge_item_status,
        service_resource: ChargeItemServiceResource.bed_association,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        ordering: "-created_date",
      },
    }),
  }) as {
    data: { results: ChargeItemRead[]; count: number } | undefined;
    isLoading: boolean;
  };

  const groupedChargeItems = useMemo(() => {
    if (!chargeItems?.results?.length) {
      return {};
    }
    return groupChargeItemsByLocation(chargeItems.results);
  }, [chargeItems?.results]);

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
      <AddMultipleChargeItemsSheet
        open={addChargeItemState.status}
        onOpenChange={(open) =>
          setAddChargeItemState({
            serviceRequestId: addChargeItemState.serviceRequestId,
            locationId: addChargeItemState.locationId,
            status: open,
          })
        }
        facilityId={facilityId}
        encounterId={encounterId}
        locationId={addChargeItemState.locationId}
        serviceRequestId={addChargeItemState.serviceRequestId}
        serviceResourceType={ChargeItemServiceResource.bed_association}
        onChargeItemsAdded={() => {
          setAddChargeItemState({
            serviceRequestId: "",
            locationId: "",
            status: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["bedChargeItems", qParams, accountId],
          });
        }}
      />
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
      {isLoading || isEncounterLoading ? (
        <TableSkeleton count={3} />
      ) : encounterId == undefined || !encounterId || !encounter ? (
        <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
          <div className="text-center text-gray-500 py-4">
            {t("no_encounter_associated")}
          </div>
        </div>
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
              {!locationHistory.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-500">
                    {t("no_locations")}
                  </TableCell>
                </TableRow>
              ) : (
                locationHistory.flatMap((location) => {
                  const items = groupedChargeItems[location.id] || [];

                  return [
                    <LocationGroupRow
                      key={`location-${location.id}`}
                      location={location}
                      setAddChargeItemState={setAddChargeItemState}
                    />,
                    ...(items.length === 0
                      ? [
                          <TableRow key={`${location.id}-no-items`}>
                            <TableCell
                              colSpan={8}
                              className="text-center text-gray-500 py-4 italic"
                            >
                              {t("no_charge_items_for_location")}
                            </TableCell>
                          </TableRow>,
                        ]
                      : items.flatMap((item) => {
                          const isExpanded = expandedItems[item.id] || false;
                          const baseComponent = getBaseComponent(item);
                          const baseAmount = String(
                            baseComponent?.amount || "0",
                          );

                          const mainRow = (
                            <TableRow
                              key={item.id}
                              className="border-b hover:bg-gray-50"
                            >
                              <TableCell className="border-x p-3 text-gray-950 pl-6">
                                <div className="flex items-center gap-2">
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
                                </div>
                              </TableCell>
                              <TableCell className="border-x p-3 text-gray-950">
                                <div className="font-medium">
                                  {item.title}
                                  {item.description && (
                                    <p className="text-xs text-gray-500 whitespace-pre-wrap">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="border-x p-3 text-gray-950">
                                {item.service_resource ===
                                  ChargeItemServiceResource.bed_association &&
                                  item.service_resource_id && (
                                    <span className="text-gray-500">
                                      {t("bed_association")}
                                    </span>
                                  )}
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
                                    variant={
                                      CHARGE_ITEM_STATUS_COLORS[item.status]
                                    }
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
                              <TableCell className="pl-12"></TableCell>
                              <TableCell className="text-gray-950">
                                {t("total")}
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell className="p-3">
                                <MonetaryDisplay amount={item.total_price} />
                              </TableCell>
                              <TableCell></TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          );

                          const emptyRow = (
                            <TableRow
                              key={`${item.id}-empty`}
                              className="bg-muted"
                            >
                              <TableCell colSpan={8}></TableCell>
                            </TableRow>
                          );

                          return [
                            mainRow,
                            ...detailRows,
                            summaryRow,
                            emptyRow,
                          ].filter(Boolean);
                        })),
                  ];
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

export default BedChargeItemsTable;
