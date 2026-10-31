import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
import useBreakpoints from "@/hooks/useBreakpoints";

type DuoToneIconName = keyof typeof duoToneIcons;

interface IconPickerProps {
  value: string;
  onChange: (value: string) => void;
}

export default function IconPicker({ value, onChange }: IconPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });

  // Get all icon names from DuoTonePaths.json
  const iconNames = Object.keys(duoToneIcons).map((name) =>
    name.replace("d-", ""),
  );

  const getIconName = (name: string): DuoToneIconName =>
    `d-${name}` as DuoToneIconName;

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      aria-expanded={open}
      className="w-full justify-between"
    >
      <div className="flex items-center gap-2">
        {value ? (
          <>
            <CareIcon icon={getIconName(value)} className="size-5" />
            <span>{value}</span>
          </>
        ) : (
          t("select_icon")
        )}
      </div>
      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>
  );

  const content = (
    <Command>
      <CommandInput
        placeholder={t("search_icons")}
        aria-label={t("search_icons")}
        wrapperClassName="border-b border-gray-100 p-2 shadow-xs md:pt-2"
        className="text-base sm:text-sm"
      />
      <CommandList>
        <CommandEmpty>{t("no_icons_found")}</CommandEmpty>
        <CommandGroup>
          {iconNames.map((iconName) => (
            <CommandItem
              key={iconName}
              onSelect={() => {
                onChange(iconName);
                setOpen(false);
              }}
              className="flex items-center gap-2 max-md:min-h-11"
            >
              <div className="flex w-full items-center gap-2">
                <CareIcon icon={getIconName(iconName)} className="size-5" />
                <span>{iconName}</span>
              </div>
              {value === iconName && (
                <Check className="ml-auto h-4 w-4 opacity-100" />
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <div className="w-full">
        <Drawer open={open} onOpenChange={setOpen}>
          <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
          <DrawerContent
            aria-describedby={undefined}
            height="fixed"
            className="p-1.5"
          >
            <DrawerHeader showCloseButton>
              <DrawerTitle>{t("select_icon")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent className="w-150 p-0 overflow-clip">
        {content}
      </PopoverContent>
    </Popover>
  );
}
