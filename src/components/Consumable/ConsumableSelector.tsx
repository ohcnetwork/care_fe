import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { PlusIcon } from "@radix-ui/react-icons";

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

import query from "@/Utils/request/query";
import { cn } from "@/lib/utils";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import {
  ProductKnowledgeBase,
  ProductKnowledgeType,
} from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface ConsumableSelectorProps {
  onProductSelect: (product: ProductKnowledgeBase) => void;
  disabled?: boolean;
  placeholder?: string;
  inputPlaceholder?: string;
  className?: string;
  search: string;
  onSearchChange: (search: string) => void;
  popoverWidth?: "auto" | "trigger";
}

export default function ConsumableSelector({
  onProductSelect,
  disabled = false,
  placeholder,
  inputPlaceholder,
  className,
  search,
  onSearchChange,
  popoverWidth = "trigger",
}: ConsumableSelectorProps) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const [open, setOpen] = useState(false);

  const { data: productKnowledges, isFetching: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "consumable", "search", search],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 14,
        name: search,
        status: "active",
        product_type: ProductKnowledgeType.consumable,
      },
    }),
    enabled: open,
  });

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full", className)}
          disabled={disabled}
        >
          <PlusIcon />
          <span className="truncate">{placeholder || t("add_item")}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`${
          popoverWidth === "auto"
            ? "w-auto min-w-75"
            : "w-[var(--radix-popover-trigger-width)]"
        } p-0`}
      >
        <Command className="rounded-lg" filter={() => 1}>
          <CommandInput
            placeholder={inputPlaceholder || t("search_consumables")}
            onValueChange={onSearchChange}
            value={search}
            className="border-none ring-0"
          />
          <CommandList className="max-h-[35vh] overflow-auto">
            <CommandEmpty>
              {search.length < 3 ? (
                <p className="p-4 text-sm text-gray-500">
                  {t("min_char_length_error", { min_length: 3 })}
                </p>
              ) : isProductLoading ? (
                <p className="p-4 text-sm text-gray-500">{t("searching")}</p>
              ) : (
                <p className="p-4 text-sm text-gray-500">
                  {t("no_results_found")}
                </p>
              )}
            </CommandEmpty>
            <CommandGroup>
              {productKnowledges?.results?.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name}
                  onSelect={() => {
                    onProductSelect(product);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{product.name}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
