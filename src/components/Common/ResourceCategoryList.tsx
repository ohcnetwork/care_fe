import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { ResourceCategoryForm } from "@/components/Common/ResourceCategoryForm";
import useFilters from "@/hooks/useFilters";
import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";

// Category card component for displaying individual categories
function CategoryCard({
  category,
  onNavigate,
  onEdit,
}: {
  category: ResourceCategoryRead;
  onNavigate: (slug: string) => void;
  onEdit: (category: ResourceCategoryRead) => void;
}) {
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onNavigate(category.slug)}
    >
      <CardContent className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div
                className={`p-1 rounded ${
                  category.has_children
                    ? "bg-green-100 text-green-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                <CareIcon icon="l-folder" className="h-4 w-4" />
              </div>
            </div>

            <h3 className="text-base font-semibold text-gray-900 truncate">
              {category.title}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(category);
              }}
            >
              <CareIcon icon="l-ellipsis-v" className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Breadcrumb component for resource category navigation
function ResourceCategoryBreadcrumb({
  currentCategory,
  onNavigate,
  basePath,
  baseTitle,
}: {
  currentCategory?: ResourceCategoryRead;
  onNavigate: (slug: string) => void;
  basePath: string;
  baseTitle: string;
}) {
  if (!currentCategory) {
    return null;
  }

  // Build breadcrumb hierarchy from parent chain
  const breadcrumbItems = [];
  let currentParent = currentCategory.parent;

  while (currentParent) {
    if (currentParent.parent) {
      breadcrumbItems.unshift(currentParent);
    }
    currentParent = currentParent.parent;
  }

  // Add current category as the last item
  breadcrumbItems.push({
    title: currentCategory.title,
    slug: currentCategory.slug,
  });

  if (breadcrumbItems.length < 1) {
    return null;
  }

  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink
            onClick={() => navigate(basePath)}
            className="cursor-pointer hover:underline hover:underline-offset-2"
          >
            {baseTitle}
          </BreadcrumbLink>
        </BreadcrumbItem>

        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={item.slug}>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {index === breadcrumbItems.length - 1 ? (
                <BreadcrumbPage className="font-semibold text-gray-900">
                  {item.title}
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink
                  onClick={() => onNavigate(item.slug)}
                  className="cursor-pointer hover:underline hover:underline-offset-2"
                >
                  {item.title || item.slug}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

interface ResourceCategoryListProps {
  facilityId: string;
  categorySlug?: string;
  resourceType: ResourceCategoryResourceType;
  basePath: string;
  baseTitle: string;
  onNavigate: (slug: string) => void;
  onCreateItem?: () => void;
  createItemLabel?: string;
  createItemIcon?: "l-plus" | "l-file" | "l-folder-plus";
  createItemTooltip?: string;
  allowCategoryCreate?: boolean;
  children?: React.ReactNode;
}

export function ResourceCategoryList({
  facilityId,
  categorySlug,
  resourceType,
  basePath,
  baseTitle,
  onNavigate,
  onCreateItem,
  createItemLabel,
  createItemIcon = "l-plus",
  createItemTooltip,
  allowCategoryCreate = false,
  children,
}: ResourceCategoryListProps) {
  const { t } = useTranslation();
  // Form state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<string | null>(
    null,
  );
  const { qParams, Pagination, resultsPerPage } = useFilters({
    limit: RESULTS_PER_PAGE_LIMIT,
    disableCache: true,
  });

  // Fetch current category by slug
  const { data: currentCategory } = useQuery({
    queryKey: ["resourceCategory", facilityId, categorySlug],
    queryFn: query(resourceCategoryApi.get, {
      pathParams: { facilityId, slug: categorySlug! },
    }),
    enabled: !!categorySlug,
  });

  // Fetch categories for current level
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: ["resourceCategories", facilityId, categorySlug, qParams],
      queryFn: query(resourceCategoryApi.list, {
        pathParams: { facilityId },
        queryParams: {
          resource_type: resourceType,
          parent: categorySlug || "",
          ordering: "title",
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        },
      }),
    },
  );

  const categories = categoriesResponse?.results || [];
  const isRootLevel = !categorySlug;
  const isLeafCategory = currentCategory && !currentCategory.has_children;

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleEditCategory = (category: ResourceCategoryRead) => {
    setEditingCategory(category.slug);
    setIsCategoryFormOpen(true);
  };

  const handleCategoryFormSuccess = (category: ResourceCategoryRead) => {
    setIsCategoryFormOpen(false);
    queryClient.invalidateQueries({
      queryKey: ["resourceCategories"],
    });
    onNavigate(category.slug);
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto">
        <div className="mb-4">
          {/* Breadcrumb Navigation */}

          <div className="flex sm:flex-row sm:items-center sm:justify-between flex-col gap-4">
            <div className="flex flex-col items-start space-x-2">
              <h1 className="text-2xl font-bold text-gray-700">{baseTitle}</h1>
              <ResourceCategoryBreadcrumb
                currentCategory={currentCategory}
                onNavigate={onNavigate}
                basePath={basePath}
                baseTitle={baseTitle}
              />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-x-2 gap-2">
              <Button
                variant="outline"
                onClick={handleCreateCategory}
                disabled={isLeafCategory && !allowCategoryCreate}
                className="w-full sm:w-auto"
              >
                <CareIcon icon="l-folder-plus" className="mr-2" />
                {t("add_category")}
              </Button>
              {onCreateItem && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full sm:w-auto">
                      <Button
                        className="w-full sm:w-auto"
                        onClick={onCreateItem}
                        disabled={!isLeafCategory || false}
                      >
                        <CareIcon icon={createItemIcon} className="mr-2" />
                        {createItemLabel}
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {createItemTooltip && (
                    <TooltipContent>
                      <p>{createItemTooltip}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )}
            </div>
          </div>
        </div>

        {isLoadingCategories ? (
          <TableSkeleton count={5} />
        ) : isRootLevel && categories.length === 0 ? (
          <EmptyState
            icon={
              <CareIcon icon="l-folder-open" className="text-primary size-6" />
            }
            title={t("no_categories_found")}
            description={t("create_your_first_category")}
          />
        ) : (
          <>
            <div className="grid gap-2">
              {/* Show categories only at root level or in parent categories */}
              {categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onNavigate={onNavigate}
                  onEdit={handleEditCategory}
                />
              ))}
            </div>

            {/* Render children (like charge item list) only in leaf categories */}
            {isLeafCategory && children}
          </>
        )}

        {/* Category Form Sheet */}
        <ResourceCategoryForm
          facilityId={facilityId}
          categorySlug={editingCategory || undefined}
          parentCategorySlug={categorySlug || undefined}
          resourceType={resourceType}
          isOpen={isCategoryFormOpen}
          onClose={() => setIsCategoryFormOpen(false)}
          onSuccess={handleCategoryFormSuccess}
        />

        <Pagination totalCount={categoriesResponse?.count || 0} />
      </div>
    </TooltipProvider>
  );
}
