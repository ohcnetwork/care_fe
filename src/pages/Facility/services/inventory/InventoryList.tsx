import { useQuery } from "@tanstack/react-query";
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

import query from "@/Utils/request/query";
import { FilterSelect } from "@/components/ui/filter-select";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import { ACCOUNT_STATUS_COLORS } from "@/types/billing/account/Account";
import { InventoryStatusOptions } from "@/types/inventory/product/inventory";
import inventoryApi from "@/types/inventory/product/inventoryApi";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import { ProductKnowledgeSelect } from "./ProductKnowledgeSelect";

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
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        product_knowledge: qParams.product_knowledge_id,
      },
    }),
  });

  return (
    <Page
      title={t("inventory")}
      options={
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
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
                    <Link
                      href={`/facility/${facilityId}/settings/product_knowledge/${inventory.product.product_knowledge.slug}`}
                      basePath="/"
                      className="flex items-center gap-2"
                    >
                      {inventory.product.product_knowledge.name}
                      <CareIcon
                        icon="l-external-link-alt"
                        className="size-4 text-gray-500"
                      />
                    </Link>
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-medium",
                      inventory.net_content < 10 && "text-yellow-600",
                    )}
                  >
                    {inventory.net_content}
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
    </Page>
  );
}
