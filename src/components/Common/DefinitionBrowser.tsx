import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Folder, FolderOpen, ChevronRight, Search, Plus, Trash2, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import query from "@/Utils/request/query";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import {
  ResourceCategoryRead,
  ResourceCategoryResourceType,
} from "@/types/base/resourceCategory/resourceCategory";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import { ChargeItemDefinitionBase } from "@/types/billing/chargeItemDefinition/chargeItemDefinition";

// Shape compatible with existing RequirementsSelector usage
export interface DefinitionBrowserSelectedItem {
  value: string; // slug/id
  label: string; // display title
  details: { label: string; value?: string }[];
}

interface DefinitionBrowserProps {
  facilityId: string;
  resourceType: ResourceCategoryResourceType; // Decides which final entities are shown. Currently only charge_item_definition implemented.
  value: DefinitionBrowserSelectedItem[];
  onChange: (value: DefinitionBrowserSelectedItem[]) => void;
  placeholder?: string;
  className?: string;
  title?: string;
  description?: string;
  allowDuplicate?: boolean;
}

interface BreadcrumbItem {
  slug: string | undefined; // undefined => root
  title: string;
}

export function DefinitionBrowser({
  facilityId,
  resourceType,
  value,
  onChange,
  placeholder,
  className,
  title,
  description,
  allowDuplicate = false,
}: DefinitionBrowserProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [breadcrumbs, setBreadcrumbs] = React.useState<BreadcrumbItem[]>([]);
  const [currentParent, setCurrentParent] = React.useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = React.useState("");
  const [definitionsSearch, setDefinitionsSearch] = React.useState("");
  const [showDefinitions, setShowDefinitions] = React.useState(false);
  const [leafCategory, setLeafCategory] = React.useState<ResourceCategoryRead | null>(null);

  // Query categories for the current level
  const {
    data: categoriesResponse,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: [
      "definitionBrowserCategories",
      facilityId,
      resourceType,
      currentParent,
    ],
    queryFn: query(resourceCategoryApi.list, {
      pathParams: { facilityId },
      queryParams: {
        resource_type: resourceType,
        parent: currentParent || "",
        ordering: "title",
      },
    }),
    enabled: !showDefinitions, // Don't refetch categories while viewing definitions
  });

  const categories: ResourceCategoryRead[] = React.useMemo(
    () => (categoriesResponse?.results || []) as ResourceCategoryRead[],
    [categoriesResponse?.results],
  );

  const filteredCategories = React.useMemo(() => {
    if (!search.trim()) return categories;
    const q = search.toLowerCase();
    return categories.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q),
    );
  }, [categories, search]);

  // Query final definitions when on a leaf category
  const {
    data: definitionsResponse,
    isLoading: isLoadingDefinitions,
    error: definitionsError,
  } = useQuery({
    queryKey: [
      "definitionBrowserDefinitions",
      facilityId,
      resourceType,
      leafCategory?.slug,
      definitionsSearch,
    ],
    queryFn: resourceType ===
      ResourceCategoryResourceType.charge_item_definition
      ? query(chargeItemDefinitionApi.listChargeItemDefinition, {
          pathParams: { facilityId },
          queryParams: {
            limit: 100,
            category: leafCategory?.slug,
            title: definitionsSearch || undefined,
          },
        })
      : async () => ({ results: [], count: 0 } as any),
    enabled: showDefinitions && !!leafCategory,
  });

  const definitions: ChargeItemDefinitionBase[] = React.useMemo(
    () => (definitionsResponse?.results || []) as ChargeItemDefinitionBase[],
    [definitionsResponse?.results],
  );

  const addDefinition = (def: ChargeItemDefinitionBase) => {
    const item: DefinitionBrowserSelectedItem = {
      value: def.slug,
      label: def.title,
      details: [
        { label: t("status"), value: t(def.status) },
        { label: t("description"), value: def.description },
        { label: t("purpose"), value: def.purpose },
      ],
    };
    if (!allowDuplicate && value.some((v) => v.value === item.value)) return;
    onChange([...value, item]);
  };

  const removeDefinition = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  const navigateInto = (category: ResourceCategoryRead) => {
    if (category.has_children) {
      setBreadcrumbs((prev) => [
        ...prev,
        { slug: category.slug, title: category.title },
      ]);
      setCurrentParent(category.slug);
      setSearch("");
    } else {
      // Leaf: show definitions
      setLeafCategory(category);
      setShowDefinitions(true);
      setSearch("");
    }
  };

  const goToBreadcrumb = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentParent(newBreadcrumbs[index]?.slug);
    setShowDefinitions(false);
    setLeafCategory(null);
    setSearch("");
  };

  const backOneLevel = () => {
    if (showDefinitions) {
      // Go back to categories of the leaf parent
      setShowDefinitions(false);
      setDefinitionsSearch("");
      return;
    }
    if (breadcrumbs.length === 0) return; // already root
    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);
    setCurrentParent(newBreadcrumbs.at(-1)?.slug);
    setSearch("");
  };

  const resetAll = () => {
    setBreadcrumbs([]);
    setCurrentParent(undefined);
    setShowDefinitions(false);
    setLeafCategory(null);
    setSearch("");
    setDefinitionsSearch("");
  };

  const triggerLabel = () => {
    if (value.length === 0)
      return (
        <span className="text-gray-500">
          {placeholder || t("select_charge_item_definitions")}
        </span>
      );
    return (
      <span className="flex items-center gap-2 truncate">
        <span className="font-medium">{value.length}</span> {t("items_selected")}
      </span>
    );
  };

  const isCategoriesView = !showDefinitions;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) resetAll();
      }}
    >
      <div className={cn("flex flex-col gap-3", className)}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {triggerLabel()}
            <ChevronRight className={cn("ml-2 size-4 shrink-0 opacity-50 transition-transform", open && "rotate-90")}/>
          </Button>
        </SheetTrigger>

        {value.length > 0 && (
          <div className="flex flex-col gap-2">
            {value.map((item, idx) => (
              <div
                key={`${item.value}-${idx}`}
                className="relative flex flex-col rounded-sm border border-gray-200 bg-white px-2 py-1"
              >
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeDefinition(idx);
                  }}
                  className="absolute right-2 top-0 rounded-full p-1 cursor-pointer"
                  variant="ghost"
                >
                  <Trash2 className="size-4 text-gray-500" />
                </Button>
                <p className="my-px font-medium text-sm text-gray-900">{item.label}</p>
                <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
                  {item.details.map((d, i) => (
                    <div key={i} className="flex text-sm">
                      <span className="text-gray-500">{d.label}: </span>
                      <span className="ml-1 text-gray-900">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 md:max-w-[480px]"
      >
        <div className="flex flex-col border-b p-4 gap-1">
          <h2 className="text-lg font-semibold">{title || t("select_charge_item_definitions")}</h2>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>

        {/* Breadcrumbs / Navigation */}
        <div className="flex items-center gap-2 px-4 py-2 border-b bg-gray-50 flex-wrap">
          {breadcrumbs.length === 0 && (
            <Badge variant="secondary" className="text-xs">{t("root")}</Badge>
          )}
          {breadcrumbs.map((bc, idx) => (
            <div key={bc.slug} className="flex items-center gap-1 text-xs">
              {idx > 0 || idx === 0 ? (
                <ChevronRight className="h-3 w-3 text-gray-400" />
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => goToBreadcrumb(idx)}
              >
                {bc.title}
              </Button>
            </div>
          ))}
          {(showDefinitions || breadcrumbs.length > 0) && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs ml-auto"
              onClick={backOneLevel}
            >
              {t("back")}
            </Button>
          )}
          {value.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onChange([])}
            >
              <X className="h-3 w-3 mr-1" /> {t("clear")}
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              className="w-full rounded-md border border-gray-200 bg-white pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-300"
              placeholder={
                isCategoriesView
                  ? t("search_categories")
                  : t("search_charge_item_definitions")
              }
              value={isCategoriesView ? search : definitionsSearch}
              onChange={(e) =>
                isCategoriesView
                  ? setSearch(e.target.value)
                  : setDefinitionsSearch(e.target.value)
              }
            />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {isCategoriesView ? (
            <ScrollArea className="h-full">
              {isLoadingCategories ? (
                <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                </div>
              ) : categoriesError ? (
                <div className="p-6 text-sm text-red-600">
                  {t("failed_to_load_categories")}
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="p-6 text-sm text-gray-500 flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 opacity-50" />
                  {t("no_categories_found")}
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredCategories.map((cat) => (
                    <Button
                      key={cat.slug}
                      variant="ghost"
                      className="w-full justify-between h-auto py-2 px-3 text-left font-normal"
                      onClick={() => navigateInto(cat)}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {cat.has_children ? (
                          <FolderOpen className="h-5 w-5 text-gray-500 mt-0.5" />
                        ) : (
                          <Folder className="h-5 w-5 text-gray-500 mt-0.5" />
                        )}
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">
                            {cat.title}
                          </div>
                          {cat.description && (
                            <div className="text-xs text-gray-500 truncate mt-0.5">
                              {cat.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          ) : (
            <div className="flex flex-col h-full">
              <div className="border-b px-4 py-2 text-sm font-medium bg-gray-50 flex items-center gap-2">
                <Folder className="h-4 w-4 text-gray-500" />
                {leafCategory?.title}
                <Badge variant="outline" className="ml-auto text-xs">
                  {definitions.length}
                </Badge>
              </div>
              <div className="flex-1 overflow-hidden">
                <ScrollArea className="h-full">
                  {isLoadingDefinitions ? (
                    <div className="p-6 flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> {t("loading")}
                    </div>
                  ) : definitionsError ? (
                    <div className="p-6 text-sm text-red-600">
                      {t("failed_to_load_definitions")}
                    </div>
                  ) : definitions.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500 flex flex-col items-center gap-2">
                      <Search className="h-6 w-6 opacity-50" />
                      {t("no_definitions_found")}
                    </div>
                  ) : (
                    <Command className="border-0">
                      <CommandEmpty />
                      <CommandGroup className="p-2">
                        {definitions.map((def) => {
                          const isSelected = value.some((v) => v.value === def.slug);
                          const canAdd = allowDuplicate || !isSelected;
                          return (
                            <CommandItem
                              key={def.slug}
                              value={def.title}
                              onSelect={() => canAdd && addDefinition(def)}
                              className="flex items-center justify-between rounded-md px-2 py-2 cursor-pointer"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium truncate">{def.title}</span>
                                {def.description && (
                                  <span className="text-xs text-gray-500 truncate">{def.description}</span>
                                )}
                              </div>
                              {canAdd && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addDefinition(def);
                                  }}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              )}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    </Command>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default DefinitionBrowser;
