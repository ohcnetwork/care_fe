import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import Page from "@/components/Common/Page";
import {
  CardGridSkeleton,
  TableSkeleton,
} from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import {
  PRODUCT_KNOWLEDGE_STATUS_COLORS,
  PRODUCT_KNOWLEDGE_TYPE_COLORS,
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

function ProductKnowledgeCard({
  product,
}: {
  product: ProductKnowledgeBase;
  facilityId: string;
}) {
  const { t } = useTranslation();
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Badge
                variant={PRODUCT_KNOWLEDGE_TYPE_COLORS[product.product_type]}
              >
                {t(product.product_type)}
              </Badge>
              <Badge variant={PRODUCT_KNOWLEDGE_STATUS_COLORS[product.status]}>
                {t(product.status)}
              </Badge>
            </div>
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            {product.code?.code && (
              <p className="mt-1 text-sm text-gray-500">
                {product.code.system} | {product.code.code}
              </p>
            )}
            {product.alternate_identifier && (
              <p className="mt-1 text-sm text-gray-500">
                {t("product_knowledge_alternate_identifier")}:{" "}
                {product.alternate_identifier}
              </p>
            )}
          </div>
        </div>
        <div className="flex justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/product_knowledge/${product.id}`}>
              <CareIcon icon="l-edit" className="size-4" />
              {t("see_details")}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductKnowledgeList({
  facilityId,
}: {
  facilityId: string;
}) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });

  // TODO: Remove this once we have a default status (robo's PR)
  useEffect(() => {
    if (!qParams.status) {
      updateQuery({ status: "active" });
    }
  }, []);

  const { data: response, isLoading } = useQuery({
    queryKey: ["productKnowledge", qParams],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.search,
        product_type: qParams.product_type,
        status: qParams.status,
        ordering: "-created_date",
      },
    }),
  });

  const products = response?.results || [];

  return (
    <Page title={t("product_knowledge")} hideTitleOnPage>
      <div className="container mx-auto">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-700">
            {t("product_knowledge")}
          </h1>
          <div className="mb-6 flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div>
              <p className="text-gray-600 text-sm">
                {t("manage_product_knowledge")}
              </p>
            </div>
            <Button
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/product_knowledge/new`,
                )
              }
            >
              <CareIcon icon="l-plus" className="mr-2" />
              {t("add_product_knowledge")}
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
            <div className="w-full md:w-auto">
              <div className="relative w-full md:w-auto">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <CareIcon icon="l-search" className="size-5" />
                </span>
                <Input
                  placeholder={t("search_products")}
                  value={qParams.search || ""}
                  onChange={(e) =>
                    updateQuery({ search: e.target.value || undefined })
                  }
                  className="w-full md:w-[300px] pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch gap-2 w-full sm:w-auto">
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.status || ""}
                  onValueChange={(value) => updateQuery({ status: value })}
                  options={Object.values(ProductKnowledgeStatus)}
                  label={t("status")}
                  onClear={() => updateQuery({ status: undefined })}
                />
              </div>
              <div className="flex-1 sm:flex-initial sm:w-auto">
                <FilterSelect
                  value={qParams.product_type || ""}
                  onValueChange={(value) =>
                    updateQuery({ product_type: value })
                  }
                  options={Object.values(ProductKnowledgeType)}
                  label={t("product_type")}
                  onClear={() => updateQuery({ product_type: undefined })}
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
            icon="l-folder-open"
            title={t("no_products_found")}
            description={t("adjust_product_filters")}
          />
        ) : (
          <>
            {/* Mobile Card View */}
            <div className="grid gap-4 md:hidden">
              {products.map((product: ProductKnowledgeBase) => (
                <ProductKnowledgeCard
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
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>
                        {t("product_knowledge_alternate_identifier")}
                      </TableHead>
                      <TableHead>{t("product_type")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead>{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="bg-white">
                    {products.map((product: ProductKnowledgeBase) => (
                      <TableRow key={product.id} className="divide-x">
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell>
                          {product.alternate_identifier || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              PRODUCT_KNOWLEDGE_TYPE_COLORS[
                                product.product_type
                              ]
                            }
                          >
                            {t(product.product_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              PRODUCT_KNOWLEDGE_STATUS_COLORS[product.status]
                            }
                          >
                            {t(product.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/product_knowledge/${product.id}`}>
                              <CareIcon icon="l-edit" className="size-4" />
                              {t("see_details")}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
