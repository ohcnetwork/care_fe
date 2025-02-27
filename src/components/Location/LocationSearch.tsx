import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
import { LocationList } from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationSearchProps {
  facilityId: string;
  mode?: "kind" | "instance";
  onSelect: (location: LocationList | null) => void;
  disabled?: boolean;
  value?: LocationList | null;
}

export function LocationSearch({
  facilityId,
  mode,
  onSelect,
  disabled,
  value,
}: LocationSearchProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId, mode, search],
    queryFn: query(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode, name: search },
    }),
    enabled: facilityId !== "preview",
  });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <div
          className="w-full h-9 px-3 rounded-md border text-sm flex items-center justify-between cursor-pointer"
          role="combobox"
          aria-expanded={open}
        >
          {value?.name || "Select location..."}
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              className="text-gray-500 hover:text-gray-700 p-1 rounded-full"
            >
              <CareIcon icon="l-times" className="h-4 w-4" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
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
                <span>{location.name}</span>
                <span className="text-xs text-gray-500">
                  {t(`location_form__${location.form}`)}
                  {" in "}
                  {formatLocationParent(location)}
                </span>
                <span className="text-xs text-gray-500 ml-auto">
                  {t(`location_status__${location.status}`)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const formatLocationParent = (location: LocationList) => {
  const parents: string[] = [];
  while (location.parent?.name) {
    parents.push(location.parent?.name);
    location = location.parent;
  }
  return parents.reverse().join(" > ");
};
