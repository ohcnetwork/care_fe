import { useQuery } from "@tanstack/react-query";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  Home,
  Loader2,
  Plus,
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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";

import { ChargeItemDefinitionDrawer } from "@/components/Common/ChargeItemDefinitionDrawer";
import {
  ResourceCategoryParent,
  ResourceCategoryRead,
  ResourceCategoryResourceType,
  ResourceCategorySubType,
} from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import { ChargeItemDefinitionRead } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import query from "@/Utils/request/query";

/**
 * ChargeItemDefinitionPicker - A unified component for selecting charge item definitions with hierarchical category navigation
 *
 * Features:
 * - Hierarchical navigation through resource categories
 * - Direct charge item definition selection from leaf categories
 * - Breadcrumb navigation for easy navigation back to parent categories
 * - Search functionality within categories and definitions
 * - Clear selection option
 * - Displays full category path and definition title in the trigger button
 *
 * Usage example:
 * ```tsx
 * <ChargeItemDefinitionPicker
 *   facilityId="facility-123"
 *   resourceSubType={ResourceCategorySubType.location}
 *   value={selectedDefinitionSlug}
 *   onValueChange={setSelectedDefinitionSlug}
 *   placeholder="Select a charge item definition"
 *   className="w-full"
 * />
 * ```
 */
interface ChargeItemDefinitionPickerProps {
  facilityId: string;
  resourceSubType?: ResourceCategorySubType;
  value?: string; // charge item definition slug
  onValueChange: (definitionSlug: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showCreateButton?: boolean;
  showCopyButton?: boolean;
  categorySlug?: string;
}

interface CategoryBreadcrumb {
  slug: string;
  title: string;
}

type ViewMode = "categories" | "definitions";

export function ChargeItemDefinitionPicker({
  facilityId,
  resourceSubType,
  value,
  onValueChange,
  placeholder,
  disabled = false,
  className,
  showCreateButton = false,
  showCopyButton = false,
  categorySlug,
}: ChargeItemDefinitionPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState<CategoryBreadcrumb[]>([]);
  const [currentParent, setCurrentParent] = useState<string | undefined>(
    undefined,
  );
  const [currentCategorySlug, setCurrentCategorySlug] = useState<
    string | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<ViewMode>("categories");
  const [searchQuery, setSearchQuery] = useState("");
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [copyDrawerOpen, setCopyDrawerOpen] = useState(false);
  const [copySelectionOpen, setCopySelectionOpen] = useState(false);
  const [selectedDefinitionForCopy, setSelectedDefinitionForCopy] = useState<
    ChargeItemDefinitionRead | undefined
  >(undefined);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Fetch categories for current level
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["resourceCategories", facilityId, currentParent],
    queryFn: query(resourceCategoryApi.list, {
      pathParams: { facilityId },
      queryParams: {
        resource_type: ResourceCategoryResourceType.charge_item_definition,
        resource_sub_type: resourceSubType,
        parent: currentParent || "",
      },
    }),
    enabled: viewMode === "categories",
  });

  // Fetch charge item definitions for selected category
  const {
    data: definitionsResponse,
    isLoading: isLoadingDefinitions,
    error: definitionsError,
  } = useQuery({
    queryKey: [
      "chargeItemDefinitions",
      facilityId,
      currentCategorySlug,
      searchQuery,
    ],
    queryFn: query.debounced(chargeItemDefinitionApi.listChargeItemDefinition, {
      pathParams: { facilityId },
      queryParams: {
        limit: 100,
        status: "active",
        title: searchQuery,
        category: currentCategorySlug || "",
      },
    }),
    enabled: viewMode === "definitions" && !!currentCategorySlug,
  });

  // Fetch selected definition details for display
  const { data: selectedDefinition, isLoading: isLoadingSelected } = useQuery({
    queryKey: ["chargeItemDefinition", facilityId, value],
    queryFn: query(chargeItemDefinitionApi.retrieveChargeItemDefinition, {
      pathParams: { facilityId, slug: value! },
    }),
    enabled: !!value,
  });

  // Fetch all charge item definitions for copy selection
  const { data: allDefinitionsResponse, isLoading: isLoadingAllDefinitions } =
    useQuery({
      queryKey: ["allChargeItemDefinitions", facilityId],
      queryFn: query(chargeItemDefinitionApi.listChargeItemDefinition, {
        pathParams: { facilityId },
        queryParams: {
          limit: 1000,
          status: "active",
          ordering: "title",
        },
      }),
      enabled: copySelectionOpen,
    });

  const categories = useMemo(
    () => categoriesResponse?.results || [],
    [categoriesResponse?.results],
  );

  const definitions = useMemo(
    () => definitionsResponse?.results || [],
    [definitionsResponse?.results],
  );

  const allDefinitions = useMemo(
    () => allDefinitionsResponse?.results || [],
    [allDefinitionsResponse?.results],
  );

  // Filter categories based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;

    return categories.filter(
      (category) =>
        category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [categories, searchQuery]);

  // Filter definitions based on search query
  const filteredDefinitions = useMemo(() => {
    if (!searchQuery.trim()) return definitions;

    return definitions.filter(
      (definition) =>
        definition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        definition.description
          ?.toLowerCase()
          .includes(searchQuery.toLowerCase()),
    );
  }, [definitions, searchQuery]);

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
      // Switch to definitions view for leaf category
      setBreadcrumbs((prev) => [
        ...prev,
        { slug: category.slug, title: category.title },
      ]);
      setCurrentCategorySlug(category.slug);
      setViewMode("definitions");
      resetSearch();
    }
  };

  const handleDefinitionSelect = (definition: ChargeItemDefinitionRead) => {
    onValueChange(definition.slug);
    setOpen(false);
    resetSearch();
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);

    if (index === -1) {
      // Root level
      setCurrentParent(undefined);
      setCurrentCategorySlug(undefined);
      setViewMode("categories");
    } else {
      const targetCategory = newBreadcrumbs[index];
      // Check if this is a leaf category by checking if we were in definitions mode
      if (viewMode === "definitions" && index === newBreadcrumbs.length - 1) {
        setCurrentCategorySlug(targetCategory.slug);
        setViewMode("definitions");
      } else {
        setCurrentParent(targetCategory.slug);
        setCurrentCategorySlug(undefined);
        setViewMode("categories");
      }
    }
    resetSearch();
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    setCurrentCategorySlug(undefined);
    setViewMode("categories");
    resetSearch();
  };

  const handleBackToCategories = () => {
    if (breadcrumbs.length > 0) {
      const parentCategory = breadcrumbs[breadcrumbs.length - 1];
      setCurrentParent(parentCategory.slug);
      setCurrentCategorySlug(undefined);
      setViewMode("categories");
    } else {
      setCurrentParent(undefined);
      setCurrentCategorySlug(undefined);
      setViewMode("categories");
    }
    resetSearch();
  };

  const handleClearSelection = () => {
    onValueChange(undefined);
    setOpen(false);
    resetSearch();
  };

  const handleCreateSuccess = (
    chargeItemDefinition: ChargeItemDefinitionRead,
  ) => {
    onValueChange(chargeItemDefinition.slug);
    setCreateDrawerOpen(false);
    setOpen(false);
  };

  const handleCopySuccess = (
    chargeItemDefinition: ChargeItemDefinitionRead,
  ) => {
    onValueChange(chargeItemDefinition.slug);
    setCopyDrawerOpen(false);
    setOpen(false);
  };

  const handleCopyDefinitionSelect = (definition: ChargeItemDefinitionRead) => {
    setCopySelectionOpen(false);
    setCopyDrawerOpen(true);
    // Store the selected definition for prefilling
    setSelectedDefinitionForCopy(definition);
  };

  const getDisplayValue = () => {
    if (isLoadingSelected) {
      return (
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-gray-500">{t("loading")}</span>
        </div>
      );
    }

    if (!selectedDefinition) {
      return (
        <span className="text-gray-500">
          {placeholder || t("select_charge_item_definition")}
        </span>
      );
    }

    // Build full path for display with better visual hierarchy
    const pathParts = [];
    if (selectedDefinition.category?.parent) {
      let current: ResourceCategoryParent | undefined =
        selectedDefinition.category.parent;
      while (current) {
        if (current.title) {
          pathParts.unshift(current.title);
        }
        current = current.parent;
      }
    }
    if (selectedDefinition.category?.title) {
      pathParts.push(selectedDefinition.category.title);
    }

    return (
      <div className="flex items-center gap-1">
        <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
        <span className="truncate">
          {pathParts.length > 0 && (
            <span className="text-gray-500">
              {pathParts.length > 2
                ? `${pathParts[0]} > ... > ${pathParts[pathParts.length - 1]} > `
                : `${pathParts.join(" > ")} > `}
            </span>
          )}
          <span className="font-medium">{selectedDefinition.title}</span>
        </span>
      </div>
    );
  };

  const getCurrentLevelTitle = () => {
    if (viewMode === "definitions") {
      return breadcrumbs[breadcrumbs.length - 1]?.title || t("definitions");
    }
    if (breadcrumbs.length === 0) return t("root");
    return breadcrumbs[breadcrumbs.length - 1]?.title || t("root");
  };

  const isLoading =
    viewMode === "categories" ? isLoadingCategories : isLoadingDefinitions;
  const error = viewMode === "categories" ? categoriesError : definitionsError;

  const triggerButton = (
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
  );

  const content = (
    <div className="flex flex-col">
      {/* Header with current location */}
      <div className="px-4 py-3 border-b bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {viewMode === "categories" ? (
              <Home className="h-4 w-4 text-gray-500" />
            ) : (
              <FileText className="h-4 w-4 text-gray-500" />
            )}
            <span className="text-sm font-medium text-gray-600">
              {getCurrentLevelTitle()}
            </span>
            {breadcrumbs.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {viewMode === "categories"
                  ? `${t("level")} ${breadcrumbs.length + 1}`
                  : t("definitions")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {viewMode === "definitions" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToCategories}
                className="h-6 px-2 text-xs text-gray-500 hover:text-gray-700"
              >
                <Folder className="h-3 w-3 mr-1" />
                {t("back")}
              </Button>
            )}
            {showCreateButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCreateDrawerOpen(true)}
                className="h-9 px-2"
              >
                <Plus className="h-3 w-3 mr-1" />
                {t("create")}
              </Button>
            )}
            {showCopyButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCopySelectionOpen(true)}
                className="h-9 px-2"
              >
                <Copy className="h-3 w-3 mr-1" />
                {t("copy")}
              </Button>
            )}
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
              placeholder={
                viewMode === "categories"
                  ? t("search_categories")
                  : t("search_definitions")
              }
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="pl-9 h-9 border-0 focus:ring-0 text-base sm:text-sm"
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
                  {viewMode === "categories"
                    ? t("failed_to_load_categories")
                    : t("failed_to_load_definitions")}
                </div>
              </div>
            ) : searchQuery ? (
              <div className="p-6 text-center text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div className="text-sm">
                  {viewMode === "categories"
                    ? `${t("no_categories_found_for")} "${searchQuery}"`
                    : `${t("no_definitions_found_for")} "${searchQuery}"`}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-gray-500">
                {viewMode === "categories" ? (
                  <>
                    <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t("no_categories_found")}</div>
                  </>
                ) : (
                  <>
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <div className="text-sm">{t("no_definitions_found")}</div>
                  </>
                )}
              </div>
            )}
          </CommandEmpty>

          <CommandGroup>
            {viewMode === "categories"
              ? filteredCategories.map((category) => (
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
                      <ChevronRight className="h-4 w-4 text-gray-500" />
                    </div>
                  </CommandItem>
                ))
              : filteredDefinitions.map((definition) => (
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
                      <div className="flex-shrink-0">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">
                          {definition.title}
                        </div>
                        {definition.description && (
                          <div className="text-xs text-gray-500 truncate mt-0.5">
                            {definition.description}
                          </div>
                        )}
                        {definition.price_components?.[0] && (
                          <div className="text-xs mt-0.5">
                            {definition.price_components[0].amount}{" "}
                            {definition.price_components[0].code?.code || "INR"}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {value === definition.slug && (
                        <Check className="h-4 w-4 text-gray-700" />
                      )}
                    </div>
                  </CommandItem>
                ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={(newOpen) => {
          setOpen(newOpen);
          if (!newOpen) {
            resetSearch();
          }
        }}
      >
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh] rounded-t-lg">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

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
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        className="w-[420px] p-0 shadow-lg border-0"
        align="start"
        sideOffset={4}
      >
        {content}
      </PopoverContent>

      <ChargeItemDefinitionDrawer
        open={createDrawerOpen}
        onOpenChange={setCreateDrawerOpen}
        facilityId={facilityId}
        categorySlug={categorySlug}
        onSuccess={handleCreateSuccess}
      />

      {/* Copy Selection Drawer */}
      <Drawer open={copySelectionOpen} onOpenChange={setCopySelectionOpen}>
        <DrawerContent className="max-h-[85vh] flex flex-col">
          <div className="px-4 py-4 flex-1 min-h-0 overflow-auto">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">
                {t("select_definition_to_copy")}
              </h3>
              <p className="text-sm text-gray-600">
                {t("select_definition_to_copy_description")}
              </p>
            </div>

            <Command className="border-0">
              <div className="px-3 py-2 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <CommandInput
                    placeholder={t("search_definitions")}
                    className="pl-9 h-9 border-0 focus:ring-0 text-base sm:text-sm"
                  />
                </div>
              </div>

              <CommandList className="max-h-[300px]">
                <CommandEmpty>
                  {isLoadingAllDefinitions ? (
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <div className="text-sm">{t("no_definitions_found")}</div>
                    </div>
                  )}
                </CommandEmpty>

                <CommandGroup>
                  {allDefinitions.map((definition) => (
                    <CommandItem
                      key={definition.id}
                      value={definition.title}
                      onSelect={() => handleCopyDefinitionSelect(definition)}
                      className="flex items-center justify-between px-3 py-3 cursor-pointer hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="flex-shrink-0">
                          <FileText className="h-5 w-5 text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {definition.title}
                          </div>
                          {definition.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {definition.description}
                            </div>
                          )}
                          {definition.price_components?.[0] && (
                            <div className="text-xs mt-0.5">
                              {definition.price_components[0].amount}{" "}
                              {definition.price_components[0].code?.code ||
                                "INR"}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Copy className="h-4 w-4 text-gray-500" />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Copy Drawer with prefilled data */}
      <ChargeItemDefinitionDrawer
        open={copyDrawerOpen}
        onOpenChange={(open) => {
          setCopyDrawerOpen(open);
          if (!open) {
            setSelectedDefinitionForCopy(undefined);
          }
        }}
        facilityId={facilityId}
        categorySlug={categorySlug}
        initialData={selectedDefinitionForCopy}
        onSuccess={handleCopySuccess}
      />
    </Popover>
  );
}
