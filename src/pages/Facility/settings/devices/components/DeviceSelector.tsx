import { CaretSortIcon, CubeIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useState } from "react";

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

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";
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

  const { data: devices, isPending } = useQuery({
    queryKey: ["devices", facilityId, search],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { search_text: search },
    }),
    enabled: facilityId !== "preview",
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          title={value?.registered_name || t("select_device")}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
          onClick={() => setOpen(!open)}
        >
          {value ? (
            <DeviceItem device={value} />
          ) : (
            <span className="text-gray-500">{t("select_device")}</span>
          )}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]">
        <Command>
          <CommandInput
            placeholder={t("search_devices")}
            value={search}
            onValueChange={setSearch}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          {isPending ? (
            <CardListSkeleton count={3} />
          ) : (
            <CommandEmpty>{t("no_devices_found")}</CommandEmpty>
          )}
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
                <DeviceItem device={device} />
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const DeviceItem = ({ device }: { device: DeviceList }) => {
  const deviceManifests = usePluginDevices();
  const deviceConfig = deviceManifests.find((c) => c.type === device.care_type);
  const DeviceIcon = deviceConfig?.icon || CubeIcon;

  return (
    <div className="flex items-center gap-2">
      {DeviceIcon && <DeviceIcon className="size-4" />}
      {device.registered_name}
    </div>
  );
};
