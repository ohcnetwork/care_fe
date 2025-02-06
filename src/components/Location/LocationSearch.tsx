import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

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
  mode?: "kind" | "location";
  onSelect: (location: LocationList) => void;
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
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search locations..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandEmpty>No locations found.</CommandEmpty>
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
                {location.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
