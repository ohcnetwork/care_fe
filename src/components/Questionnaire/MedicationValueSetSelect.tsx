import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, FolderOpen, Home } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<"product" | "valueset">("product");
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
        ordering: "title",
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

  const renderProductItems = () => {
    if (!productKnowledge?.results || productKnowledge.results.length === 0) {
      return null;
    }

    return (
      <CommandGroup heading={t("products")}>
        {productKnowledge.results.map((product) => (
          <CommandItem
            key={product.id}
            value={product.name}
            onSelect={() => {
              onProductSelect(product);
              setOpen(false);
            }}
            className="cursor-pointer p-3 hover:bg-gray-50"
          >
            <div className="flex flex-col">
              <span className="font-medium">{product.name}</span>
            </div>
          </CommandItem>
        ))}
      </CommandGroup>
    );
  };

  const renderTabs = () => (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) =>
        setActiveTab(value as "product" | "valueset")
      }
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

  const renderCommand = (children: React.ReactNode) => (
    <Command className="rounded-lg" filter={() => 1}>
      {activeTab === "product" && (
        <CommandInput
          placeholder={t("search_products")}
          onValueChange={(value) => {
            if (value && currentCategory) {
              setCurrentCategory(undefined);
              setBreadcrumbs([]);
            }
            setSearch(value);
          }}
          value={search}
          className="border-none ring-0 text-base md:text-sm"
          autoFocus={!isAppleDevice}
        />
      )}
      {children}
    </Command>
  );

  const renderTabContent = () => (
    <div className="flex-1 overflow-y-auto">
      <Tabs
        value={activeTab}
        onValueChange={(value: string) =>
          setActiveTab(value as "product" | "valueset")
        }
        className="w-full p-0"
      >
        <TabsContent value="product" className="p-0 overflow-y-auto">
          <CommandList>
            <CommandEmpty>
              {search.length < 3 ? (
                <p className="p-4 text-sm text-gray-500">
                  {t("min_char_length_error", { min_length: 3 })}
                </p>
              ) : isProductLoading || isCategoriesLoading ? (
                <p className="p-4 text-sm text-gray-500">{t("searching")}</p>
              ) : (
                <p className="p-4 text-sm text-gray-500">
                  {t("no_results_found")}
                </p>
              )}
            </CommandEmpty>

            {!search && (
              <>
                {/* Categories */}
                {categories?.results && categories.results.length > 0 && (
                  <CommandGroup heading={t("category")}>
                    {categories.results.map((category) => (
                      <CommandItem
                        key={category.id}
                        value={category.title}
                        onSelect={() =>
                          handleCategorySelect(category.slug, category.title)
                        }
                        className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FolderOpen className="size-5 text-gray-500" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {category.title}
                            </div>
                            {category.description && (
                              <div className="text-xs text-gray-500 truncate">
                                {category.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="size-4 text-gray-500" />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                {/* Products in the current category */}
                {currentCategory && renderProductItems()}
              </>
            )}
            {/* Search Results */}
            {search && renderProductItems()}
          </CommandList>
        </TabsContent>

        <TabsContent value="valueset" className="p-0 overflow-y-auto">
          <ValueSetSearchContent
            system="system-medication"
            onSelect={(selected) => {
              onSelect(selected);
              setOpen(false);
            }}
            searchPostFix=" clinical drug"
            title={title}
            search={search}
            onSearchChange={setSearch}
            placeholder={placeholder}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderBreadcrumbs = () =>
    breadcrumbs.length > 0 &&
    activeTab === "product" && (
      <div className="px-4 py-2 border-b bg-gray-100 mt-1 overflow-hidden">
        <Breadcrumb>
          <BreadcrumbList className="text-xs flex-nowrap overflow-x-auto">
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="flex items-center hover:text-gray-900"
                onClick={handleBackToRoot}
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
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs hover:bg-white truncate max-w-[150px] truncate"
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
        <DrawerContent className="min-h-[50vh] max-h-[85vh] px-0 pb-0 rounded-t-lg flex flex-col">
          <DrawerHeader className="p-0 flex-shrink-0 mt-1.5">
            {renderTabs()}
            <DrawerTitle className="sr-only">
              {title || t("select_medication")}
            </DrawerTitle>
            {renderBreadcrumbs()}
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto">
            {renderCommand(renderTabContent())}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  if (hideTrigger) {
    return (
      <div className="w-full mt-1.5">
        {renderTabs()}
        {renderBreadcrumbs()}
        {renderCommand(renderTabContent())}
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
        {renderTabs()}
        {renderBreadcrumbs()}
        {renderCommand(renderTabContent())}
      </PopoverContent>
    </Popover>
  );
}
