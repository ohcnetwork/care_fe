import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductKnowledgeSelect } from "@/pages/Facility/services/inventory/ProductKnowledgeSelect";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import { ActionButtons } from "@/pages/Facility/settings/ActionButtons";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import { MonetaryComponentType } from "@/types/base/monetaryComponent/monetaryComponent";
import {
  PRODUCT_STATUS_COLORS,
  ProductRead,
  ProductStatusOptions,
} from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

function ProductCard({
  product,
  facilityId,
}: {
  product: ProductRead;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex flex-wrap flex-col md:flex-row items-start justify-between gap-2">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant={PRODUCT_STATUS_COLORS[product.status]}>
                {t(product.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900 break-normal text-lg">
              {product.product_knowledge.name}
            </h3>
            {product.batch?.lot_number && (
              <p className="mt-1 text-sm text-gray-500">
                {t("lot_number")}: {product.batch.lot_number}
              </p>
            )}
            {product.expiration_date && (
              <p className="mt-1 text-xs text-gray-400">
                {t("expires")}:{" "}
                {format(new Date(product.expiration_date), "PPP")}
              </p>
            )}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <ProductActions product={product} facilityId={facilityId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductList({ facilityId }: { facilityId: string }) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    defaultQueryParams: {
      status: "active",
    },
  });

  const { data: response, isLoading } = useQuery({
    queryKey: ["products", qParams],
    queryFn: query.debounced(productApi.listProduct, {
      pathParams: {
        facilityId,
      },
      queryParams: {
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        status: qParams.status,
        product_knowledge: qParams.product_knowledge_slug,
      },
    }),
  });

  const { data: productKnowledge } = useQuery({
    queryKey: ["productKnowledge", qParams.product_knowledge_slug],
    queryFn: query.debounced(productKnowledgeApi.retrieveProductKnowledge, {
      pathParams: {
        slug: qParams.product_knowledge_slug,
      },
    }),
    enabled: !!qParams.product_knowledge_slug,
  });

  const products = response?.results || [];

  return (
    <Page title={t("products")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">{t("products")}</h1>
          <div className="mb-6 flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div>
              <p className="text-gray-600 text-sm">{t("manage_products")}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full sm:w-auto">
              <ProductKnowledgeSelect
                value={productKnowledge}
                onChange={(productKnowledge) => {
                  updateQuery({
                    product_knowledge_slug: productKnowledge?.slug || undefined,
                  });
                }}
                placeholder={t("search_product_knowledge")}
                disableFavorites
              />
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(ProductStatusOptions)}
                  label={t("status")}
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 md:hidden">
              <CardGridSkeleton count={4} />
            </div>
            <div className="hidden md:block">
              <TableSkeleton count={5} />
            </div>
          </>
        ) : products.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_products_found")}
            description={t("adjust_product_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {products.map((product: ProductRead) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  facilityId={facilityId}
                />
              ))}
            </div>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <div className="rounded-lg border">
                <Table>
                  <TableHeader className="bg-gray-100">
                    <TableRow className="divide-x">
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("lot_number")}</TableHead>
                      <TableHead>{t("expires")}</TableHead>
                      <TableHead>{t("base_price")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {products.map((product: ProductRead) => {
                      const basePrice =
                        product.charge_item_definition?.price_components.find(
                          (c) =>
                            c.monetary_component_type ===
                            MonetaryComponentType.base,
                        )?.amount;
                      return (
                        <TableRow key={product.id} className="divide-x">
                          <TableCell className="font-medium">
                            {product.product_knowledge.name}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={PRODUCT_STATUS_COLORS[product.status]}
                            >
                              {t(product.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {product.batch?.lot_number || "-"}
                          </TableCell>
                          <TableCell>
                            {product.expiration_date
                              ? format(new Date(product.expiration_date), "PPP")
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {basePrice ? (
                              <MonetaryDisplay amount={basePrice} />
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <ProductActions
                                product={product}
                                facilityId={facilityId}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}

        {response && response.count > resultsPerPage && (
          <div className="mt-4 flex justify-center">
            <Pagination totalCount={response.count} />
          </div>
        )}
      </div>
    </Page>
  );
}

function ProductActions({
  product,
  facilityId,
}: {
  product: ProductRead;
  facilityId: string;
}) {
  return (
    <ActionButtons
      editPath={`/facility/${facilityId}/settings/product/${product.id}/edit`}
      viewPath={`/facility/${facilityId}/settings/product/${product.id}`}
    />
  );
}
