import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ValueSetSearchContent from "@/components/Questionnaire/ValueSetSearchContent";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { Code } from "@/types/base/code/code";
import { ProductKnowledgeBase } from "@/types/inventory/productKnowledge/productKnowledge";
import productKnowledgeApi from "@/types/inventory/productKnowledge/productKnowledgeApi";

interface Props {
  onSelect: (value: Code) => void;
  onProductSelect: (product: ProductKnowledgeBase) => void;
  disabled?: boolean;
  placeholder?: string;
  title?: string;
  value?: Code;
  hideTrigger?: boolean;
  wrapTextForSmallScreen?: boolean;
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
}: Props) {
  const { t } = useTranslation();
  const { facilityId } = useCurrentFacilitySilently();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"product" | "valueset">("product");
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: productKnowledge, isFetching: isProductLoading } = useQuery({
    queryKey: ["productKnowledge", "medication", search],
    queryFn: query.debounced(productKnowledgeApi.listProductKnowledge, {
      queryParams: {
        facility: facilityId,
        limit: 100,
        offset: 0,
        name: search,
        product_type: "medication",
        status: "active",
      },
    }),
  });

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open]);

  const renderTabContent = () => (
    <Tabs
      value={activeTab}
      onValueChange={(value: string) =>
        setActiveTab(value as "product" | "valueset")
      }
      className="w-full"
    >
      <div className="flex items-center border-b">
        <TabsList className="h-10 w-full px-2">
          <TabsTrigger value="product" className="flex-1">
            {t("in_stock")}
          </TabsTrigger>
          <TabsTrigger value="valueset" className="flex-1">
            {t("medication_list")}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="product" className="p-0">
        <Command className="rounded-lg" filter={() => 1}>
          <CommandInput
            placeholder={t("search_products")}
            onValueChange={setSearch}
            value={search}
            className="border-none ring-0"
          />
          <CommandList className="max-h-[300px] overflow-auto">
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
              {productKnowledge?.results?.map((product) => (
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
      </TabsContent>

      <TabsContent value="valueset" className="p-0">
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
        />
      </TabsContent>
    </Tabs>
  );

  if (isMobile && !hideTrigger) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
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
        </SheetTrigger>
        <SheetContent side="bottom" className="px-0 pt-2 pb-0 rounded-t-2xl">
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
          <div className="mt-8 h-full overflow-y-auto">
            {renderTabContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (hideTrigger) {
    return renderTabContent();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate">{value?.display || placeholder}</span>
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[600px] p-0" align="start">
        {renderTabContent()}
      </PopoverContent>
    </Popover>
  );
}
