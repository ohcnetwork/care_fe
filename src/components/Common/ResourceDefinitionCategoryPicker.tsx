import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Folder,
  FolderOpen,
  Home,
  MoreHorizontal,
  Search,
  Star,
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
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import useBreakpoints from "@/hooks/useBreakpoints";
import {
  ResourceCategoryParent,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import { ProductKnowledgeType } from "@/types/inventory/productKnowledge/productKnowledge";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

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
  product_type?: ProductKnowledgeType;
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
  searchParamName?: string;
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
  // Favorites functionality
  enableFavorites?: boolean;
  favoritesConfig?: {
    listFavorites: {
      queryFn: {
        path: string;
        method: "GET";
        TRes: T[];
      };
    };
    addFavorite: {
      queryFn: {
        path: string;
        method: "POST";
        TRes: T;
      };
    };
    removeFavorite: {
      queryFn: {
        path: string;
        method: "POST" | "DELETE";
        TRes: T;
      };
    };
  };
  ref?: React.Ref<HTMLButtonElement>;
  hideClearButton?: boolean;
}

export function ResourceDefinitionCategoryPicker<T>({
  facilityId,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  resourceType,
  searchParamName = "title",
  listDefinitions,
  translations,
  allowMultiple = false,
  mapper = (item: T) => item as BaseCategoryPickerDefinition,
  enableFavorites = false,
  favoritesConfig,
  ref,
  hideClearButton = false,
}: ResourceDefinitionCategoryPickerProps<T>) {
  const shouldHideClearButton = allowMultiple || hideClearButton;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("search");
  const [favSubTab, setFavSubTab] = useState("recent");
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbsExpanded, setBreadcrumbsExpanded] = useState(false);

  // Fetch categories for current level
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: ["resourceCategories", facilityId, resourceType, currentParent],
      queryFn: query(resourceCategoryApi.list, {
        pathParams: { facilityId },
        queryParams: {
          resource_type: resourceType,
          parent: currentParent || "",
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
          ...(searchQuery ? { [searchParamName]: searchQuery } : {}),
          limit: 100,
          ...listDefinitions.queryParams,
        },
      }),
    });

  const { data: favoritesResponse } = useQuery({
    queryKey: ["favorites", resourceType, facilityId],
    queryFn: favoritesConfig
      ? query(favoritesConfig.listFavorites.queryFn, {
          queryParams: {
            facility: facilityId,
            favorite_list: "favorites",
          },
        })
      : () => Promise.resolve([]),

    enabled: enableFavorites && !!favoritesConfig,
  });

  const { data: recentResponse } = useQuery({
    queryKey: ["recent", resourceType, facilityId],
    queryFn: favoritesConfig
      ? query(favoritesConfig.listFavorites.queryFn, {
          queryParams: {
            facility: facilityId,
            favorite_list: "recent",
          },
        })
      : () => Promise.resolve([]),
    enabled: enableFavorites && !!favoritesConfig,
  });

  const addFavoriteMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (!favoritesConfig) throw new Error("Favorites config not provided");
      const mutateFn = mutate(favoritesConfig!.addFavorite.queryFn, {
        pathParams: { slug },
        queryParams: { facility: facilityId },
      });
      return mutateFn({ favorite_list: "favorites" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["favorites", resourceType, facilityId],
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (!favoritesConfig) throw new Error("Favorites config not provided");
      const mutateFn = mutate(favoritesConfig!.removeFavorite.queryFn, {
        pathParams: { slug },
        queryParams: { facility: facilityId },
      });
      return mutateFn({ favorite_list: "favorites" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["favorites", resourceType, facilityId],
      });
    },
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

  const favorites = useMemo(() => {
    if (!enableFavorites || !favoritesResponse) return [];

    const favoritesArray = Array.isArray(favoritesResponse)
      ? favoritesResponse
      : (favoritesResponse as { results?: T[] }).results || [];

    return mapper
      ? favoritesArray.map(mapper)
      : (favoritesArray as BaseCategoryPickerDefinition[]);
  }, [favoritesResponse, mapper, enableFavorites]);

  const recentlyUsed = useMemo(() => {
    if (!enableFavorites || !recentResponse) return [];

    const recentArray = Array.isArray(recentResponse)
      ? recentResponse
      : (recentResponse as { results?: T[] }).results || [];

    return mapper
      ? recentArray.map(mapper)
      : (recentArray as BaseCategoryPickerDefinition[]);
  }, [recentResponse, mapper, enableFavorites]);

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
    setBreadcrumbsExpanded(false);
    resetSearch();
  };

  const addToRecentMutation = useMutation({
    mutationFn: async (slug: string) => {
      if (!enableFavorites || !favoritesConfig) return null;

      const mutateFn = mutate(favoritesConfig.addFavorite.queryFn, {
        pathParams: { slug },
        queryParams: { facility: facilityId },
      });
      return mutateFn({ favorite_list: "recent" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["recent", resourceType, facilityId],
      });
    },
  });

  const handleDefinitionSelect = (definition: BaseCategoryPickerDefinition) => {
    if (enableFavorites && favoritesConfig) {
      addToRecentMutation.mutate(definition.slug);
    }

    if (allowMultiple) {
      const currentValues = Array.isArray(value) ? value : value ? [value] : [];
      const isSelected = currentValues.some(
        (v: T) => mapper!(v).slug === definition.slug,
      );

      if (isSelected) {
        onValueChange(
          currentValues.filter(
            (v: T) => mapper!(v).slug !== definition.slug,
          ) as T[],
        );
      } else {
        onValueChange([...currentValues, definition] as T[]);
      }
    } else {
      onValueChange(definition as T);
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
    setBreadcrumbsExpanded(false);
    resetSearch();
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    setBreadcrumbsExpanded(false);
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

  const handleToggleFavorite = (definition: BaseCategoryPickerDefinition) => {
    if (!enableFavorites || !favoritesConfig) return;

    const isFavorited = favorites.some(
      (f: BaseCategoryPickerDefinition) => f.slug === definition.slug,
    );

    if (isFavorited) {
      removeFavoriteMutation.mutate(definition.slug);
    } else {
      addFavoriteMutation.mutate(definition.slug);
    }
  };

  const getDisplayPath = (definition: BaseCategoryPickerDefinition) => {
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

    return (
      <div className="flex items-center gap-1">
        <Folder className="size-2.5 text-gray-500 flex-shrink-0" />
        <span className="truncate">
          {pathParts.length === 0
            ? definition.title || t("select_category")
            : pathParts.length > 2
              ? `${pathParts[0]} > ... > ${pathParts[pathParts.length - 1]}`
              : pathParts.join(" > ")}
        </span>
      </div>
    );
  };

  const getDisplayValue = () => {
    if (!selectedDefinition || allowMultiple) {
      return (
        <span className="text-gray-500 truncate">
          {placeholder || t(translations.selectPlaceholder) || t("select_item")}
        </span>
      );
    }

    return (
      <div className="flex items-center gap-1 truncate">
        <span className="truncate">{selectedDefinition.title}</span>
      </div>
    );
  };

  const getCurrentLevelTitle = () => {
    if (breadcrumbs.length === 0) return t("root");
    return breadcrumbs[breadcrumbs.length - 1]?.title || t("root");
  };

  const renderSearchInput = () => (
    <div className="px-3 border-b">
      <CommandInput
        placeholder={t(translations.searchPlaceholder)}
        value={searchQuery}
        onValueChange={setSearchQuery}
        className="h-9 border-0 focus:ring-0 text-base md:text-sm"
        autoFocus
      />
    </div>
  );

  const renderBreadcrumbs = () =>
    breadcrumbs.length > 0 && (
      <div className="px-3 py-2 border-b bg-gray-100">
        <div className="flex items-center gap-1 text-xs overflow-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackToRoot}
            className="h-6 px-2 text-xs hover:bg-white"
          >
            <Home className="size-3 mr-1" />
            {t("root")}
          </Button>
          {breadcrumbs.length <= 2 || breadcrumbsExpanded ? (
            breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.slug} className="flex items-center">
                <ChevronRight className="size-3 mx-1 text-gray-500" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleBreadcrumbClick(index)}
                  className="h-6 px-2 text-xs hover:bg-white"
                >
                  {breadcrumb.title}
                </Button>
              </div>
            ))
          ) : (
            <>
              <ChevronRight className="size-3 mx-1 text-gray-500" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBreadcrumbsExpanded(true)}
                className="h-6 px-2 text-xs hover:bg-white"
              >
                <MoreHorizontal className="size-3" />
              </Button>
              <ChevronRight className="size-3 mx-1 text-gray-500" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBreadcrumbClick(breadcrumbs.length - 1)}
                className="h-6 px-2 text-xs hover:bg-white"
              >
                {breadcrumbs[breadcrumbs.length - 1].title}
              </Button>
            </>
          )}
        </div>
      </div>
    );

  const renderEmptyState = () => (
    <CommandEmpty>
      {isLoading ? (
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-4 rounded" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="size-4 rounded" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        </div>
      ) : searchQuery ? (
        <div className="p-6 text-center text-gray-500">
          <Search className="size-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">
            {currentParent
              ? t(translations.noResultsFound) || t("no_results_found_for")
              : t("no_categories_found_for")}{" "}
            "{searchQuery}"
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-gray-500">
          <Folder className="size-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">
            {currentParent
              ? t(translations.noItemsFound) || t("no_items_found")
              : t("no_categories_found")}
          </div>
        </div>
      )}
    </CommandEmpty>
  );

  const renderCategories = () =>
    !currentParent &&
    !searchQuery && (
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
                handleCategorySelect(category.slug, category.title)
              }
              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex-shrink-0">
                  <FolderOpen className="size-4.5 text-gray-500" />
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
              <ChevronRight className="size-4 text-gray-500" />
            </CommandItem>
          ))}
      </>
    );

  const renderSubcategories = () =>
    currentParent &&
    !searchQuery && (
      <>
        {categories.map((category) => (
          <CommandItem
            key={category.id}
            value={category.title}
            onSelect={() => handleCategorySelect(category.slug, category.title)}
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <FolderOpen className="size-4.5 text-gray-500" />
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
            <ChevronRight className="size-4 text-gray-500" />
          </CommandItem>
        ))}
      </>
    );

  const renderDefinitions = () =>
    (searchQuery || currentParent) &&
    definitions.map((definition) => (
      <CommandItem
        key={definition.id}
        value={`${definition.title}-${definition.id}`}
        onSelect={() => handleDefinitionSelect(definition)}
        className={cn(
          "flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200 last:border-b-0",
          searchQuery && definition.category && "py-1",
        )}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm break flex items-center justify-between gap-2">
              <span className="break-all">{definition.title}</span>
            </div>
            {definition.description && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {definition.description}
              </div>
            )}
            {searchQuery && definition.category && (
              <div className="text-xs text-gray-500 truncate mt-0.5">
                {getDisplayPath(definition)}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {enableFavorites && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFavorite(definition);
              }}
            >
              <Star
                className={cn(
                  "size-4",
                  favorites.some(
                    (f: BaseCategoryPickerDefinition) =>
                      f.slug === definition.slug,
                  ) && "fill-current",
                )}
              />
            </button>
          )}
          {value &&
            (Array.isArray(value)
              ? value.some((v: T) => mapper!(v).slug === definition.slug)
              : mapper!(value).slug === definition.slug) && (
              <Check className="size-4 text-gray-700" />
            )}
        </div>
      </CommandItem>
    ));

  const renderRecentItems = () => (
    <div
      className={cn(
        "overflow-auto min-h-0",
        isMobile ? "max-h-full" : "max-h-[40vh]",
      )}
    >
      {recentlyUsed.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Clock className="size-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">{t("no_recent_items")}</div>
          <div className="text-xs mt-1">{t("items_will_appear_here")}</div>
        </div>
      ) : (
        <div className="p-2">
          {recentlyUsed.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between px-3 py-1 border-b rounded-md hover:bg-gray-50  cursor-pointer last:border-b-0"
              onClick={() => handleDefinitionSelect(item)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm break flex items-center justify-between gap-2">
                  <span className="break-all">{item.title}</span>
                </div>
                {item.category && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {getDisplayPath(item)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderFavoriteItems = () => (
    <div
      className={cn(
        "overflow-auto min-h-0",
        isMobile ? "max-h-full" : "max-h-[40vh]",
      )}
    >
      {favorites.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <Star className="size-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">{t("no_favorites_yet")}</div>
          <div className="text-xs mt-1">{t("click_star_to_add")}</div>
        </div>
      ) : (
        <div className="p-2">
          {favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between px-3 py-1 rounded-md border-b hover:bg-gray-50 cursor-pointer last:border-b-0"
              onClick={() => handleDefinitionSelect(favorite)}
            >
              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm truncate">
                  {favorite.title}
                </div>
                {favorite.category && (
                  <div className="text-xs text-gray-500 truncate mt-0.5">
                    {getDisplayPath(favorite)}
                  </div>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleFavorite(favorite);
                }}
                className="text-gray-500"
              >
                <Star className="size-4 fill-current" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMainContent = () => (
    <Command className={cn("border-0", isMobile ? "h-full" : "max-h-[40vh]")}>
      {renderSearchInput()}
      {renderBreadcrumbs()}
      <CommandList
        className={cn(isMobile ? "max-h-full h-[40vh]" : "max-h-[40vh]")}
      >
        {renderEmptyState()}
        <CommandGroup>
          {renderCategories()}
          {renderSubcategories()}
          {renderDefinitions()}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  return (
    <div className="space-y-2">
      {isMobile ? (
        <Drawer
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            resetSearch();
            setBreadcrumbs([]);
            setCurrentParent(undefined);
            setBreadcrumbsExpanded(false);
            setActiveTab("search");
          }}
        >
          <div className="flex relative">
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "justify-between px-3 py-2 w-full shadow-xs border border-gray-300 font-medium",
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
                    "size-4 shrink-0 opacity-50 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </DrawerTrigger>
            {value && !shouldHideClearButton && (
              <Button
                variant="outline"
                onClick={handleClearSelection}
                className="rounded-l-none -ml-2 shadow-none text-gray-400 border-gray-300"
              >
                <X />
                <span className="sr-only">{t("clear_selection")}</span>
              </Button>
            )}
          </div>

          <DrawerContent className="flex flex-col max-h-[85vh]">
            <DrawerTitle className="sr-only">
              {t(translations.selectPlaceholder) || t("select_item")}
            </DrawerTitle>
            <div className="px-4 py-3 border-b flex-shrink-0">
              {!isMobile && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Home className="size-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">
                      {getCurrentLevelTitle()}
                    </span>
                    {breadcrumbs.length > 0 && (
                      <Badge variant="secondary" className="text-xs truncate">
                        {t("level")} {breadcrumbs.length + 1}
                      </Badge>
                    )}
                  </div>
                  {value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSelection}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="mr-1" />
                      {t("clear")}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {enableFavorites ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="flex flex-col flex-1 min-h-0"
              >
                <div className="px-4 py-2 border-b flex-shrink-0">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="search">{t("search")}</TabsTrigger>
                    <TabsTrigger value="recent">{t("recent")}</TabsTrigger>
                    <TabsTrigger value="favorites">
                      {t("favorites")} ({favorites.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden">
                  <TabsContent value="search" className="h-full mt-0" autoFocus>
                    {renderMainContent()}
                  </TabsContent>
                  <TabsContent value="recent" className="h-full mt-0">
                    {renderRecentItems()}
                  </TabsContent>
                  <TabsContent value="favorites" className="h-full mt-0">
                    {renderFavoriteItems()}
                  </TabsContent>
                </div>
              </Tabs>
            ) : (
              <div className="flex-1 min-h-0">{renderMainContent()}</div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover
          open={open}
          onOpenChange={(newOpen) => {
            setOpen(newOpen);
            resetSearch();
            setBreadcrumbs([]);
            setCurrentParent(undefined);
            setBreadcrumbsExpanded(false);
            setFavSubTab("recent");
          }}
          modal
        >
          <div className="flex relative">
            <PopoverTrigger asChild ref={ref}>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn(
                  "justify-between px-3 py-2 w-full shadow-xs border-gray-300",
                  "hover:bg-gray-50 hover:text-gray-900",
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
                    "size-4 shrink-0 opacity-50 transition-transform duration-200",
                    open && "rotate-180",
                  )}
                />
              </Button>
            </PopoverTrigger>
            {value && !shouldHideClearButton && (
              <Button
                variant="outline"
                onClick={handleClearSelection}
                className="rounded-l-none -ml-2 shadow-none text-gray-400 border-gray-300"
              >
                <X />
                <span className="sr-only">{t("clear_selection")}</span>
              </Button>
            )}
          </div>

          <PopoverContent
            className={cn(
              "p-0 shadow-lg border-0 -w-[var(--radix-popover-trigger-width)] sm:max-w-[80vw]",
              enableFavorites ? "md:max-w-[70vw]" : "min-w-[420px]",
            )}
            align="start"
            sideOffset={4}
          >
            <div
              className={cn("flex", enableFavorites ? "flex-row" : "flex-col")}
            >
              {/* Main content */}
              <div
                className={cn(
                  "flex flex-col min-w-0",
                  enableFavorites ? "flex-1 min-w-72 max-w-96" : "w-full",
                )}
              >
                {/* Header with current location */}
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Home className="size-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-600">
                        {getCurrentLevelTitle()}
                      </span>
                    </div>
                    {value && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelection}
                        className="h-4 px-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <X className="mr-1" />
                        {t("clear")}
                      </Button>
                    )}
                  </div>
                </div>

                {renderMainContent()}
              </div>

              {/* Favorites panel */}
              {enableFavorites && (
                <div className="max-w-72 w-full border-l border-gray-200">
                  <div className="px-4 py-1 border-b bg-gray-50">
                    <Tabs value={favSubTab} onValueChange={setFavSubTab}>
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="recent">{t("recent")}</TabsTrigger>
                        <TabsTrigger value="favorites">
                          {t("favorites")} ({favorites.length})
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>

                  <div className="overflow-auto min-h-0 max-h-[40vh]">
                    {favSubTab === "recent" ? (
                      recentlyUsed.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <Clock className="size-8 mx-auto mb-2 opacity-50" />
                          <div className="text-sm">{t("no_recent_items")}</div>
                          <div className="text-xs mt-1">
                            {t("items_will_appear_here")}
                          </div>
                        </div>
                      ) : (
                        <div className="p-2">
                          {recentlyUsed.map(
                            (item: BaseCategoryPickerDefinition) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between px-3 py-1 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                                onClick={() => handleDefinitionSelect(item)}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-sm flex items-center justify-between gap-2">
                                    <span className="break-all">
                                      {item.title}
                                    </span>
                                  </div>
                                  {item.category && (
                                    <div className="text-xs text-gray-500 truncate mt-0.5">
                                      {getDisplayPath(item)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      )
                    ) : favorites.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Star className="size-8 mx-auto mb-2 opacity-50" />
                        <div className="text-sm">{t("no_favorites_yet")}</div>
                        <div className="text-xs mt-1">
                          {t("click_star_to_add")}
                        </div>
                      </div>
                    ) : (
                      <div className="p-2">
                        {favorites.map(
                          (favorite: BaseCategoryPickerDefinition) => (
                            <div
                              key={favorite.id}
                              className="flex items-center justify-between px-3 py-1 border-b last:border-0 hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleDefinitionSelect(favorite)}
                            >
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-sm truncate">
                                  {favorite.title}
                                </div>
                                {favorite.category && (
                                  <div className="text-xs text-gray-500 truncate mt-0.5">
                                    {getDisplayPath(favorite)}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleFavorite(favorite);
                                }}
                                className="text-gray-500"
                              >
                                <Star className="size-4 fill-current" />
                              </button>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      )}
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
                      {getDisplayPath(def)}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0 hover:bg-gray-200"
                      onClick={() => handleRemoveDefinition(def)}
                    >
                      <X className="size-4" />
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
