import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown as CaretSortIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
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
  value,
  onSelect,
  setOpen,
}: DeviceCommandContentProps) {
  const { t } = useTranslation();

  return (
    <Command>
      <CommandInput
        placeholder={t("search_devices")}
        aria-label={t("search_devices")}
        value={search}
        onValueChange={setSearch}
        wrapperClassName="border-b border-gray-100 p-2 shadow-xs md:pt-2"
        className="text-base sm:text-sm"
        autoFocus
      />
      <CommandList className="scrollbar-gutter-auto">
        {isPending ? (
          <CardListSkeleton count={3} />
        ) : (
          <CommandEmpty>{t("no_devices_found")}</CommandEmpty>
        )}
        <CommandGroup>
          {devices?.map((device) => (
            <CommandItem
              key={device.id}
              value={device.registered_name}
              data-checked={value?.id === device.id}
              onSelect={() => {
                onSelect(device);
                setOpen(false);
              }}
            >
              <DeviceItem device={device} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
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
        <DrawerContent
          aria-describedby={undefined}
          height="fixed"
          className="p-1.5"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
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
      <PopoverContent className="p-0 pointer-events-auto w-[var(--anchor-width)] overflow-clip">
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
