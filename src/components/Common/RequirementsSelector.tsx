import { ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
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
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

type RequirementItem = {
  value: string;
  label: string;
  details: {
    label: string;
    value?: string | undefined;
  }[];
};

interface RequirementsSelectorProps {
  title: string;
  description?: string;
  value: RequirementItem[];
  onChange: (value: RequirementItem[]) => void;
  options: RequirementItem[];
  isLoading: boolean;
  placeholder: string;
  onSearch?: (query: string) => void;
  customSelector?: React.ReactNode;
  canCreate?: boolean;
  createForm?: (onSuccess: () => void) => React.ReactNode;
  allowDuplicate?: boolean;
}

function SelectedItemCard({
  title,
  details,
  onRemove,
}: {
  title: string;
  details: { label: string; value?: string | undefined }[];
  onRemove: () => void;
}) {
  return (
    <div className="w-full relative flex flex-col rounded-sm border border-gray-200 bg-white px-2 py-1">
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-0 rounded-full p-1 cursor-pointer"
        variant="ghost"
      >
        <Trash2 className="size-4 text-gray-500" />
      </Button>
      <p className="my-px font-medium text-sm text-gray-900">{title}</p>
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2">
        {details.map(({ label, value }, index) => (
          <div key={index} className="flex text-sm">
            <span className="text-gray-500">{label}: </span>
            <span className="ml-1 text-gray-900">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SmallSelectedItemCard({
  title,
  onRemove,
}: {
  title: string;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5">
      <span className="text-sm font-medium">{title}</span>
      <Button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        className="h-5 w-5 rounded-full p-0"
        variant="ghost"
      >
        <X className="size-3" />
      </Button>
    </div>
  );
}

export default function RequirementsSelector({
  title,
  description,
  value = [],
  onChange,
  options,
  isLoading,
  placeholder,
  onSearch,
  customSelector,
  canCreate,
  createForm,
  allowDuplicate = false,
}: RequirementsSelectorProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);

  const addOption = (option: RequirementItem) => {
    if (!allowDuplicate && !customSelector) {
      const isDuplicate = value.some((item) => item.value === option.value);
      if (isDuplicate) {
        return;
      }
    }
    onChange([...value, option]);
  };

  const removeItem = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col gap-3">
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {value.length === 0 ? (
                <span>{placeholder}</span>
              ) : (
                <span className="flex items-center gap-2">
                  <span className="font-medium">{value.length}</span>
                  {t("items_selected")}
                </span>
              )}
            </div>
            <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>

        {value.length > 0 && (
          <div className="flex flex-col gap-2">
            {value.map((item, index) => (
              <SelectedItemCard
                key={`${item.value}-${index}`}
                title={item.label}
                details={item.details || []}
                onRemove={() => removeItem(index)}
              />
            ))}
          </div>
        )}
      </div>

      <SheetContent
        side="right"
        className="flex h-full w-full flex-col p-0 md:max-w-[400px]"
      >
        <div className="flex flex-col border-b p-4">
          <SheetTitle className="text-lg font-semibold">{title}</SheetTitle>
          {description && (
            <SheetDescription className="mt-1.5 text-sm">
              {description}
            </SheetDescription>
          )}
        </div>
        {customSelector ? (
          customSelector
        ) : (
          <Command
            className="overflow-hidden rounded-none border-none"
            filter={() => 1}
          >
            {value.length > 0 && (
              <div className="flex flex-wrap gap-2 p-4 border-b">
                {value.map((item, index) => (
                  <SmallSelectedItemCard
                    key={`${item.value}-${index}`}
                    title={item.label}
                    onRemove={() => removeItem(index)}
                  />
                ))}
              </div>
            )}
            {canCreate && (
              <div className="p-4 border-b">
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
              onValueChange={onSearch}
              className="border-0 focus:ring-0"
            />
            {isLoading ? (
              <div className="p-4">
                <FormSkeleton rows={3} />
              </div>
            ) : (
              <CommandEmpty className="text-center font-medium">
                <Card className="flex flex-col items-center justify-center p-8 text-center border-none shadow-none ">
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
              <ScrollArea className="h-[calc(100vh-300px)]">
                {isLoading ? (
                  <div className="p-4">
                    <FormSkeleton rows={5} />
                  </div>
                ) : (
                  <div className="p-2">
                    {options.map((option) => {
                      const isSelected = value.some(
                        (item) => item.value === option.value,
                      );
                      const showPlusButton = allowDuplicate || !isSelected;

                      return (
                        <CommandItem
                          key={option.value}
                          value={option.label}
                          onSelect={() => addOption(option)}
                          className="mx-2 flex cursor-pointer items-center justify-between rounded-md px-2"
                        >
                          <span>{option.label}</span>
                          {showPlusButton && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addOption(option);
                              }}
                            >
                              <Plus className="size-4" />
                            </Button>
                          )}
                        </CommandItem>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CommandGroup>
          </Command>
        )}
      </SheetContent>
    </Sheet>
  );
}
