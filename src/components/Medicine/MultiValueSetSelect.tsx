import { t } from "i18next";
import { X } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code, ValueSetSystem } from "@/types/questionnaire/code";

interface ValueSetOption {
  system: ValueSetSystem;
  value: Code | null;
  placeholder?: string;
  label: string;
  onSelect: (value: Code | null) => void;
}

interface MultiValueSetSelectProps {
  options: ValueSetOption[];
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
}

export function MultiValueSetSelect({
  options,
  disabled,
  count = 10,
  searchPostFix = "",
}: MultiValueSetSelectProps) {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [open, setOpen] = useState(false);
  const hasValues = options.some((opt) => opt.value !== null);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      setActiveTab(0);
    }
  };

  return (
    <div className="w-full">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            disabled={disabled}
            className={cn(
              "w-full justify-start h-auto min-h-10 py-2",
              "text-left",
              !hasValues && "text-gray-400",
            )}
          >
            {!hasValues ? (
              <span>{options[0]?.placeholder || t("search")}</span>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                {options.map(
                  (option, index) =>
                    option.value && (
                      <div
                        key={option.value.code}
                        className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 min-w-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(index);
                          setOpen(true);
                        }}
                      >
                        <span className="text-sm truncate flex-1 mr-2">
                          {option.value.display}
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            option.onSelect(null);
                          }}
                          variant="ghost"
                          size="icon"
                        >
                          <X className="size-4" />
                        </Button>
                      </div>
                    ),
                )}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 inline-block min-w-[300px]"
          align="start"
          sideOffset={4}
        >
          <Tabs
            value={activeTab.toString()}
            onValueChange={(value) => {
              setActiveTab(Number(value));
            }}
            className="w-fit"
          >
            <TabsList className="flex">
              {options.map((option, index) => (
                <TabsTrigger
                  key={index}
                  value={index.toString()}
                  className="whitespace-nowrap px-3"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <div className="w-full">
              <ValueSetSelect
                system={options[activeTab].system}
                value={options[activeTab].value}
                onSelect={(value) => {
                  options[activeTab].onSelect(value);
                  if (activeTab < options.length - 1) {
                    setActiveTab(activeTab + 1);
                  } else {
                    setOpen(false);
                  }
                }}
                placeholder={options[activeTab].placeholder || t("search")}
                disabled={disabled}
                count={count}
                searchPostFix={searchPostFix}
                wrapTextForSmallScreen
                hideTrigger
                controlledOpen={open}
              />
            </div>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
