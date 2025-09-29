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
import { EmptyState } from "@/components/ui/empty-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { ProductFormDrawer } from "@/components/Common/ProductFormDrawer";
import { ProductRead } from "@/types/inventory/product/product";
import productApi from "@/types/inventory/product/productApi";

interface ProductSelectProps {
  facilityId: string;
  onSelect?: (product: ProductRead) => void;
  selectedProductId?: string;
  productKnowledgeId?: string;
  productKnowledgeSlug?: string;
  receivingItem?: string;
  quantity?: string;
  disabled?: boolean;
}

export default function ProductSelect({
  facilityId,
  onSelect,
  selectedProductId,
  productKnowledgeId,
  productKnowledgeSlug,
  receivingItem,
  quantity,
  disabled,
}: ProductSelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

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
    enabled: !!productKnowledgeSlug && popoverOpen,
  });

  const products = response?.results || [];

  return (
    <div className="flex h-full w-full flex-col space-y-4">
      {/* Header with search and add button */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild disabled={disabled}>
            <div className="flex flex-row gap-2">
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={popoverOpen}
                disabled={disabled}
                className="w-full sm:w-[300px] justify-between"
              >
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-4 w-4 text-gray-500" />
                  <span className="truncate">
                    {searchQuery || t("search_product")}
                  </span>
                </div>
                <CareIcon
                  icon="l-angle-down"
                  className={`ml-2 h-4 w-4 shrink-0 opacity-50 transition-transform ${
                    popoverOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-[600px] p-4 p-1" align="start">
            {/* Header section with both search and add button */}
            <div className="flex items-center gap-4 mb-2 bg-gray-100 rounded-md p-1">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search lot/batch"
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
                  setDrawerOpen(true);
                  setPopoverOpen(false);
                }}
              >
                <CareIcon icon="l-plus" className="size-4 mr-2" />
                Add Lot/Batch
              </Button>
            </div>

            <Command className="border-0">
              <div className="sr-only">
                <input value={searchQuery} readOnly />
              </div>
              <CommandList className="max-h-[200px]">
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
                          setPopoverOpen(false);
                        }}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onSelect?.(product);
                          setPopoverOpen(false);
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
                                  Expiry:{" "}
                                  {format(
                                    new Date(product.expiration_date),
                                    "MM/yyyy",
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                          {selectedProductId === product.id && (
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
          </PopoverContent>
        </Popover>
      </div>

      <ProductFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        facilityId={facilityId}
        productKnowledgeSlug={productKnowledgeSlug || ""}
        receivingItem={receivingItem || ""}
        quantity={quantity || ""}
        onSuccess={(product) => {
          onSelect?.(product);
          setDrawerOpen(false);
        }}
      />
    </div>
  );
}
