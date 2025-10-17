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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useBreakpoints from "@/hooks/useBreakpoints";

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
      <span className="text-sm font-medium text-nowrap truncate max-w-[100px] sm:max-w-none">
        {title}
      </span>
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

interface RequirementsContentProps {
  value: RequirementItem[];
  options: RequirementItem[];
  isLoading: boolean;
  onSearch?: (query: string) => void;
  customSelector?: React.ReactNode;
  canCreate?: boolean;
  isCreateSheetOpen: boolean;
  setIsCreateSheetOpen: React.Dispatch<React.SetStateAction<boolean>>;
  createForm?: (onSuccess: () => void) => React.ReactNode;
  allowDuplicate?: boolean;
  removeItem: (index: number) => void;
  addOption: (option: RequirementItem) => void;
}

function RequirementsContent({
  value,
  options,
  isLoading,
  onSearch,
  customSelector,
  canCreate,
  isCreateSheetOpen,
  setIsCreateSheetOpen,
  createForm,
  allowDuplicate = false,
  removeItem,
  addOption,
}: RequirementsContentProps) {
  const { t } = useTranslation();

  if (customSelector) {
    return <div className="overflow-y-auto">{customSelector}</div>;
  }

  return (
    <Command filter={() => 1}>
      {value.length > 0 && (
        <div className="flex flex-nowrap sm:flex-wrap border-b gap-2 p-1.5 overflow-x-auto flex-shrink-0 sm:max-h-32 mr-2">
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
        <div className="px-4 py-2 border-b">
          <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
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
        className="border-0 focus:ring-0 text-base sm:text-sm"
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
      <CommandGroup className="overflow-y-auto max-h-[55dvh] md:max-h-[50dvh] lg:max-h-[40dvh]">
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
      </CommandGroup>
    </Command>
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
  const [isOpen, setIsOpen] = React.useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const { t } = useTranslation();

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

  const renderTriggerButton = (
    <Button
      type="button"
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
  );

  return isMobile ? (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col gap-3">
        <DrawerTrigger asChild>{renderTriggerButton}</DrawerTrigger>

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

      <DrawerContent>
        <div className="flex flex-col border-b px-3 py-2 mb-1.5">
          <DrawerTitle className="text-lg font-semibold">{title}</DrawerTitle>
          {description && (
            <DrawerDescription className="mt-1.5 text-sm">
              {description}
            </DrawerDescription>
          )}
        </div>
        <RequirementsContent
          value={value}
          options={options}
          isLoading={isLoading}
          onSearch={onSearch}
          customSelector={customSelector}
          canCreate={canCreate}
          isCreateSheetOpen={isCreateSheetOpen}
          setIsCreateSheetOpen={setIsCreateSheetOpen}
          createForm={createForm}
          allowDuplicate={allowDuplicate}
          removeItem={removeItem}
          addOption={addOption}
        />
      </DrawerContent>
    </Drawer>
  ) : (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex flex-col gap-3">
        <PopoverTrigger asChild>{renderTriggerButton}</PopoverTrigger>

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

      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)]">
        <div className="flex flex-col border-b px-3 py-2 mb-1.5">
          {description && <p className="mt-1.5 text-sm">{description}</p>}
        </div>
        <RequirementsContent
          value={value}
          options={options}
          isLoading={isLoading}
          onSearch={onSearch}
          customSelector={customSelector}
          canCreate={canCreate}
          isCreateSheetOpen={isCreateSheetOpen}
          setIsCreateSheetOpen={setIsCreateSheetOpen}
          createForm={createForm}
          allowDuplicate={allowDuplicate}
          removeItem={removeItem}
          addOption={addOption}
        />
      </PopoverContent>
    </Popover>
  );
}
