import { useQuery } from "@tanstack/react-query";
import { Coins, EllipsisVertical, FileIcon, Pencil } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";

import { getPermissions } from "@/common/Permissions";
import { CategoryMonetaryComponentsSheet } from "@/components/Common/CategoryMonetaryComponentsSheet";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import { usePermissions } from "@/context/PermissionContext";

import { RESULTS_PER_PAGE_LIMIT } from "@/common/constants";
import { ResourceCategoryForm } from "@/components/Common/ResourceCategoryForm";
import useFilters from "@/hooks/useFilters";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import {
  ResourceCategoryParent,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import query from "@/Utils/request/query";
import queryClient from "@/Utils/request/queryClient";

export interface BaseSearchableItem {
  id: string;
  slug: string;
  title?: string;
  name?: string;
  category?: ResourceCategoryParent;
}

function ItemCard<T extends BaseSearchableItem>({
  item,
  onItemClick,
}: {
  item: T;
  onItemClick: (item: T) => void;
}) {
  const displayTitle = item.title ?? item.name;
  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onItemClick(item)}
    >
      <CardContent className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
              <div className="p-1 rounded bg-green-100 text-green-600">
                <FileIcon className="h-6 w-4" />
              </div>
            </div>
            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {displayTitle}
              </h3>
              <span className="text-xs text-gray-500">
                {item.category?.title}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Category card component for displaying individual categories
function CategoryCard({
  category,
  onNavigate,
  onEdit,
  onSetMonetaryComponents,
  showMonetaryComponentsOption = false,
}: {
  category: ResourceCategoryRead;
  onNavigate: (slug: string) => void;
  onEdit: (category: ResourceCategoryRead) => void;
  onSetMonetaryComponents: (category: ResourceCategoryRead) => void;
  showMonetaryComponentsOption?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <Card
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onNavigate(category.slug)}
    >
      <CardContent className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="shrink-0">
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
            {showMonetaryComponentsOption ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <EllipsisVertical className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(category);
                    }}
                  >
                    <Pencil className="size-4" />
                    {t("edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetMonetaryComponents(category);
                    }}
                  >
                    <Coins className="size-4" />
                    {t("set_monetary_components")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(category);
                }}
              >
                <EllipsisVertical className="size-4" />
              </Button>
            )}
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

interface ItemSearchConfig<T extends BaseSearchableItem> {
  listItems: {
    queryFn: {
      path: string;
      method: "GET";
      TRes: { results: T[]; count: number };
    };
    pathParams?: Record<string, string>;
    queryParams?: Record<string, unknown>;
  };
  searchParamName?: string;
  queryKeyPrefix: string;
}

interface ResourceCategoryListProps<
  T extends BaseSearchableItem = BaseSearchableItem,
> {
  facilityId: string;
  categorySlug?: string;
  resourceType: ResourceCategoryResourceType;
  basePath: string;
  baseTitle: string;
  onNavigate: (slug: string) => void;
  onCreateItem?: () => void;
  createItemLabel?: string;
  createItemIcon?: "l-plus" | "l-file" | "l-folder-plus";
  allowCategoryCreate?: boolean;
  showMonetaryComponentsOption?: boolean;
  children?: React.ReactNode;
  itemSearchConfig?: ItemSearchConfig<T>;
}

export function ResourceCategoryList<
  T extends BaseSearchableItem = BaseSearchableItem,
>({
  facilityId,
  categorySlug,
  resourceType,
  basePath,
  baseTitle,
  onNavigate,
  onCreateItem,
  createItemLabel,
  createItemIcon = "l-plus",
  allowCategoryCreate = false,
  showMonetaryComponentsOption = false,
  children,
  itemSearchConfig,
}: ResourceCategoryListProps<T>) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const { facility } = useCurrentFacility();
  const { canWriteResourceCategory } = getPermissions(
    hasPermission,
    facility?.permissions ?? [],
  );
  // Form state
  const [isCategoryFormOpen, setIsCategoryFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<string | null>(
    null,
  );
  const [monetaryComponentsCategory, setMonetaryComponentsCategory] =
    React.useState<ResourceCategoryRead | null>(null);
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
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
      queryKey: [
        "resourceCategories",
        facilityId,
        categorySlug,
        qParams.searchCategory,
        qParams.page ?? "1",
      ],
      queryFn: query.debounced(resourceCategoryApi.list, {
        pathParams: { facilityId },
        queryParams: {
          resource_type: resourceType,
          parent: categorySlug || "",
          title: qParams.searchCategory,
          limit: resultsPerPage,
          offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        },
      }),
    },
  );

  const searchParamName = itemSearchConfig?.searchParamName || "title";
  const { data: itemsResponse, isLoading: isLoadingItems } = useQuery({
    queryKey: [
      itemSearchConfig?.queryKeyPrefix || "items",
      facilityId,
      qParams.searchCategory,
      qParams.page ?? 1,
    ],
    queryFn: query.debounced(itemSearchConfig!.listItems.queryFn, {
      pathParams: { facilityId, ...itemSearchConfig?.listItems.pathParams },
      queryParams: {
        [searchParamName]: qParams.searchCategory,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        ...itemSearchConfig?.listItems.queryParams,
      },
    }),
    enabled: !!itemSearchConfig && !!qParams.searchCategory,
  });

  const categories = categoriesResponse?.results || [];
  const items = (itemsResponse?.results || []) as T[];
  const isSearching = !!qParams.searchCategory;
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

  const handleSetMonetaryComponents = (category: ResourceCategoryRead) => {
    setMonetaryComponentsCategory(category);
  };

  return (
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
            {canWriteResourceCategory && (
              <Button
                variant="outline"
                onClick={handleCreateCategory}
                disabled={isLeafCategory && !allowCategoryCreate}
                hidden={isLeafCategory && !allowCategoryCreate}
                className="w-full sm:w-auto"
              >
                <CareIcon icon="l-folder-plus" className="mr-2" />
                {t("add_category")}
              </Button>
            )}
            {onCreateItem && (
              <div className="w-full sm:w-auto">
                <Button
                  className="w-full sm:w-auto"
                  onClick={onCreateItem}
                  disabled={!isLeafCategory || false}
                  hidden={!isLeafCategory}
                >
                  <CareIcon icon={createItemIcon} className="mr-2" />
                  {createItemLabel}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Section */}
      {!isLeafCategory && (
        <div className="relative w-full sm:w-auto mb-4">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <CareIcon icon="l-search" className="size-5" />
          </span>
          <Input
            placeholder={t("search")}
            value={qParams.searchCategory || ""}
            onChange={(e) =>
              updateQuery({ searchCategory: e.target.value || undefined })
            }
            className="w-full sm:w-auto pl-10"
          />
        </div>
      )}

      {isLoadingCategories || isLoadingItems ? (
        <TableSkeleton count={5} />
      ) : isRootLevel && categories.length === 0 && items.length === 0 ? (
        <EmptyState
          icon={
            <CareIcon icon="l-folder-open" className="text-primary size-6" />
          }
          title={
            qParams.searchCategory ? t("no_results") : t("no_categories_found")
          }
          description={
            qParams.searchCategory
              ? t("try_different_search_terms")
              : t("create_your_first_category")
          }
        />
      ) : (
        <>
          <div className="grid gap-2">
            {/* Show categories */}
            {categories.length > 0 && isSearching && (
              <h3 className="text-sm font-medium text-gray-500 mt-2">
                {t("categories")}
              </h3>
            )}
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onNavigate={onNavigate}
                onEdit={handleEditCategory}
                onSetMonetaryComponents={handleSetMonetaryComponents}
                showMonetaryComponentsOption={showMonetaryComponentsOption}
              />
            ))}

            {items.length > 0 && isSearching && itemSearchConfig && (
              <>
                <h3 className="text-sm font-medium text-gray-500 mt-4">
                  {t("items")}
                </h3>
                {items.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onItemClick={() => navigate(`${basePath}/${item.slug}`)}
                  />
                ))}
              </>
            )}
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

      {monetaryComponentsCategory && (
        <CategoryMonetaryComponentsSheet
          facilityId={facilityId}
          categorySlug={monetaryComponentsCategory.slug}
          categoryTitle={monetaryComponentsCategory.title}
          configuredMonetaryComponents={
            monetaryComponentsCategory.configured_monetary_components
          }
          isOpen={!!monetaryComponentsCategory}
          onClose={() => setMonetaryComponentsCategory(null)}
        />
      )}

      <Pagination
        totalCount={
          isSearching && itemSearchConfig
            ? itemsResponse?.count || 0
            : categoriesResponse?.count || 0
        }
      />
    </div>
  );
}
