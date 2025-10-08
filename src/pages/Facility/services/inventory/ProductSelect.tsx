import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { ProductFormDrawer } from "@/components/Common/ProductFormDrawer";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";

interface ProductSelectProps {
  facilityId: string;
  onSelect?: (product: ProductRead) => void;
  selectedProduct?: ProductRead;
  productKnowledgeSlug?: string;
  receivingItem?: string;
  quantity?: string;
  disabled?: boolean;
}

export default function ProductSelect({
  facilityId,
  onSelect,
  selectedProduct,
  productKnowledgeSlug,
  receivingItem,
  quantity,
  disabled,
}: ProductSelectProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [searchQuery, setSearchQuery] = useState("");
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const { data: response, isLoading } = useQuery({
    queryKey: ["products", facilityId, searchQuery, productKnowledgeSlug],
    queryFn: query.debounced(productApi.listProduct, {
      pathParams: {
        facilityId,
      },
      queryParams: {
        limit: 50,
        offset: 0,
        status: "active",
        name: searchQuery || undefined,
        ordering: "-created_date",
        product_knowledge: productKnowledgeSlug || undefined,
      },
    }),
    enabled: !!productKnowledgeSlug && selectorOpen,
  });

  const products = response?.results || [];

  const getExpirationDate = (product: ProductRead) => {
    return product.expiration_date
      ? format(new Date(product.expiration_date), "MM/yyyy")
      : "N/A";
  };

  // Product selector content - shared between drawer and popover
  const selectorContent = (
    <>
      {/* Header section with both search and add button */}
      <div className="flex items-center gap-4 mb-2 bg-gray-100 rounded-md p-1">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={t("search_product")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <span className="text-gray-400 text-sm font-medium">-OR-</span>
        <Button
          type="button"
          variant="outline"
          className="whitespace-nowrap px-6 py-3"
          onClick={() => {
            setFormDrawerOpen(true);
            setSelectorOpen(false);
          }}
        >
          <CareIcon icon="l-plus" className="size-4 mr-2" />
          {t("add_new_product")}
        </Button>
      </div>

      <Command className={cn("border-0", isMobile ? "h-full" : "max-h-[40vh]")}>
        <div className="sr-only">
          <input value={searchQuery} readOnly />
        </div>
        <CommandList
          className={isMobile ? "h-[40vh] max-h-full" : "max-h-[200px]"}
        >
          {isLoading ? (
            <div className="py-6 text-center text-sm">
              <CareIcon
                icon="l-spinner"
                className="size-4 animate-spin mx-auto mb-2"
              />
              {t("loading")}...
            </div>
          ) : products.length === 0 ? (
            <CommandEmpty>
              <EmptyState
                icon={
                  <CareIcon
                    icon="l-folder-open"
                    className="text-primary size-6"
                  />
                }
                title={t("no_products_found")}
                description={
                  searchQuery
                    ? t("try_different_search")
                    : t("no_active_products")
                }
              />
            </CommandEmpty>
          ) : (
            <CommandGroup>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.id}
                  onSelect={() => {
                    onSelect?.(product);
                    setSelectorOpen(false);
                  }}
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSelect?.(product);
                    setSelectorOpen(false);
                  }}
                >
                  <div className="flex w-full items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900">
                          #{product.batch?.lot_number || "N/A"}
                        </span>
                        {product.expiration_date && (
                          <span className="text-sm text-gray-500">
                            Expiry: {getExpirationDate(product)}
                          </span>
                        )}
                      </div>
                    </div>
                    {selectedProduct?.id === product.id && (
                      <CareIcon
                        icon="l-check"
                        className="size-4 text-primary-600 ml-2"
                      />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
    </>
  );

  // Common selector button
  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={selectorOpen}
      disabled={disabled}
      className="w-full sm:w-[300px] justify-between"
    >
      <div className="flex items-center gap-2">
        <SearchIcon className="h-4 w-4 text-gray-500" />
        <span className="truncate">
          {selectedProduct?.batch?.lot_number ||
            searchQuery ||
            t("search_product")}
        </span>
      </div>
      <CareIcon
        icon="l-angle-down"
        className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${
          selectorOpen ? "rotate-180" : ""
        }`}
      />
    </Button>
  );

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        {isMobile ? (
          // Mobile: Use Drawer
          <Drawer open={selectorOpen} onOpenChange={setSelectorOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="flex flex-col max-h-[85vh]">
              <div className="px-4 py-4 flex-1 min-h-0 overflow-auto">
                {selectorContent}
              </div>
            </DrawerContent>
          </Drawer>
        ) : (
          // Desktop: Use Popover
          <Popover open={selectorOpen} onOpenChange={setSelectorOpen}>
            <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
            <PopoverContent className="w-[600px] p-4 p-1" align="start">
              {selectorContent}
            </PopoverContent>
          </Popover>
        )}
      </div>

      <ProductFormDrawer
        open={formDrawerOpen}
        onOpenChange={setFormDrawerOpen}
        facilityId={facilityId}
        productKnowledgeSlug={productKnowledgeSlug || ""}
        receivingItem={receivingItem || ""}
        quantity={quantity || ""}
        onSuccess={(product) => {
          onSelect?.(product);
          setFormDrawerOpen(false);
        }}
      />
    </div>
  );
}
