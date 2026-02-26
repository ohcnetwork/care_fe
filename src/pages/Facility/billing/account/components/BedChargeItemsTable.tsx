import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EmptyState } from "@/components/ui/empty-state";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  MonetaryComponent,
  MonetaryComponentType,
} from "@/types/base/monetaryComponent/monetaryComponent";
import { ResourceCategorySubType } from "@/types/base/resourceCategory/resourceCategory";
import {
  CHARGE_ITEM_STATUS_COLORS,
  ChargeItemRead,
  ChargeItemServiceResource,
  ChargeItemStatus,
} from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";

import { round } from "@/Utils/decimal";
import queryClient from "@/Utils/request/queryClient";
import { formatName } from "@/Utils/utils";
import { EditInvoiceDialog } from "@/components/Billing/Invoice/EditInvoiceDialog";
import AddMultipleChargeItemsSheet from "@/pages/Facility/services/serviceRequests/components/AddMultipleChargeItemsSheet";
import { AccountRead } from "@/types/billing/account/Account";
import { LocationAssociationRead } from "@/types/location/association";
import { differenceInDays, differenceInHours, format } from "date-fns";
import ChargeItemActionsMenu from "./ChargeItemActions";

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
  location: LocationAssociationRead;
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
    <TableRow className="bg-gray-50 border-b-2 border-gray-200 shadow-md">
      <TableCell
        className="border-x p-4 font-semibold text-gray-900"
        colSpan={9}
      >
        <div className="flex items-center justify-between">
          <div className="gap-2">
            <div className="flex items-center gap-2">
              {location.location.name}
              <Badge
                variant={location.status === "active" ? "primary" : "secondary"}
                className="text-xs"
              >
                {t(location.status)}
              </Badge>
            </div>
            <div className="text-xs font-normal text-gray-700 flex items-center gap-2">
              {[
                location.start_datetime &&
                  format(
                    new Date(location.start_datetime),
                    "MMM d, yyyy h:mm a",
                  ),
                location.end_datetime &&
                  format(new Date(location.end_datetime), "MMM d, yyyy h:mm a"),
              ]
                .filter(Boolean)
                .join(" - ")}{" "}
              {location.end_datetime && (
                <div className="text-sm text-gray-500">
                  {(() => {
                    const start = new Date(location.start_datetime);
                    const end = new Date(location.end_datetime);
                    const days = differenceInDays(end, start);
                    const hours = differenceInHours(end, start) % 24;

                    const parts = [];
                    if (days > 0) parts.push(`${days} ${t("days")}`);
                    if (hours > 0) parts.push(`${hours} ${t("hours")}`);

                    return `(${parts.join(", ") || `0 ${t("hours")}`})`;
                  })()}
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setAddChargeItemState({
                serviceRequestId: location.id,
                locationId: location.id,
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
  account: AccountRead;
}

export function BedChargeItemsTable({
  facilityId,
  account,
}: BedChargeItemsTableProps) {
  const { t } = useTranslation();
  const encounterId = account.primary_encounter?.id;
  const accountId = account.id;

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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedChargeItem, setSelectedChargeItem] =
    useState<ChargeItemRead | null>(null);

  const locationHistory = account.primary_encounter?.location_history || [];

  const { data: chargeItems, isLoading } = useQuery({
    queryKey: [
      "chargeItems",
      accountId,
      qParams,
      ChargeItemServiceResource.bed_association,
    ],
    queryFn: query(chargeItemApi.listChargeItem, {
      pathParams: { facilityId },
      queryParams: {
        account: accountId,
        status: qParams.status,
        service_resource: ChargeItemServiceResource.bed_association,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
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
        serviceResourceId={addChargeItemState.locationId}
        serviceResourceType={ChargeItemServiceResource.bed_association}
        resourceSubType={
          ResourceCategorySubType.charge_item_definition_location_bed_charges
        }
        onChargeItemsAdded={() => {
          setAddChargeItemState({
            serviceRequestId: "",
            locationId: "",
            status: false,
          });
          queryClient.invalidateQueries({
            queryKey: ["chargeItems", accountId],
          });
        }}
      />
      <div className="mb-4">
        {/* Desktop Tabs */}
        <Tabs
          value={qParams.status ?? "all"}
          onValueChange={(value) => {
            updateQuery({
              status: value === "all" ? undefined : value,
            });
          }}
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
          value={qParams.status ?? "all"}
          onValueChange={(value) =>
            updateQuery({
              status: value === "all" ? undefined : value,
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
      ) : !encounterId || !locationHistory.length ? (
        <EmptyState
          icon={<CareIcon icon="l-bed" className="text-primary size-6" />}
          title={
            !encounterId ? t("no_encounter_associated") : t("no_locations")
          }
          description={
            !encounterId
              ? t("no_encounter_associated_description")
              : t("no_locations_description")
          }
        />
      ) : (
        <div className="rounded-md overflow-x-auto border-2 border-white shadow-md">
          <Table className="rounded-lg border shadow-sm w-full bg-white">
            <TableHeader className="bg-gray-100">
              <TableRow className="border-b">
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5 w-10"></TableHead>
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
                <TableHead className="border-x p-3 text-gray-700 text-sm font-medium leading-5">
                  {t("performer")}
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
              {locationHistory.length > 0 &&
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
                            <TableCell colSpan={9} className="py-4">
                              <EmptyState
                                icon={
                                  <CareIcon
                                    icon="l-receipt"
                                    className="text-primary size-6"
                                  />
                                }
                                title={t("no_charge_items_for_location")}
                              />
                            </TableCell>
                          </TableRow>,
                        ]
                      : items.flatMap((item) => {
                          const isExpanded = expandedItems[item.id] || false;

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
                                <MonetaryDisplay
                                  amount={getBaseComponent(item)?.amount || "0"}
                                />
                              </TableCell>
                              <TableCell className="border-x p-3 text-gray-950">
                                {round(item.quantity)}
                              </TableCell>
                              <TableCell className="border-x p-3 text-gray-950 font-medium">
                                <MonetaryDisplay amount={item.total_price} />
                              </TableCell>
                              <TableCell className="border-x p-3 text-gray-950 font-semibold">
                                {formatName(item.performer_actor)}
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
                                <ChargeItemActionsMenu
                                  item={item}
                                  facilityId={facilityId}
                                  accountId={accountId}
                                  onEdit={(item) => {
                                    setSelectedChargeItem(item);
                                    setIsEditDialogOpen(true);
                                  }}
                                />
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
                              <TableCell colSpan={9}></TableCell>
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
                })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination totalCount={chargeItems?.count || 0} />

      <EditInvoiceDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setSelectedChargeItem(null);
          }
        }}
        facilityId={facilityId}
        chargeItems={selectedChargeItem ? [selectedChargeItem] : []}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["chargeItems", accountId],
          });
        }}
        title={t("edit_charge_item")}
      />
    </div>
  );
}

export default BedChargeItemsTable;
