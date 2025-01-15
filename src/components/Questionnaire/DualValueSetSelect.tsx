import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
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
  placeholders = ["Search...", "Search..."],
  disabled,
  count = 10,
  searchPostFix = "",
  labels,
}: DualValueSetSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabIndex>(0);
  const [search, setSearch] = useState("");

  const searchQuery = useQuery({
    queryKey: ["valueset", systems[activeTab], "expand", count, search],
    queryFn: query.debounced(routes.valueset.expand, {
      pathParams: { system: systems[activeTab] },
      body: { count, search: search + searchPostFix },
    }),
  });

  useEffect(() => {
    if (open) {
      setSearch("");
    }
  }, [open, activeTab]);

  const handleRemove = (index: TabIndex, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(index, null);
  };

  const handleSelect = (value: Code) => {
    onSelect(activeTab, {
      code: value.code,
      display: value.display || "",
      system: value.system || "",
    });

    if (activeTab === 0) {
      setActiveTab(1);
    } else {
      setOpen(false);
    }
  };

  const hasValues = values.some((v) => v !== null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
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
                      className="flex items-center justify-between bg-gray-100 rounded px-2 py-1 min-w-0 cursor-pointer hover:bg-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(index as TabIndex);
                        setOpen(true);
                      }}
                    >
                      <span className="text-sm truncate flex-1 mr-2">
                        {value.display}
                      </span>
                      <button
                        onClick={(e) => handleRemove(index as TabIndex, e)}
                        className="hover:text-gray-700 text-gray-500 shrink-0"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ),
              )}
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Tabs
          value={activeTab.toString()}
          onValueChange={(value) => setActiveTab(Number(value) as TabIndex)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="0" className="flex-1">
              {labels[0]}
            </TabsTrigger>
            <TabsTrigger value="1" className="flex-1">
              {labels[1]}
            </TabsTrigger>
          </TabsList>
          <Command filter={() => 1}>
            <CommandInput
              placeholder={placeholders[activeTab]}
              className="outline-none border-none ring-0 shadow-none"
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {search.length < 3
                  ? t("min_char_length_error", { min_length: 3 })
                  : searchQuery.isFetching
                    ? t("searching")
                    : t("no_results_found")}
              </CommandEmpty>
              <CommandGroup>
                {searchQuery.data?.results.map((option) => (
                  <CommandItem
                    key={option.code}
                    value={option.code}
                    onSelect={() => handleSelect(option)}
                    className={cn(
                      values[activeTab]?.code === option.code &&
                        "bg-primary/10 text-primary font-medium",
                    )}
                  >
                    <span>{option.display}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
