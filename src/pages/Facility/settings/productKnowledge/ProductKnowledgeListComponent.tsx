import { useQuery } from "@tanstack/react-query";
import { Link, navigate } from "raviger";
import { useEffect, useState } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import {
  PRODUCT_KNOWLEDGE_STATUS_COLORS,
  PRODUCT_KNOWLEDGE_TYPE_COLORS,
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import query from "@/Utils/request/query";

// Product knowledge card component for mobile view
function ProductKnowledgeCard({
  product,
  facilityId,
}: {
  product: ProductKnowledgeBase;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                <CareIcon icon="l-folder" className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Badge
                  variant={PRODUCT_KNOWLEDGE_TYPE_COLORS[product.product_type]}
                  className="text-xs"
                >
                  {t(product.product_type)}
                </Badge>
                <Badge
                  variant={PRODUCT_KNOWLEDGE_STATUS_COLORS[product.status]}
                  className="text-xs"
                >
                  {t(product.status)}
                </Badge>
              </div>
              <h3 className="font-medium text-gray-900 truncate">
                {product.name}
              </h3>
              {product.alternate_identifier && (
                <p className="mt-1 text-sm text-gray-500">
                  {t("product_knowledge_alternate_identifier")}:{" "}
                  {product.alternate_identifier}
                </p>
              )}
              {product.code?.code && (
                <p className="mt-1 text-sm text-gray-500">
                  {product.code.system} | {product.code.code}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                navigate(
                  `/facility/${facilityId}/settings/product_knowledge/${product.slug}`,
                )
              }
            >
              <CareIcon icon="l-edit" className="h-4 w-4" />
              {t("see_details")}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Table row component for desktop view
function ProductKnowledgeTableRow({
  product,
  facilityId,
}: {
  product: ProductKnowledgeBase;
  facilityId: string;
}) {
  const { t } = useTranslation();

  return (
    <TableRow className="hover:bg-gray-50 cursor-pointer">
      <TableCell
        className="font-medium cursor-pointer"
        onClick={() =>
          navigate(
            `/facility/${facilityId}/settings/product_knowledge/${product.slug}`,
          )
        }
      >
        <div className="flex items-center space-x-3">
          <div className="p-1 rounded bg-gray-100 text-gray-600">
            <CareIcon icon="l-folder" className="h-4 w-4" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{product.name}</div>
            {product.alternate_identifier && (
              <div className="text-sm text-gray-500">
                {t("product_knowledge_alternate_identifier")}:{" "}
                {product.alternate_identifier}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant={PRODUCT_KNOWLEDGE_TYPE_COLORS[product.product_type]}
          className="text-xs"
        >
          {t(product.product_type)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge
          variant={PRODUCT_KNOWLEDGE_STATUS_COLORS[product.status]}
          className="text-xs"
        >
          {t(product.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/product_knowledge/${product.slug}/edit`}>
                    <CareIcon icon="l-edit" className="h-4 w-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("edit_product_knowledge")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

interface ProductKnowledgeListProps {
  facilityId: string;
  categorySlug: string;
  setAllowCategoryCreate: (allow: boolean) => void;
}

export function ProductKnowledgeList({
  facilityId,
  categorySlug,
  setAllowCategoryCreate,
}: ProductKnowledgeListProps) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
    defaultQueryParams: {
      status: "active",
    },
  });

  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Fetch product knowledge for current category
  const { data: productsResponse, isLoading: isLoadingProducts } = useQuery({
    queryKey: ["productKnowledge", facilityId, categorySlug, qParams],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        category: categorySlug,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        name: qParams.search,
        product_type: qParams.product_type,
        status: qParams.status,
      },
    }),
  });

  const products = productsResponse?.results || [];

  useEffect(() => {
    if (!qParams.search && qParams.page === "1") {
      setAllowCategoryCreate(!productsResponse?.count);
    }
  }, [
    productsResponse?.count,
    setAllowCategoryCreate,
    qParams.search,
    qParams.page,
  ]);

  return (
    <TooltipProvider>
      <div>
        {/* Header with filters and view toggle */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search */}
            <div className="relative w-full sm:w-auto">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <CareIcon icon="l-search" className="size-5" />
              </span>
              <Input
                placeholder={t("search_products")}
                value={qParams.search || ""}
                onChange={(e) =>
                  updateQuery({ search: e.target.value || undefined })
                }
                className="w-full sm:w-[300px] pl-10"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto">
              <FilterSelect
                value={qParams.status || ""}
                onValueChange={(value) => updateQuery({ status: value })}
                options={Object.values(ProductKnowledgeStatus)}
                label={t("status")}
                onClear={() => updateQuery({ status: undefined })}
              />
            </div>

            {/* Product Type Filter */}
            <div className="w-full sm:w-auto">
              <FilterSelect
                value={qParams.product_type || ""}
                onValueChange={(value) => updateQuery({ product_type: value })}
                options={Object.values(ProductKnowledgeType)}
                label={t("product_type")}
                onClear={() => updateQuery({ product_type: undefined })}
              />
            </div>
          </div>

          {/* View Toggle - Desktop only */}
          <div className="hidden lg:flex items-center space-x-2">
            <span className="text-sm text-gray-500">{t("view")}:</span>
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === "table" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("table")}
                className="rounded-r-none"
              >
                <CareIcon icon="l-table" className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "cards" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("cards")}
                className="rounded-l-none"
              >
                <CareIcon icon="l-th-large" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results count */}
        {productsResponse && productsResponse.count > 0 && (
          <div className="mb-4 text-sm text-gray-600">
            {t("showing")} {products.length} {t("of")} {productsResponse.count}{" "}
            {t("products")}
          </div>
        )}

        {/* Content */}
        {isLoadingProducts ? (
          <TableSkeleton count={5} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_product_knowledge_found")}
            description={t("no_products_in_category")}
          />
        ) : (
          <>
            {/* Desktop Table View */}
            {viewMode === "table" && (
              <div className="hidden lg:block">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[35%]">{t("name")}</TableHead>
                        <TableHead className="w-[15%]">
                          {t("product_type")}
                        </TableHead>
                        <TableHead className="w-[15%]">{t("status")}</TableHead>
                        <TableHead className="w-[5%]">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <ProductKnowledgeTableRow
                          key={product.id}
                          product={product}
                          facilityId={facilityId}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Mobile Card View */}
            <div className={`${viewMode === "cards" ? "block" : "lg:hidden"}`}>
              <div className="grid gap-3">
                {products.map((product) => (
                  <ProductKnowledgeCard
                    key={product.id}
                    product={product}
                    facilityId={facilityId}
                  />
                ))}
              </div>
            </div>

            {/* Pagination */}
            {productsResponse && productsResponse.count > resultsPerPage && (
              <div className="mt-6 flex justify-center">
                <Pagination totalCount={productsResponse.count} />
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
