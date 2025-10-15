import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FolderOpen, Home, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ValueSetSearchContent from "@/components/Questionnaire/ValueSetSearchContent";

import useBreakpoints from "@/hooks/useBreakpoints";

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import { ResourceCategoryRead } from "@/types/base/resourceCategory/resourceCategory";
import resourceCategoryApi from "@/types/base/resourceCategory/resourceCategoryApi";
import {
  ProductKnowledgeBase,
  ProductKnowledgeStatus,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";
import query from "@/Utils/request/query";
import { isAppleDevice } from "@/Utils/utils";

interface Props {
  onSelect: (value: Code) => void;
  onProductSelect: (product: ProductKnowledgeBase) => void;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  value?: Code;
  hideTrigger?: boolean;
  wrapTextForSmallScreen?: boolean;
  mobileTrigger?: React.ReactNode;
}

type TabType = "product" | "valueset";

export default function MedicationValueSetSelect({
  onSelect,
  onProductSelect,
  disabled,
  placeholder = "Search...",
  title,
  value,
  hideTrigger = false,
  wrapTextForSmallScreen = false,
  mobileTrigger,
}: Props) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("product");
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const [currentCategory, setCurrentCategory] = useState<string | undefined>(
    undefined,
  );
  const [breadcrumbs, setBreadcrumbs] = useState<
    Array<{ slug: string; title: string }>
  >([]);

  const { data: categories, isFetching: isCategoriesLoading } = useQuery({
    queryKey: [
      "resourceCategories",
      facilityId,
      "product_knowledge",
      currentCategory,
      search,
    ],
    queryFn: query(resourceCategoryApi.list, {
      pathParams: { facilityId: facilityId || "" },
      queryParams: {
        resource_type: "product_knowledge",
        parent: currentCategory || "",
        title: search || undefined,
      },
    }),
    enabled: !!facilityId && !search,
  });

  const { data: productKnowledge, isFetching: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "medication", currentCategory, search],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        offset: 0,
        name: search,
        product_type: "medication",
        category: search ? undefined : currentCategory,
        status: ProductKnowledgeStatus.active,
      },
    }),
  });

  useEffect(() => {
    if (open) {
      setSearch("");
      setCurrentCategory(undefined);
      setBreadcrumbs([]);
    }
  }, [open]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (activeTab === "product" && value && currentCategory) {
      setCurrentCategory(undefined);
      setBreadcrumbs([]);
    }
  };

  const handleCategorySelect = (
    categorySlug: string,
    categoryTitle: string,
  ) => {
    setBreadcrumbs((prev) => [
      ...prev,
      { slug: categorySlug, title: categoryTitle },
    ]);
    setCurrentCategory(categorySlug);
    setSearch("");
  };

  const handleBackToRoot = () => {
    setBreadcrumbs([]);
    setCurrentCategory(undefined);
    setSearch("");
  };

  const handleBreadcrumbClick = (index: number) => {
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);

    if (index === -1) {
      setCurrentCategory(undefined);
    } else {
      setCurrentCategory(newBreadcrumbs[index].slug);
    }
    setSearch("");
  };

  const tabContent = (
    <MedicationValueSetSelectTabContent
      activeTab={activeTab}
      search={search}
      onSearchChange={handleSearchChange}
      categories={categories?.results || []}
      products={productKnowledge?.results || []}
      currentCategory={currentCategory}
      isProductLoading={isProductLoading}
      isCategoriesLoading={isCategoriesLoading}
      onCategorySelect={handleCategorySelect}
      onProductSelect={onProductSelect}
      onValueSetSelect={onSelect}
      title={title}
      onChange={setActiveTab}
      onOpenChange={setOpen}
    />
  );

  if (isMobile && !hideTrigger) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {mobileTrigger ? (
            mobileTrigger
          ) : (
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                wrapTextForSmallScreen
                  ? "h-auto whitespace-normal text-left"
                  : "truncate",
                !value?.display && "text-gray-400",
              )}
              disabled={disabled}
            >
              <span>{value?.display || placeholder}</span>
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          )}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh] px-0 pb-0 rounded-t-lg">
          <DrawerHeader className="p-0 mt-1.5">
            <MedicationValueSetSelectTabs
              activeTab={activeTab}
              onChange={setActiveTab}
            />
            <DrawerTitle className="sr-only">
              {title || t("select_medication")}
            </DrawerTitle>
            <CategoryBreadcrumbs
              breadcrumbs={breadcrumbs}
              activeTab={activeTab}
              onBackToRoot={handleBackToRoot}
              onBreadcrumbClick={handleBreadcrumbClick}
            />
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">{tabContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (hideTrigger) {
    return (
      <div className="w-full mt-1.5">
        <MedicationValueSetSelectTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <CategoryBreadcrumbs
          breadcrumbs={breadcrumbs}
          activeTab={activeTab}
          onBackToRoot={handleBackToRoot}
          onBreadcrumbClick={handleBreadcrumbClick}
        />
        {tabContent}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="white"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between font-normal border-gray-300 shadow-xs",
            !value?.display && "text-gray-500 hover:bg-white",
          )}
          disabled={disabled}
        >
          <span className="truncate">{value?.display || placeholder}</span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        <MedicationValueSetSelectTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <CategoryBreadcrumbs
          breadcrumbs={breadcrumbs}
          activeTab={activeTab}
          onBackToRoot={handleBackToRoot}
          onBreadcrumbClick={handleBreadcrumbClick}
        />
        {tabContent}
      </PopoverContent>
    </Popover>
  );
}

function MedicationValueSetSelectTabs({
  activeTab,
  onChange,
}: {
  activeTab: TabType;
  onChange: (value: TabType) => void;
}) {
  const { t } = useTranslation();
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) => onChange(value as TabType)}
    >
      <TabsList className="flex w-full">
        <TabsTrigger value="product" className="flex-1">
          {t("in_stock")}
        </TabsTrigger>
        <TabsTrigger value="valueset" className="flex-1">
          {t("medication_list")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function CategoryBreadcrumbs({
  breadcrumbs,
  activeTab,
  onBackToRoot,
  onBreadcrumbClick,
}: {
  breadcrumbs: Array<{ slug: string; title: string }>;
  activeTab: TabType;
  onBackToRoot: () => void;
  onBreadcrumbClick: (index: number) => void;
}) {
  const { t } = useTranslation();

  if (breadcrumbs.length < 1 || activeTab !== "product") {
    return null;
  }

  return (
    <div className="p-1.5 border-b bg-gray-100 mt-0.5">
      <Breadcrumb>
        <BreadcrumbList className="text-xs flex-nowrap overflow-x-auto">
          <BreadcrumbItem>
            <BreadcrumbLink
              asChild
              className="flex items-center hover:text-gray-900"
              onClick={onBackToRoot}
            >
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs hover:bg-white"
              >
                <Home className="size-3" />
                {t("root")}
              </Button>
            </BreadcrumbLink>
          </BreadcrumbItem>

          {breadcrumbs.map((breadcrumb, index) => (
            <BreadcrumbItem key={breadcrumb.slug}>
              <BreadcrumbSeparator />
              <BreadcrumbLink
                asChild
                className="hover:text-gray-900"
                onClick={() => onBreadcrumbClick(index)}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs hover:bg-white truncate max-w-[150px]"
                >
                  {breadcrumb.title}
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  );
}

function MedicationCommandGroup({
  items,
  onCategorySelect,
  onProductSelect,
}: {
  items: ProductKnowledgeBase[] | ResourceCategoryRead[];
  onCategorySelect?: (slug: string, title: string) => void;
  onProductSelect?: (product: ProductKnowledgeBase) => void;
}) {
  const { t } = useTranslation();
  if (items.length === 0) {
    return null;
  }
  return (
    <CommandGroup heading={onCategorySelect ? t("category") : t("products")}>
      {items.map((item) => (
        <MedicationCommandItem
          key={item.id}
          item={item}
          onCategorySelect={onCategorySelect}
          onProductSelect={onProductSelect}
        />
      ))}
    </CommandGroup>
  );
}

function MedicationCommandItem({
  item,
  onCategorySelect,
  onProductSelect,
}: {
  item: ProductKnowledgeBase | ResourceCategoryRead;
  onCategorySelect?: (slug: string, title: string) => void;
  onProductSelect?: (product: ProductKnowledgeBase) => void;
}) {
  const isCategory = "title" in item;
  const handleSelect = () => {
    if (isCategory) {
      onCategorySelect?.(item.slug, item.title);
    } else {
      onProductSelect?.(item);
    }
  };

  return (
    <CommandItem
      key={item.id}
      value={isCategory ? item.title : item.name}
      onSelect={handleSelect}
      className="cursor-pointer p-3 hover:bg-gray-50"
    >
      {isCategory ? (
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <FolderOpen className="size-5 text-gray-500" />
          <div className="min-w-0 flex-1">
            <div className="font-medium text-sm truncate">{item.title}</div>
            {item.description && (
              <div className="text-xs text-gray-500 truncate">
                {item.description}
              </div>
            )}
          </div>
          <ChevronRight className="size-4 text-gray-500" />
        </div>
      ) : (
        <div className="flex flex-col">
          <span className="font-medium">{item.name}</span>
        </div>
      )}
    </CommandItem>
  );
}

interface MedicationValueSetSelectTabContentProps {
  activeTab: TabType;
  search: string;
  onSearchChange: (value: string) => void;
  categories: ResourceCategoryRead[];
  products: ProductKnowledgeBase[];
  currentCategory?: string;
  isProductLoading: boolean;
  isCategoriesLoading: boolean;
  onCategorySelect: (slug: string, title: string) => void;
  onProductSelect: (product: ProductKnowledgeBase) => void;
  onValueSetSelect: (selected: Code) => void;
  title?: string;
  onChange: (value: TabType) => void;
  onOpenChange: (value: boolean) => void;
}

export function MedicationValueSetSelectTabContent({
  activeTab,
  search,
  onSearchChange,
  categories,
  products,
  currentCategory,
  isProductLoading,
  isCategoriesLoading,
  onCategorySelect,
  onProductSelect,
  onValueSetSelect,
  title,
  onChange,
  onOpenChange,
}: MedicationValueSetSelectTabContentProps) {
  const { t } = useTranslation();

  return (
    <div>
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => {
          onChange(value as TabType);
        }}
        className="w-full p-0"
      >
        <TabsContent value="product">
          <Command className="rounded-lg" filter={() => 1}>
            <div className="bg-white z-10 w-full fixed mb-4">
              <CommandInput
                placeholder={t("search_products")}
                onValueChange={onSearchChange}
                value={search}
                className="border-none ring-0 text-base sm:text-sm"
                autoFocus={!isAppleDevice}
              />
            </div>

            <CommandList className="flex-1 mt-7 overflow-y-auto">
              <CommandEmpty className="h-72 flex justify-center items-center py-6 text-gray-500">
                {search.length < 3 ? (
                  <p className="p-4 text-sm text-gray-500">
                    {t("min_char_length_error", { min_length: 3 })}
                  </p>
                ) : isProductLoading || isCategoriesLoading ? (
                  <p className="flex items-center justify-center p-4 text-sm text-gray-500">
                    <Loader2 className="size-5 animate-spin mr-2" />
                    {t("searching")}
                  </p>
                ) : (
                  <p className="p-4 text-sm text-gray-500">
                    {t("no_results_found")}
                  </p>
                )}
              </CommandEmpty>

              {!search && (
                <>
                  <MedicationCommandGroup
                    items={categories}
                    onCategorySelect={onCategorySelect}
                  />

                  {currentCategory && (
                    <MedicationCommandGroup
                      items={products}
                      onProductSelect={(product) => {
                        onProductSelect(product);
                        onOpenChange(false);
                      }}
                    />
                  )}
                </>
              )}

              {search && (
                <MedicationCommandGroup
                  items={products}
                  onProductSelect={(product) => {
                    onProductSelect(product);
                    onOpenChange(false);
                  }}
                />
              )}
            </CommandList>
          </Command>
        </TabsContent>

        <TabsContent value="valueset" className="p-0 overflow-y-auto">
          <ValueSetSearchContent
            system="system-medication"
            onSelect={(value) => {
              onValueSetSelect(value);
              onOpenChange(false);
            }}
            searchPostFix=" clinical drug"
            title={title}
            search={search}
            onSearchChange={onSearchChange}
            placeholder={t("search_medications")}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
