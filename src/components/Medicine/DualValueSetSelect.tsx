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

type TabIndex = 0 | 1;

interface DualValueSetSelectProps {
  systems: [ValueSetSystem, ValueSetSystem];
  values?: [Code | null, Code | null];
  onSelect: (index: TabIndex, value: Code | null) => void;
  placeholders?: [string, string];
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  labels: [string, string];
}

export function DualValueSetSelect({
  systems,
  values = [null, null],
  onSelect,
  placeholders = [t("search"), t("search")],
  disabled,
  count = 10,
  searchPostFix = "",
  labels,
}: DualValueSetSelectProps) {
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [open, setOpen] = useState(false);
  const hasValues = values.some((v) => v !== null);

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
            className={cn(
              "w-full justify-start h-auto min-h-10 py-2",
              "text-left",
              !hasValues && "text-gray-400",
            )}
          >
            {!hasValues ? (
              <span>{placeholders[0]}</span>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                {values.map(
                  (value, index) =>
                    value && (
                      <div
                        key={value.code}
                        className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 min-w-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveTab(index as TabIndex);
                          setOpen(true);
                        }}
                      >
                        <span className="text-sm truncate flex-1 mr-2">
                          {value.display}
                        </span>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(index as TabIndex, null);
                          }}
                          variant="ghost"
                          size="icon"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ),
                )}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Tabs
            value={activeTab.toString()}
            onValueChange={(value) => {
              setActiveTab(Number(value) as TabIndex);
            }}
          >
            <TabsList className="w-full">
              <TabsTrigger value="0" className="flex-1">
                {labels[0]}
              </TabsTrigger>
              <TabsTrigger value="1" className="flex-1">
                {labels[1]}
              </TabsTrigger>
            </TabsList>
            <div className="">
              <ValueSetSelect
                system={systems[activeTab]}
                value={values[activeTab]}
                onSelect={(value) => {
                  onSelect(activeTab, value);
                  if (activeTab === 0) {
                    setActiveTab(1);
                  } else {
                    setOpen(false);
                  }
                }}
                placeholder={placeholders[activeTab]}
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
