import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import useBreakpoints from "@/hooks/useBreakpoints";
import DeviceTypeIcon from "@/pages/Facility/settings/devices/components/DeviceTypeIcon";
import { DeviceList } from "@/types/device/device";
import deviceApi from "@/types/device/deviceApi";
import query from "@/Utils/request/query";
import { isAppleDevice } from "@/Utils/utils";

interface DeviceSearchProps {
  facilityId: string;
  onSelect: (device: DeviceList) => void;
  disabled?: boolean;
  value?: DeviceList | null;
}

interface DeviceCommandContentProps {
  search: string;
  setSearch: (value: string) => void;
  devices?: DeviceList[];
  isPending: boolean;
  value?: DeviceList | null;
  onSelect: (device: DeviceList) => void;
  setOpen: (value: boolean) => void;
}

function DeviceCommandContent({
  search,
  setSearch,
  devices,
  isPending,
  onSelect,
  setOpen,
}: DeviceCommandContentProps) {
  const { t } = useTranslation();

  return (
    <Command>
      <CommandInput
        placeholder={t("search_devices")}
        value={search}
        onValueChange={setSearch}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
        autoFocus={!isAppleDevice}
      />
      {isPending ? (
        <CardListSkeleton count={3} />
      ) : (
        <CommandEmpty>{t("no_devices_found")}</CommandEmpty>
      )}
      <CommandGroup className="overflow-y-auto">
        {devices?.map((device) => (
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
  );
}

export function DeviceSearch({
  facilityId,
  onSelect,
  disabled,
  value,
}: DeviceSearchProps) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data, isPending } = useQuery({
    queryKey: ["devices", facilityId, search],
    queryFn: query.debounced(deviceApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { search_text: search },
    }),
    enabled: facilityId !== "preview",
  });
  const devices = data?.results;

  const renderTriggerButton = () => (
    <Button
      title={value?.registered_name || t("select_device")}
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
      disabled={disabled}
    >
      {value ? (
        <DeviceItem device={value} />
      ) : (
        <span className="text-gray-500">{t("select_device")}</span>
      )}
      <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild disabled={disabled}>
          {renderTriggerButton()}
        </DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh] rounded-t-lg">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            <DeviceCommandContent
              search={search}
              setSearch={setSearch}
              devices={devices}
              isPending={isPending}
              value={value}
              onSelect={onSelect}
              setOpen={setOpen}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        {renderTriggerButton()}
      </PopoverTrigger>
      <PopoverContent className="p-0 pointer-events-auto w-[var(--radix-popover-trigger-width)]">
        <DeviceCommandContent
          search={search}
          setSearch={setSearch}
          devices={devices}
          isPending={isPending}
          value={value}
          onSelect={onSelect}
          setOpen={setOpen}
        />
      </PopoverContent>
    </Popover>
  );
}

const DeviceItem = ({ device }: { device: DeviceList }) => {
  return (
    <div className="flex items-center gap-2">
      <DeviceTypeIcon type={device.care_type} className="size-4" />
      {device.registered_name}
    </div>
  );
};
