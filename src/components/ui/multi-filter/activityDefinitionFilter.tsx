import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Folder,
  FolderOpen,
  Home,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import query from "@/Utils/request/query";
import {
  ResourceCategoryParent,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import {
  ActivityDefinitionReadSpec,
  Status,
} from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";

import FilterHeader from "./filterHeader";
import { FilterConfig, FilterMode, FilterValues } from "./utils/Utils";

interface CategoryBreadcrumb {
  slug: string;
  title: string;
}

export interface ActivityDefinitionFilterMeta {
  facilityId: string;
}

export interface ActivityDefinitionFilterValue {
  id: string;
  slug: string;
  title: string;
  category?: ResourceCategoryParent;
}

function ActivityDefinitionFilterDropdown({
  selectedDefinitions,
  onDefinitionsChange,
  facilityId,
  handleBack,
  mode = "single",
}: {
  selectedDefinitions: ActivityDefinitionFilterValue[];
  onDefinitionsChange: (definitions: ActivityDefinitionFilterValue[]) => void;
  facilityId: string;
  handleBack?: () => void;
  mode?: FilterMode;
}) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [breadcrumbsExpanded, setBreadcrumbsExpanded] = useState(false);

  // Fetch categories for current level
  const { data: categoriesResponse, isLoading: isLoadingCategories } = useQuery(
    {
      queryKey: [
        "resourceCategories",
        facilityId,
        ResourceCategoryResourceType.activity_definition,
        currentParent,
      ],
      queryFn: query(resourceCategoryApi.list, {
        pathParams: { facilityId },
        queryParams: {
          resource_type: ResourceCategoryResourceType.activity_definition,
          parent: currentParent || "",
          limit: 100,
        },
      }),
    },
  );

  // Fetch definitions for current category or search
  const { data: definitionsResponse, isLoading: isLoadingDefinitions } =
    useQuery({
      queryKey: [
        "activityDefinitions",
        facilityId,
        currentParent,
        searchQuery,
        "filter",
      ],
      queryFn: query.debounced(activityDefinitionApi.listActivityDefinition, {
        pathParams: { facilityId },
        queryParams: {
          category: currentParent || "",
          ...(searchQuery ? { title: searchQuery } : {}),
          limit: 100,
          status: Status.active,
        },
      }),
    });

  const categories = useMemo(
    () => categoriesResponse?.results || [],
    [categoriesResponse?.results],
  );

  const definitions = useMemo(
    () => definitionsResponse?.results || [],
    [definitionsResponse?.results],
  );

  const isLoading = isLoadingCategories || isLoadingDefinitions;

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
    setSearchQuery("");
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);

    if (index === -1) {
      setCurrentParent(undefined);
    } else {
      setCurrentParent(newBreadcrumbs[index].slug);
    }
    setBreadcrumbsExpanded(false);
    setSearchQuery("");
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    setBreadcrumbsExpanded(false);
    setSearchQuery("");
  };

  const handleDefinitionToggle = (definition: ActivityDefinitionReadSpec) => {
    const isSelected = selectedDefinitions.some((d) => d.id === definition.id);

    if (mode === "single") {
      // Single-select: replace selection
      if (isSelected) {
        onDefinitionsChange([]);
      } else {
        onDefinitionsChange([
          {
            id: definition.id,
            slug: definition.slug,
            title: definition.title,
            category: definition.category,
          },
        ]);
      }
    } else {
      // Multi-select: toggle
      if (isSelected) {
        onDefinitionsChange(
          selectedDefinitions.filter((d) => d.id !== definition.id),
        );
      } else {
        onDefinitionsChange([
          ...selectedDefinitions,
          {
            id: definition.id,
            slug: definition.slug,
            title: definition.title,
            category: definition.category,
          },
        ]);
      }
    }
  };

  const getDisplayPath = (definition: ActivityDefinitionReadSpec) => {
    const pathParts: string[] = [];
    if (definition.category) {
      let current: ResourceCategoryParent | undefined = definition.category;
      while (current) {
        if (current.title) {
          pathParts.unshift(current.title);
        }
        current = current.parent;
      }
    }

    if (pathParts.length === 0) return null;
    if (pathParts.length > 2) {
      return `${pathParts[0]} > ... > ${pathParts[pathParts.length - 1]}`;
    }
    return pathParts.join(" > ");
  };

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      if (breadcrumbs.length > 0) {
        handleBreadcrumbClick(breadcrumbs.length - 2);
      } else {
        handleBack?.();
      }
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div className="max-h-[40vh] overflow-y-auto">
      {/* Search Input */}
      <div className="p-3 border-b">
        <Input
          placeholder={t("search_activity_definition")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 text-sm"
        />
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="px-3 py-2 border-b bg-gray-50">
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
      )}

      <div className="p-2">
        {/* Selected Definitions */}
        {selectedDefinitions.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("selected")}
            </div>
            {selectedDefinitions.map((def) => (
              <DropdownMenuItem
                key={def.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onDefinitionsChange(
                    selectedDefinitions.filter((d) => d.id !== def.id),
                  );
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox
                  checked={true}
                  className="data-[state=checked]:border-primary-700 text-white"
                />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-sm truncate">{def.title}</span>
                  {def.category && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Folder className="size-2.5" />
                      {def.category.title}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <div className="border-b my-2" />
          </>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="p-3 space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        )}

        {/* Categories (only show when not searching) */}
        {!isLoading && !searchQuery && categories.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {currentParent ? t("subcategories") : t("categories")}
            </div>
            {categories.map((category) => (
              <DropdownMenuItem
                key={category.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleCategorySelect(category.slug, category.title);
                }}
                className="flex items-center justify-between px-2 py-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className="size-4 text-amber-500" />
                  <span className="text-sm">{category.title}</span>
                </div>
                <ChevronRight className="size-4 text-gray-400" />
              </DropdownMenuItem>
            ))}
            {definitions.length > 0 && <div className="border-b my-2" />}
          </>
        )}

        {/* Definitions */}
        {!isLoading && (searchQuery || currentParent) && (
          <>
            {definitions.length > 0 && (
              <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {t("activity_definitions")}
              </div>
            )}
            {definitions
              .filter(
                (def) => !selectedDefinitions.some((s) => s.id === def.id),
              )
              .map((definition) => {
                const displayPath = getDisplayPath(definition);
                return (
                  <DropdownMenuItem
                    key={definition.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleDefinitionToggle(definition);
                    }}
                    className="flex items-center gap-2 px-2 py-1.5 cursor-pointer"
                  >
                    <Checkbox checked={false} className="h-4 w-4" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm truncate">
                        {definition.title}
                      </span>
                      {searchQuery && displayPath && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Folder className="size-2.5" />
                          {displayPath}
                        </span>
                      )}
                    </div>
                  </DropdownMenuItem>
                );
              })}
          </>
        )}

        {/* Empty States */}
        {!isLoading &&
          !searchQuery &&
          !currentParent &&
          definitions.length === 0 &&
          categories.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <Folder className="size-8 mx-auto mb-2 opacity-50" />
              <div className="text-sm">{t("no_items_found")}</div>
            </div>
          )}

        {!isLoading && searchQuery && definitions.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <Search className="size-8 mx-auto mb-2 opacity-50" />
            <div className="text-sm">{t("no_matching_items_found")}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RenderActivityDefinitionFilter({
  filter,
  selectedDefinitions,
  onFilterChange,
  handleBack,
  facilityId,
}: {
  filter: FilterConfig;
  selectedDefinitions: ActivityDefinitionFilterValue[];
  onFilterChange: (filterKey: string, values: FilterValues) => void;
  handleBack?: () => void;
  facilityId: string;
}) {
  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <ActivityDefinitionFilterDropdown
        selectedDefinitions={selectedDefinitions}
        onDefinitionsChange={(definitions) => {
          onFilterChange(filter.key, definitions);
        }}
        facilityId={facilityId}
        handleBack={handleBack}
        mode={filter.mode}
      />
    </div>
  );
}

export function SelectedActivityDefinitionBadge({
  selected,
}: {
  selected: ActivityDefinitionFilterValue[];
}) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
      {selected.length === 1 ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-sm whitespace-nowrap truncate max-w-[150px]">
              {selected[0].title}
            </span>
          </TooltipTrigger>
          <TooltipContent>{selected[0].title}</TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger>
            <span className="text-sm whitespace-nowrap">
              {selected.length} {t("activity_definitions")}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {selected.map((def) => (
              <div key={def.id}>{def.title}</div>
            ))}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
