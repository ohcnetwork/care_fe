import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { stringifyNestedObject } from "@/Utils/utils";
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationSearchProps {
  facilityId: string;
  mode?: "kind" | "instance";
  onSelect: (location: LocationList | null) => void;
  disabled?: boolean;
  value?: LocationList | null;
  className?: string;
}

export function LocationSearch({
  facilityId,
  mode,
  onSelect,
  disabled,
  value,
  className,
}: LocationSearchProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId, mode, search],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode, name: search, form: "bd", available: "true" },
    }),
    enabled: facilityId !== "preview",
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div
          className={cn(
            "w-full h-9 px-3 rounded-lg border border-gray-300 text-sm shadow-sm transition-colors bg-white flex items-center justify-between cursor-pointer text-gray-950",
            className,
          )}
          role="combobox"
          aria-expanded={open}
        >
          {stringifyNestedObject(value || { name: "" }) || (
            <span className="text-gray-500">Select location...</span>
          )}
          {value && (
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              variant="ghost"
              className="hover:bg-transparent"
            >
              <CareIcon icon="l-times" className="h-4 w-4" />
            </Button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="min-w-[250px] max-w-[400px] w-full p-0">
        <Command className="pt-1">
          <CommandInput
            placeholder="Search locations..."
            value={search}
            className="outline-none border-none ring-0 shadow-none"
            onValueChange={setSearch}
          />
          <CommandEmpty>{t("no_locations_found")}</CommandEmpty>
          <CommandGroup>
            {locations?.results.map((location) => (
              <CommandItem
                key={location.id}
                value={location.name}
                onSelect={() => {
                  onSelect(location);
                  setOpen(false);
                }}
              >
                {stringifyNestedObject(location)}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
