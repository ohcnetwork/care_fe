import { ChevronDown, XCircle, XIcon } from "lucide-react";
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
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface MultiSelectProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  options: {
    label: string;
    value: string;
    icon?: IconName;
  }[];
  onValueChange: (value: string[]) => void;
  value: string[];
  placeholder: string;
  modalPopover?: boolean;
  asChild?: boolean;
  className?: string;
}

export const MultiSelect = React.forwardRef<
  HTMLButtonElement,
  MultiSelectProps
>(
  (
    {
      options,
      onValueChange,
      value = [],
      placeholder,
      modalPopover = false,
      className,
      ...props
    },
    ref,
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
    const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

    React.useEffect(() => {
      setSelectedValues(value);
    }, [value]);

    const { t } = useTranslation();

    const toggleOption = (option: string) => {
      const newSelectedValues = selectedValues.includes(option)
        ? selectedValues.filter((value) => value !== option)
        : [...selectedValues, option];
      setSelectedValues(newSelectedValues);
      onValueChange(newSelectedValues);
    };

    const handleClear = () => {
      setSelectedValues([]);
      onValueChange([]);
    };

    const handleTogglePopover = () => {
      setIsPopoverOpen((prev) => !prev);
    };

    const toggleAll = () => {
      if (selectedValues.length === options.length) {
        handleClear();
      } else {
        const allValues = options.map((option) => option.value);
        setSelectedValues(allValues);
        onValueChange(allValues);
      }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
      e.stopPropagation();
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      e.stopPropagation();
    };

    return (
      <div className="w-full">
        <Popover
          open={isPopoverOpen}
          onOpenChange={setIsPopoverOpen}
          modal={modalPopover}
        >
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              {...props}
              onClick={handleTogglePopover}
              className={cn(
                "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                className,
              )}
            >
              {selectedValues.length > 0 ? (
                <div className="flex justify-between items-center w-full">
                  <div className="flex flex-wrap items-center">
                    {selectedValues.map((value) => {
                      const option = options.find((o) => o.value === value);
                      return (
                        <Badge
                          key={value}
                          className="m-1 border-foreground/10 bg-secondary text-black hover:bg-secondary/80"
                        >
                          {option?.icon && (
                            <CareIcon
                              icon={option.icon}
                              className="h-4 w-4 mr-2"
                            />
                          )}
                          {option?.label}
                          <XCircle
                            className="ml-2 h-4 w-4 cursor-pointer"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleOption(value);
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between">
                    <XIcon
                      className="h-4 mx-2 cursor-pointer text-black"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleClear();
                      }}
                    />
                    <ChevronDown
                      id="dropdown-toggle"
                      className="h-4 mx-2 cursor-pointer text-black"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between w-full mx-auto">
                  <span className="text-sm text-black mx-3">{placeholder}</span>
                  <ChevronDown
                    id="dropdown-toggle"
                    className="h-4 mx-2 cursor-pointer text-black"
                  />
                </div>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-full"
            align="center"
            onEscapeKeyDown={() => setIsPopoverOpen(false)}
            onWheel={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
          >
            <Command>
              <CommandList
                className="max-h-64 overflow-y-auto overflow-x-hidden touch-auto"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
              >
                <CommandGroup>
                  <CommandItem
                    key="all"
                    onSelect={toggleAll}
                    className="cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedValues.length === options.length}
                    />
                    <span>{t("select_all")}</span>
                  </CommandItem>
                  {options.map((option) => {
                    const isSelected = selectedValues.includes(option.value);
                    return (
                      <CommandItem
                        key={option.value}
                        onSelect={() => toggleOption(option.value)}
                        className="cursor-pointer"
                      >
                        <Checkbox checked={isSelected} />
                        {option?.icon && (
                          <CareIcon
                            icon={option.icon}
                            className="mr-2 h-4 w-4"
                          />
                        )}
                        <span>{option.label}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup>
                  <div className="flex items-center justify-between">
                    {selectedValues.length > 0 && (
                      <>
                        <CommandItem
                          onSelect={handleClear}
                          className="flex-1 justify-center cursor-pointer"
                        >
                          {t("clear")}
                        </CommandItem>
                        <Separator
                          orientation="vertical"
                          className="flex min-h-6 h-full"
                        />
                      </>
                    )}
                    <CommandItem
                      onSelect={() => setIsPopoverOpen(false)}
                      className="flex-1 justify-center cursor-pointer max-w-full"
                    >
                      {t("close")}
                    </CommandItem>
                  </div>
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
    );
  },
);

MultiSelect.displayName = "MultiSelect";
