import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
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
import { DeviceList } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";

interface DeviceSearchProps {
  facilityId: string;
  onSelect: (device: DeviceList) => void;
  disabled?: boolean;
  value?: DeviceList | null;
}

export function DeviceSearch({
  facilityId,
  onSelect,
  disabled,
  value,
}: DeviceSearchProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: devices } = useQuery({
    queryKey: ["devices", facilityId, search],
    queryFn: query(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { search_text: search },
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
          {value?.registered_name || t("select_device")}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command className="pt-1">
          <CommandInput
            placeholder={t("search_devices")}
            value={search}
            className="outline-none border-none ring-0 shadow-none"
            onValueChange={setSearch}
          />
          <CommandEmpty>{t("no_devices_found")}</CommandEmpty>
          <CommandGroup>
            {devices?.results.map((device) => (
              <CommandItem
                key={device.id}
                value={device.registered_name}
                onSelect={() => {
                  onSelect(device);
                  setOpen(false);
                }}
              >
                {device.registered_name}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
