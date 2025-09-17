import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Home,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import query from "@/Utils/request/query";
import {
  ResourceCategoryParent,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";

/**
 * ResourceCategoryPicker - A reusable component for selecting resource categories with hierarchical navigation
 *
 * Features:
 * - Hierarchical navigation through category levels
 * - Breadcrumb navigation for easy navigation back to parent categories
 * - Search functionality within categories
 * - Support for different resource types (charge_item_definition, product_knowledge, etc.)
 * - Clear selection option
 * - Displays full category path in the trigger button
 *
 * Usage example:
 * ```tsx
 * <ResourceCategoryPicker
 *   facilityId="facility-123"
 *   resourceType={ResourceCategoryResourceType.charge_item_definition}
 *   value={selectedCategorySlug}
 *   onValueChange={setSelectedCategorySlug}
 *   placeholder="Select a category"
 *   className="w-full"
 * />
 * ```
 */
interface ResourceCategoryPickerProps {
  facilityId: string;
  resourceType: ResourceCategoryResourceType;
  value?: string; // category slug
  onValueChange: (categorySlug: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface CategoryBreadcrumb {
  slug: string;
  title: string;
}

export function ResourceCategoryPicker({
  facilityId,
  resourceType,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
}: ResourceCategoryPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories for current level
  const {
    data: categoriesResponse,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["resourceCategories", facilityId, resourceType, currentParent],
    queryFn: query(resourceCategoryApi.list, {
      pathParams: { facilityId },
      queryParams: {
        resource_type: resourceType,
        parent: currentParent || "",
        ordering: "title",
      },
    }),
  });

  const categories = useMemo(
    () => categoriesResponse?.results || [],
    [categoriesResponse?.results],
  );

  // Fetch selected category details for display
  const { data: selectedCategory, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["resourceCategory", facilityId, value],
    queryFn: query(resourceCategoryApi.get, {
      pathParams: { facilityId, slug: value! },
    }),
    enabled: !!value,
  });

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  // Reset search when navigating
  const resetSearch = () => setSearchQuery("");

  const handleCategorySelect = (category: ResourceCategoryRead) => {
    if (category.has_children) {
      // Navigate to subcategory
      setBreadcrumbs((prev) => [
        ...prev,
        { slug: category.slug, title: category.title },
      ]);
      setCurrentParent(category.slug);
      resetSearch();
    } else {
      // Select leaf category
      onValueChange(category.slug);
      setOpen(false);
      resetSearch();
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);

    if (index === -1) {
      // Root level
      setCurrentParent(undefined);
    } else {
      setCurrentParent(newBreadcrumbs[index].slug);
    }
    resetSearch();
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    resetSearch();
  };

  const handleClearSelection = () => {
    onValueChange(undefined);
    setOpen(false);
    resetSearch();
  };

  const getDisplayValue = () => {
    if (isLoadingSelected) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-gray-500">Loading...</span>
        </div>
      );
    }

    if (!selectedCategory) {
      return (
        <span className="text-gray-500">
          {placeholder || t("select_category")}
        </span>
      );
    }

    // Build full path for display with better visual hierarchy
    const pathParts = [];
    if (selectedCategory.parent) {
      let current: ResourceCategoryParent | undefined = selectedCategory.parent;
      while (current) {
        if (current.title) {
          pathParts.unshift(current.title);
        }
        current = current.parent;
      }
    }
    if (selectedCategory.title) {
      pathParts.push(selectedCategory.title);
    }

    return (
      <div className="flex items-center gap-1">
        <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">
          {pathParts.length === 0
            ? selectedCategory.title || t("select_category")
            : pathParts.length > 2
              ? `${pathParts[0]} > ... > ${pathParts[pathParts.length - 1]}`
              : pathParts.join(" > ")}
        </span>
      </div>
    );
  };

  const getCurrentLevelTitle = () => {
    if (breadcrumbs.length === 0) return t("root");
    return breadcrumbs[breadcrumbs.length - 1]?.title || t("root");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          resetSearch();
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between h-10 min-h-10 px-3 py-2",
            "hover:bg-gray-50 hover:text-gray-900",
            "focus:ring-2 focus:ring-gray-300 focus:ring-offset-2",
            "transition-all duration-200",
            disabled && "opacity-50 cursor-not-allowed",
            className,
          )}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {getDisplayValue()}
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 opacity-50 transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[420px] p-0 shadow-lg border-0"
        align="start"
        sideOffset={4}
      >
        <div className="flex flex-col">
          {/* Header with current location */}
          <div className="px-4 py-3 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-600">
                  {getCurrentLevelTitle()}
                </span>
                {breadcrumbs.length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {t("level")} {breadcrumbs.length + 1}
                  </Badge>
                )}
              </div>
              {value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  <X className="h-3 w-3 mr-1" />
                  {t("clear")}
                </Button>
              )}
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          {breadcrumbs.length > 0 && (
            <div className="px-4 py-2 border-b bg-gray-100">
              <div className="flex items-center gap-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToRoot}
                  className="h-6 px-2 text-xs hover:bg-white"
                >
                  <Home className="h-3 w-3 mr-1" />
                  {t("root")}
                </Button>
                {breadcrumbs.map((breadcrumb, index) => (
                  <div key={breadcrumb.slug} className="flex items-center">
                    <ChevronRight className="h-3 w-3 mx-1 text-gray-500" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      className="h-6 px-2 text-xs hover:bg-white"
                    >
                      {breadcrumb.title}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Command className="border-0">
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                <CommandInput
                  placeholder={t("search_categories")}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="pl-9 h-9 border-0 focus:ring-0"
                />
              </div>
            </div>

            <CommandList className="max-h-[300px]">
              <CommandEmpty>
                {isLoading ? (
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-4 w-4 rounded" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-4 w-4/5" />
                      </div>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-500 text-sm">
                      {t("failed_to_load_categories")}
                    </div>
                  </div>
                ) : searchQuery ? (
                  <div className="p-6 text-center text-gray-500">
                    <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">
                      {t("no_categories_found_for")} "{searchQuery}"
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500">
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t("no_categories_found")}</div>
                  </div>
                )}
              </CommandEmpty>

              <CommandGroup>
                {filteredCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.title}
                    onSelect={() => handleCategorySelect(category)}
                    className={cn(
                      "flex items-center justify-between px-3 py-3 cursor-pointer",
                      "hover:bg-gray-50 hover:text-gray-900",
                      "transition-colors duration-150",
                      "border-b border-gray-200 last:border-b-0",
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="flex-shrink-0">
                        {category.has_children ? (
                          <FolderOpen className="h-5 w-5 text-gray-500" />
                        ) : (
                          <Folder className="h-5 w-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {category.title}
                        </div>
                        {category.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {category.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {value === category.slug && (
                        <Check className="h-4 w-4 text-gray-700" />
                      )}
                      {category.has_children && (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </PopoverContent>
    </Popover>
  );
}
