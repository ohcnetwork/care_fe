import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import ColoredIndicator from "@/CAREUI/display/ColoredIndicator";
import CareIcon from "@/CAREUI/icons/CareIcon";
import duoToneIcons from "@/CAREUI/icons/DuoTonePaths.json";

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

import query from "@/Utils/request/query";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import healthcareServiceApi from "@/types/healthcareService/healthcareServiceApi";

type DuoToneIconName = keyof typeof duoToneIcons;

interface HealthcareServiceSelectorProps {
  selected: HealthcareServiceReadSpec | null;
  onSelect: (service: HealthcareServiceReadSpec | null) => void;
  facilityId: string;
  clearSelection?: boolean;
}

export const HealthcareServiceSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection = false,
}: HealthcareServiceSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const {
    data: services,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["healthcareServices", facilityId, searchValue],
    queryFn: query.debounced(healthcareServiceApi.listHealthcareService, {
      pathParams: { facilityId },
      queryParams: {
        limit: 50,
        ...(searchValue && { name: searchValue }),
      },
    }),
    enabled: open,
  });

  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild disabled={isLoading}>
        <Button
          variant="outline"
          role="combobox"
          className="min-w-60 w-full justify-start"
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <div className="relative size-6 rounded-sm flex items-center justify-center">
                <ColoredIndicator
                  id={selected.id}
                  className="absolute inset-0 rounded-sm opacity-20"
                />
                <CareIcon
                  icon={
                    selected.styling_metadata?.careIcon
                      ? getIconName(selected.styling_metadata.careIcon)
                      : "d-health-worker"
                  }
                  className="size-4 relative z-1"
                />
              </div>
              <span className="truncate">{selected.name}</span>
            </div>
          ) : (
            <span className="text-gray-400">
              {t("select_healthcare_service")}
            </span>
          )}
          <CaretDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search")}
            className="outline-hidden border-none ring-0 shadow-none"
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? t("searching") : t("no_services_found")}
            </CommandEmpty>
            <CommandGroup>
              {selected && clearSelection && (
                <CommandItem
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                  className="cursor-pointer w-full h-9"
                >
                  <>
                    <XIcon />
                    <span> {t("clear_selection")}</span>
                  </>
                </CommandItem>
              )}
              {services?.results.map((service) => (
                <CommandItem
                  key={service.id}
                  value={service.name}
                  onSelect={() => {
                    onSelect(service);
                    setOpen(false);
                  }}
                  className="cursor-pointer w-full"
                >
                  <div className="flex items-center gap-2 w-full">
                    <div className="relative size-6 rounded-sm flex items-center justify-center">
                      <ColoredIndicator
                        id={service.id}
                        className="absolute inset-0 rounded-sm opacity-20"
                      />
                      <CareIcon
                        icon={
                          service.styling_metadata?.careIcon
                            ? getIconName(service.styling_metadata.careIcon)
                            : "d-health-worker"
                        }
                        className="size-4 relative z-1"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className="truncate text-sm font-medium"
                        title={service.name}
                      >
                        {service.name}
                      </span>
                      {service.extra_details && (
                        <span className="text-xs text-gray-500 truncate">
                          {service.extra_details}
                        </span>
                      )}
                    </div>
                    {selected?.id === service.id && (
                      <CheckIcon className="ml-auto" />
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
