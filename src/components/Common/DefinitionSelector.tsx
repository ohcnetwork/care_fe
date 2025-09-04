import { Plus, Search, WalletMinimal } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

type ItemDetails = {
  label: string;
  value?: string | undefined;
};

export type SelectableItem = {
  value: string;
  label: string;
  details: ItemDetails[];
};

interface DefinitionSelectorProps {
  title: string;
  description?: string;
  value?: SelectableItem;
  onChange: (value: SelectableItem) => void;
  options: SelectableItem[];
  isLoading: boolean;
  placeholder: string;
  onSearch?: (query: string) => void;
  canCreate?: boolean;
  createForm?: (onSuccess: () => void) => React.ReactNode;
}

export default function DefinitionSelector({
  title,
  description,
  value,
  onChange,
  options,
  isLoading,
  placeholder,
  onSearch,
  canCreate,
  createForm,
}: DefinitionSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<
    SelectableItem | undefined
  >(value);

  const handleSubmit = () => {
    if (selectedItem) {
      onChange(selectedItem);
      setIsOpen(false);
    }
  };

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setSearch("");
          if (onSearch) {
            onSearch("");
          }
        }
        setSelectedItem(undefined);
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-full gap-2">
          <WalletMinimal className="size-4" />
          <span className="text-gray-950 font-medium">{placeholder}</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 md:max-w-[400px] gap-0 "
      >
        <div className="flex flex-col gap-2 border-b px-4 py-2">
          <div>
            <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
            {description && (
              <SheetDescription className="mt-1.5 text-sm">
                {description}
              </SheetDescription>
            )}
          </div>

          <div className="flex flex-col gap-1">
            {value && (
              <div className="flex flex-col gap-1">
                <span className="text-gray-500">{t("current")}</span>
                <div className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-1 text-sm ">
                  <span className="font-medium">{value.label}</span>
                  {value.details.map(({ label, value }, index) => (
                    <div key={index} className="flex text-sm">
                      <span className="text-gray-500">{label}: </span>
                      <span className="ml-1 text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedItem && selectedItem.value !== value?.value && (
              <div className="flex flex-col gap-1">
                <span className="text-sm text-gray-500">{t("selected")}</span>
                <div className="flex items-center justify-between rounded-md border border-primary px-3 py-1 text-sm ">
                  <span className="font-medium">{selectedItem.label}</span>
                  {selectedItem.details.map(({ label, value }, index) => (
                    <div key={index} className="flex text-sm">
                      <span className="text-gray-500">{label}: </span>
                      <span className="ml-1 text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <Command
          className="overflow-hidden rounded-none border-none"
          filter={() => 1}
        >
          {canCreate && (
            <div className="px-4 py-2 border-b">
              <Sheet
                open={isCreateSheetOpen}
                onOpenChange={setIsCreateSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => setIsCreateSheetOpen(true)}
                  >
                    <Plus className="size-4" />
                    {t("create_new")}
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="flex h-full w-full flex-col overflow-y-auto md:max-w-[600px] lg:max-w-[800px]"
                >
                  <div className="flex-1 overflow-y-auto py-6">
                    {createForm?.(() => setIsCreateSheetOpen(false))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}

          <CommandInput
            placeholder={t("search")}
            value={search}
            onValueChange={(value) => {
              setSearch(value);
              if (onSearch) {
                onSearch(value);
              }
            }}
            className="border-0 focus:ring-0"
          />

          {isLoading ? (
            <div className="p-4">
              <FormSkeleton rows={3} />
            </div>
          ) : (
            <CommandEmpty className="text-center font-medium">
              <Card className="flex flex-col items-center justify-center p-8 text-center border-none shadow-none">
                <div className="rounded-full bg-primary/10 p-3 mb-2">
                  <Search className="size-4 text-primary" />
                </div>
                <p className="text-sm sm:text-base font-medium text-gray-500">
                  {t("no_results_found")}
                </p>
              </Card>
            </CommandEmpty>
          )}

          <CommandGroup className="overflow-hidden p-0">
            <ScrollArea className="h-[calc(100vh-5rem)]">
              {isLoading ? (
                <div className="p-4">
                  <FormSkeleton rows={5} />
                </div>
              ) : (
                <div className="p-2">
                  {options.map((option) => {
                    const isSelected = selectedItem?.value === option.value;

                    return (
                      <CommandItem
                        key={option.value}
                        value={option.label}
                        onSelect={() => setSelectedItem(option)}
                        className={`mx-2 flex cursor-pointer items-center justify-between rounded-md px-3 py-2 ${
                          isSelected ? "bg-primary/40" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-row justify-between w-full">
                          <span className="font-medium">{option.label}</span>
                          {option.details.map(({ label, value }, index) => (
                            <div key={index} className="flex text-sm">
                              <span className="text-gray-500">{label}: </span>
                              <span className="ml-1 text-gray-900">
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CommandItem>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CommandGroup>
        </Command>

        <SheetFooter className="p-4 border-t">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="w-full sm:w-auto"
          >
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedItem}
            className="w-full sm:w-auto"
          >
            {t("save")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
