import { useQuery } from "@tanstack/react-query";
import { ArrowDownUp, Truck } from "lucide-react";
import { Link } from "raviger";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";

import Page from "@/components/Common/Page";
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

import { isLessThan, round } from "@/Utils/decimal";
import query from "@/Utils/request/query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { FilterSelect } from "@/components/ui/filter-select";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ACCOUNT_STATUS_COLORS } from "@/types/billing/account/Account";
import { InventoryStatusOptions } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import supplyDeliveryApi from "@/types/inventory/supplyDelivery/supplyDeliveryApi";
import { ProductKnowledgeSelect } from "./ProductKnowledgeSelect";
import { SupplyDeliveryTable } from "./SupplyDeliveryTable";

const SORT_OPTIONS = {
  low_to_high: "net_content",
  high_to_low: "-net_content",
} as const;

type SortOptionKey = keyof typeof SORT_OPTIONS;

interface ProductDeliveriesDrawerContentProps {
  facilityId: string;
  locationId: string;
  selectedProductKnowledge?: ProductKnowledgeBase;
}

function ProductDeliveriesDrawerContent({
  facilityId,
  locationId,
  selectedProductKnowledge,
}: ProductDeliveriesDrawerContentProps) {
  const { t } = useTranslation();

  const { data: deliveries, isLoading } = useQuery({
    queryKey: [
      "supplyDeliveries",
      facilityId,
      locationId,
      selectedProductKnowledge?.id,
    ],
    queryFn: query.paginated(supplyDeliveryApi.listSupplyDelivery, {
      queryParams: {
        facility: facilityId,
        destination: locationId,
        supplied_inventory_item_product_knowledge: selectedProductKnowledge?.id,
      },
    }),
    enabled: !!selectedProductKnowledge?.id,
  });

  return (
    <div className="space-y-4 overflow-y-auto pt-4 max-h-[68vh]">
      {isLoading ? (
        <TableSkeleton count={2} />
      ) : deliveries?.results && deliveries.results.length > 0 ? (
        <SupplyDeliveryTable
          deliveries={deliveries.results}
          facilityId={facilityId}
          linkToProduct
        />
      ) : (
        <EmptyState
          icon={<Truck className="size-5 text-primary-600" />}
          title={t("no_deliveries_found")}
          description={t("no_deliveries_found_description")}
        />
      )}
    </div>
  );
}

interface InventoryListProps {
  facilityId: string;
  locationId: string;
}
export function InventoryList({ facilityId, locationId }: InventoryListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 14,
    disableCache: true,
  });

  // State to store the selected product knowledge object
  const [selectedProductKnowledge, setSelectedProductKnowledge] = useState<
    ProductKnowledgeBase | undefined
  >(undefined);

  // State for the "all deliveries" drawer
  const [showAllDeliveries, setShowAllDeliveries] = useState(false);
  const [selectedProductKnowledgeDrawer, setSelectedProductKnowledgeDrawer] =
    useState<ProductKnowledgeBase | undefined>(undefined);

  // Clear selected product knowledge when query parameter is cleared
  useEffect(() => {
    if (!qParams.product_knowledge_id) {
      setSelectedProductKnowledge(undefined);
    }
  }, [qParams.product_knowledge_id]);

  const { data, isLoading } = useQuery({
    queryKey: ["inventory", facilityId, locationId, qParams],
    queryFn: query.debounced(inventoryApi.list, {
      pathParams: { facilityId, locationId },
      queryParams: {
        status: qParams.status,
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        product_knowledge: qParams.product_knowledge_id,
        ordering: qParams.ordering,
      },
    }),
  });

  return (
    <Page
      title={t("inventory")}
      options={
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
          <div className="w-full sm:w-auto">
            <ProductKnowledgeSelect
              value={selectedProductKnowledge}
              onChange={(
                productKnowledge: ProductKnowledgeBase | undefined,
              ) => {
                setSelectedProductKnowledge(productKnowledge);
                updateQuery({
                  product_knowledge_id: productKnowledge?.id || undefined,
                });
              }}
              placeholder={t("search_product_knowledge")}
              disableFavorites
            />
          </div>

          <div className="w-full sm:w-auto">
            <FilterSelect
              value={qParams.status || ""}
              onValueChange={(value) => updateQuery({ status: value })}
              options={Object.values(InventoryStatusOptions)}
              label={t("status")}
              onClear={() => updateQuery({ status: undefined })}
              className="w-full sm:w-auto h-9 border-gray-300"
              placeholder={t("filter_by_status")}
            />
          </div>
          <div className="w-full sm:w-auto">
            <FilterSelect
              icon={<ArrowDownUp className="size-4" />}
              value={
                (Object.keys(SORT_OPTIONS) as Array<SortOptionKey>).find(
                  (key) => SORT_OPTIONS[key] === qParams.ordering,
                ) || ""
              }
              onValueChange={(value) =>
                updateQuery({
                  ordering: value
                    ? SORT_OPTIONS[value as SortOptionKey]
                    : undefined,
                })
              }
              options={Object.keys(SORT_OPTIONS)}
              label={t("net_content")}
              onClear={() => updateQuery({ ordering: undefined })}
              className="w-full sm:w-auto h-9 border-gray-300"
              placeholder={t("sort_by_net_content")}
            />
          </div>
        </div>
      }
    >
      <div className="mt-3">
        {isLoading ? (
          <div className="rounded-md border">
            <TableSkeleton count={10} />
          </div>
        ) : !data?.results?.length ? (
          <EmptyState
            icon={<CareIcon icon="l-box" className="text-primary size-6" />}
            title={t("no_inventory")}
            description={t("no_inventory_description")}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("net_content")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("expiration_date")}</TableHead>
                <TableHead>{t("batch")}</TableHead>
                <TableHead>{t("base_price")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.results?.map((inventory) => (
                <TableRow key={inventory.id}>
                  <TableCell className="font-semibold">
                    <button
                      onClick={() => {
                        setSelectedProductKnowledgeDrawer(
                          inventory.product.product_knowledge,
                        );
                        setShowAllDeliveries(true);
                      }}
                      className="w-full flex items-center gap-2 underline"
                    >
                      {inventory.product.product_knowledge.name}
                      <Link
                        href={`/facility/${facilityId}/settings/product/${inventory.product.id}`}
                        basePath="/"
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CareIcon
                          icon="l-external-link-alt"
                          className="size-4 text-gray-500 hover:text-gray-700"
                        />
                        <span className="sr-only">
                          {t("view_product_details")}
                        </span>
                      </Link>
                    </button>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium space-x-1",
                      isLessThan(inventory.net_content, 10) &&
                        "text-yellow-600",
                    )}
                  >
                    <span>{round(inventory.net_content)}</span>
                    <span className="text-sm self-center">
                      {inventory.product.product_knowledge.base_unit.display}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Badge variant={ACCOUNT_STATUS_COLORS[inventory.status]}>
                      {t(inventory.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {inventory.product.expiration_date
                      ? new Date(
                          inventory.product.expiration_date,
                        ).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {inventory.product.batch?.lot_number || "-"}
                  </TableCell>
                  <TableCell>
                    {inventory.product.charge_item_definition && (
                      <MonetaryDisplay
                        amount={
                          inventory.product.charge_item_definition.price_components.find(
                            (c) =>
                              c.monetary_component_type ===
                              MonetaryComponentType.base,
                          )?.amount
                        }
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="mt-8 flex justify-center">
        <Pagination totalCount={data?.count || 0} />
      </div>

      <Drawer open={showAllDeliveries} onOpenChange={setShowAllDeliveries}>
        <DrawerContent className="max-w-7xl mx-auto px-4 sm:px-16 pb-10">
          <DrawerHeader>
            <DrawerTitle className="mb-2">{t("all_deliveries")}</DrawerTitle>
          </DrawerHeader>
          <ProductDeliveriesDrawerContent
            facilityId={facilityId}
            locationId={locationId}
            selectedProductKnowledge={selectedProductKnowledgeDrawer}
          />
        </DrawerContent>
      </Drawer>
    </Page>
  );
}
