import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

type ButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  keyof MultiSelectProps
>;
interface MultiSelectProps {
  options: {
    label: string;
    value: string;
    icon?: IconName;
  }[];
  onValueChange: (value: string[]) => void;
  value: string[];
  placeholder: string;
  className?: string;
  selectedPlaceholder?: string;
  translationBasekey?: string;
}

export function MultiSelect({
  options,
  onValueChange,
  value = [],
  placeholder,
  className,
  ref,
  selectedPlaceholder,
  translationBasekey,
  ...props
}: ButtonProps & MultiSelectProps) {
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  React.useEffect(() => {
    setSelectedValues(value);
  }, [value]);

  const { t } = useTranslation();

  const handleToggleOption = (option: string) => {
    const newSelectedValues = selectedValues.includes(option)
      ? selectedValues.filter((value) => value !== option)
      : [...selectedValues, option];
    setSelectedValues(newSelectedValues);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === options.length) {
      setSelectedValues([]);
    } else {
      const allValues = options.map((option) => option.value);
      setSelectedValues(allValues);
    }
  };

  const triggerButton = (
    <Button
      variant="outline"
      ref={ref}
      role="combobox"
      onClick={() => setOpen((open) => !open)}
      className={cn(
        "flex w-full p-1 rounded-md border min-h-10 items-center justify-between",
        className,
      )}
      {...props}
    >
      <div className="flex justify-between items-center w-full">
        {value.length == 0 ? (
          <span className="text-sm text-black mx-3">{placeholder}</span>
        ) : (
          <Badge className="m-1" variant="secondary">
            {selectedPlaceholder
              ? selectedPlaceholder
              : t("options_selected", { count: value.length })}
          </Badge>
        )}

        <ChevronDown
          id="dropdown-toggle"
          className="h-4 mx-2 cursor-pointer text-black"
        />
      </div>
    </Button>
  );

  const listContent = (
    <div>
      <Command className="flex-1 overflow-hidden">
        <div className="border border-gray-200 rounded-md m-1 mb-2">
          <CommandInput
            placeholder={
              translationBasekey
                ? t(`search_${translationBasekey}`)
                : t("search_options_here")
            }
            className="outline-hidden border-none ring-0 shadow-none"
            autoFocus
          />
        </div>
        <CommandList>
          <CommandGroup>
            <CommandItem
              key="all"
              onSelect={handleSelectAll}
              className="cursor-pointer"
            >
              <Checkbox
                checked={selectedValues.length === options.length}
                aria-label="Select all options"
                className="data-[state=checked]:text-white"
              />
              <span>{t("select_all")}</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          {value.length > 0 && (
            <>
              <CommandGroup heading={t("selected")}>
                {options
                  .filter((option) => value.includes(option.value))
                  .map((option) => (
                    <CommandItem
                      key={option.value}
                      onSelect={() => handleToggleOption(option.value)}
                      className="cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedValues.includes(option.value)}
                        className="data-[state=checked]:text-white"
                      />
                      {option?.icon && (
                        <CareIcon icon={option.icon} className="size-4" />
                      )}
                      <span>{option.label}</span>
                    </CommandItem>
                  ))}
              </CommandGroup>

              <CommandSeparator />
            </>
          )}

          {value.length < options.length && (
            <CommandGroup>
              {options
                .filter((option) => !value.includes(option.value))
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => handleToggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedValues.includes(option.value)}
                      className="data-[state=checked]:text-white"
                    />
                    {option?.icon && (
                      <CareIcon icon={option.icon} className="size-4" />
                    )}
                    <span>{option.label}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          )}
        </CommandList>
      </Command>
      <div className="flex justify-end space-x-2 p-3 border-t border-t-gray-200 shrink-0">
        <Button
          variant="link"
          className="underline"
          onSelect={() => alert("cancel")}
        >
          {t("cancel")}
        </Button>
        <Button onSelect={() => onValueChange(selectedValues)}>
          {t("done")} <ShortcutBadge actionId="enter-action" />
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="w-full">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent className="px-0 pt-2">
            <div className="mt-3 pb-[env(safe-area-inset-bottom)]">
              {listContent}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={setOpen} modal>
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
        <PopoverContent
          className="p-0 w-(--radix-popover-trigger-width) max-h-96 overflow-y-hidden flex flex-col"
          align="center"
        >
          {listContent}
        </PopoverContent>
      </Popover>
    </div>
  );
}

MultiSelect.displayName = "MultiSelect";
