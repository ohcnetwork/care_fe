import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { stringifyNestedObject } from "@/Utils/utils";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  LocationForm,
  LocationMode,
  LocationRead,
} from "@/types/location/location";
import locationApi from "@/types/location/locationApi";

interface LocationSearchProps {
  facilityId: string;
  mode?: LocationMode;
  form?: LocationForm;
  onSelect: (location: LocationRead) => void;
  disabled?: boolean;
  value: LocationRead | null;
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
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: locations } = useQuery({
    queryKey: ["locations", facilityId, mode, search],
    queryFn: query.debounced(locationApi.list, {
      pathParams: { facility_id: facilityId },
      queryParams: { mode, name: search, form },
    }),
    enabled: facilityId !== "preview",
  });
  const displayText = value ? stringifyNestedObject(value) : "";
  const triggerTitle =
    typeof displayText === "string" && displayText ? displayText : undefined;

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      title={triggerTitle}
      aria-label={t("select_location")}
      className="w-full min-w-0 justify-between font-normal"
    >
      <span className={cn("truncate", !displayText && "text-muted-foreground")}>
        {displayText || t("select_location")}
      </span>
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </Button>
  );

  const commandContent = (
    <Command shouldFilter={false}>
      <CommandInput
        placeholder={t("search_locations")}
        aria-label={t("search_locations")}
        value={search}
        wrapperClassName="border-b border-gray-100 shadow-xs"
        className="text-base sm:text-sm"
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList className="scrollbar-gutter-auto">
        <CommandEmpty>{t("no_locations_found")}</CommandEmpty>
        <CommandGroup>
          {locations?.results.map((location) => (
            <CommandItem
              key={location.id}
              value={location.id}
              data-checked={value?.id === location.id}
              onSelect={() => {
                onSelect(location);
                setOpen(false);
              }}
            >
              {stringifyNestedObject(location)}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen} direction="bottom">
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent
          aria-describedby={undefined}
          height="fixed"
          className="p-1.5"
        >
          <DrawerHeader showCloseButton>
            <DrawerTitle>{t("select_location")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
            {commandContent}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="pointer-events-auto w-[var(--anchor-width)] p-0 gap-0 overflow-clip">
        {commandContent}
      </PopoverContent>
    </Popover>
  );
}
