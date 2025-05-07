import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
import {
  LocationForm,
  LocationList,
  LocationMode,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationSearchProps {
  facilityId: string;
  mode?: LocationMode;
  form?: LocationForm;
  onSelect: (location: LocationList) => void;
  disabled?: boolean;
  value?: LocationList | null;
}

export function LocationSearch({
  facilityId,
  mode,
  form,
  onSelect,
  disabled,
  value,
}: LocationSearchProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId, mode, search],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode, name: search, form },
    }),
    enabled: facilityId !== "preview",
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        asChild
        disabled={disabled}
        data-cy="location-search-trigger"
      >
        <div
          className="w-full h-9 px-3 rounded-md border border-gray-200 text-sm flex items-center justify-between cursor-pointer"
          role="combobox"
          aria-expanded={open}
        >
          {stringifyNestedObject(value || { name: "" }) || "Select location..."}
        </div>
      </PopoverTrigger>
      <PopoverContent className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]">
        <Command className="pt-1">
          <CommandInput
            placeholder="Search locations..."
            value={search}
            className="outline-hidden border-none ring-0 shadow-none"
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
