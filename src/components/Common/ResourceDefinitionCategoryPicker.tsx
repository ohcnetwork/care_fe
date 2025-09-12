import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Home,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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

import {
  ResourceCategoryParent,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import query from "@/Utils/request/query";
import { stringifyNestedObject } from "@/Utils/utils";

interface CategoryBreadcrumb {
  slug: string;
  title: string;
}

// Generic interface for any definition type
export interface BaseCategoryPickerDefinition {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category?: ResourceCategoryParent;
}

interface ResourceDefinitionCategoryPickerProps<T> {
  facilityId: string;
  value?: T | T[]; // definition object(s)
  onValueChange: (value: T | T[] | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowMultiple?: boolean;
  // Resource type specific props
  resourceType: ResourceCategoryResourceType;
  listDefinitions: {
    queryFn: {
      path: string;
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
      TRes: { results: T[] };
    };
    pathParams?: Record<string, string>;
    queryParams?: Record<string, unknown>;
  };
  // Optional translations
  translations: {
    searchPlaceholder: string;
    selectPlaceholder: string;
    noResultsFound: string;
    noItemsFound: string;
  };
  // Optional mapper function to transform API response to BaseDefinition
  mapper?: (item: T) => BaseCategoryPickerDefinition;
}

export function ResourceDefinitionCategoryPicker<T>({
  facilityId,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  resourceType,
  listDefinitions,
  translations,
  allowMultiple = false,
  mapper,
}: ResourceDefinitionCategoryPickerProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch categories for current level
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: ["resourceCategories", facilityId, resourceType, currentParent],
      queryFn: query(resourceCategoryApi.list, {
        pathParams: { facilityId },
        queryParams: {
          resource_type: resourceType,
          parent: currentParent || "",
          ordering: "title",
        },
      }),
    },
  );

  // Fetch definitions for current category
  const { data: definitionsResponse, isLoading: isLoadingDefinitions } =
    useQuery({
      queryKey: ["definitions", facilityId, currentParent, searchQuery],
      queryFn: query.debounced(listDefinitions.queryFn, {
        pathParams: { facilityId, ...listDefinitions.pathParams },
        queryParams: {
          category: currentParent || "",
          title: searchQuery,
          limit: 100,
          ...listDefinitions.queryParams,
        },
      }),
    });

  // Get selected definition from the list
  const categories = useMemo(
    () => categoriesResponse?.results || [],
    [categoriesResponse?.results],
  );

  const definitions = useMemo(() => {
    const results = definitionsResponse?.results || [];
    return mapper
      ? results.map(mapper)
      : (results as BaseCategoryPickerDefinition[]);
  }, [definitionsResponse?.results, mapper]);

  const selectedDefinition =
    value && !Array.isArray(value) ? mapper!(value) : null;

  const isLoading = isLoadingCategories || isLoadingDefinitions;

  // Reset search when navigating
  const resetSearch = () => setSearchQuery("");

  const handleCategorySelect = (
    categorySlug: string,
    categoryTitle: string,
  ) => {
    setBreadcrumbs((prev) => [
      ...prev,
      { slug: categorySlug, title: categoryTitle },
    ]);
    setCurrentParent(categorySlug);
    resetSearch();
  };

  const handleDefinitionSelect = (definition: BaseCategoryPickerDefinition) => {
    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      onValueChange([...currentValues, definition] as T[]);
    } else {
      onValueChange(definition as T);
    }
    setOpen(false);
    resetSearch();
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

  const handleRemoveDefinition = (def: BaseCategoryPickerDefinition) => {
    if (!Array.isArray(value)) return;
    onValueChange(value.filter((d: T) => mapper!(d).slug !== def.slug));
  };

  const getFullPath = (definition: BaseCategoryPickerDefinition) => {
    const pathParts = [];
    if (definition.category) {
      let current: ResourceCategoryParent | undefined = definition.category;
      while (current) {
        if (current.title) {
          pathParts.unshift(current.title);
        }
        current = current.parent;
      }
    }
    pathParts.push(definition.title);
    return pathParts.join(" > ");
  };

  const getDisplayValue = () => {
    if (!selectedDefinition || allowMultiple) {
      return (
        <span className="text-gray-500">
          {placeholder || t(translations.selectPlaceholder) || t("select_item")}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1">
        <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">{getFullPath(selectedDefinition)}</span>
      </div>
    );
  };

  const getCurrentLevelTitle = () => {
    if (breadcrumbs.length === 0) return t("root");
    return breadcrumbs[breadcrumbs.length - 1]?.title || t("root");
  };

  useEffect(() => {
    if (searchQuery) {
      setBreadcrumbs([]);
      setCurrentParent(undefined);
    }
  }, [searchQuery]);

  return (
    <div className="space-y-2">
      <Popover
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          resetSearch();
          setBreadcrumbs([]);
          setCurrentParent(undefined);
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "justify-between h-10 min-h-10 px-3 py-2 w-full",
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
                    placeholder={t(translations.searchPlaceholder)}
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
                    </div>
                  ) : searchQuery ? (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">
                        {currentParent
                          ? t(translations.noResultsFound) ||
                            t("no_results_found_for")
                          : t("no_categories_found_for")}{" "}
                        "{searchQuery}"
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">
                        {currentParent
                          ? t(translations.noItemsFound) || t("no_items_found")
                          : t("no_categories_found")}
                      </div>
                    </div>
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {/* When not in a category */}
                  {!currentParent && !searchQuery && (
                    <>
                      {categories
                        .filter(
                          (category) =>
                            !searchQuery ||
                            category.title
                              .toLowerCase()
                              .includes(searchQuery.toLowerCase()) ||
                            category.description
                              ?.toLowerCase()
                              .includes(searchQuery.toLowerCase()),
                        )
                        .map((category) => (
                          <CommandItem
                            key={category.id}
                            value={category.title}
                            onSelect={() =>
                              handleCategorySelect(
                                category.slug,
                                category.title,
                              )
                            }
                            className={cn(
                              "flex items-center justify-between px-3 py-3 cursor-pointer",
                              "hover:bg-gray-50 hover:text-gray-900",
                              "transition-colors duration-150",
                              "border-b border-gray-200",
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="flex-shrink-0">
                                <FolderOpen className="h-5 w-5 text-gray-500" />
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
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          </CommandItem>
                        ))}
                    </>
                  )}

                  {/* When in a category */}
                  {currentParent && !searchQuery && (
                    <>
                      {/* Show subcategories first if not searching */}
                      {categories.map((category) => (
                        <CommandItem
                          key={category.id}
                          value={category.title}
                          onSelect={() =>
                            handleCategorySelect(category.slug, category.title)
                          }
                          className={cn(
                            "flex items-center justify-between px-3 py-3 cursor-pointer",
                            "hover:bg-gray-50 hover:text-gray-900",
                            "transition-colors duration-150",
                            "border-b border-gray-200",
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                              <FolderOpen className="h-5 w-5 text-gray-500" />
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
                          <ChevronRight className="h-4 w-4 text-gray-500" />
                        </CommandItem>
                      ))}
                    </>
                  )}
                  {/* Show definitions (filtered by search if searching) */}
                  {(searchQuery || currentParent) &&
                    definitions.map((definition) => (
                      <CommandItem
                        key={definition.id}
                        value={definition.title}
                        onSelect={() => handleDefinitionSelect(definition)}
                        className={cn(
                          "flex items-center justify-between px-3 py-3 cursor-pointer",
                          "hover:bg-gray-50 hover:text-gray-900",
                          "transition-colors duration-150",
                          "border-b border-gray-200 last:border-b-0",
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {definition.title}
                            </div>
                            {definition.description && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {definition.description}
                              </div>
                            )}
                            {searchQuery && definition.category && (
                              <div className="text-xs text-gray-500 truncate mt-0.5">
                                {stringifyNestedObject(
                                  {
                                    name: definition.category.title,
                                    parent: definition.category.parent,
                                  },
                                  " -> ",
                                  true,
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        {value &&
                          !Array.isArray(value) &&
                          mapper!(value).slug === definition.slug && (
                            <Check className="h-4 w-4 text-gray-700" />
                          )}
                      </CommandItem>
                    ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
      {allowMultiple && (
        <div className="space-y-2">
          {Array.isArray(value) && value.length > 0 && (
            <div className="flex flex-col gap-2">
              {value.map(mapper!).map((def) => {
                if (!def) return null;
                return (
                  <div
                    key={def.id}
                    className="flex items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Folder className="h-4 w-4 text-gray-500 flex-shrink-0" />
                      <span className="truncate">{getFullPath(def)}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-gray-200"
                      onClick={() => handleRemoveDefinition(def)}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">{t("remove")}</span>
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
