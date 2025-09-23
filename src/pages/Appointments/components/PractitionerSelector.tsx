import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
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
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { ScheduleResourceIcon } from "@/components/Schedule/ScheduleResourceIcon";
import useBreakpoints from "@/hooks/useBreakpoints";
import {
  formatScheduleResourceName,
  SchedulableResourceType,
} from "@/types/scheduling/schedule";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { UserReadMinimal } from "@/types/user/user";

interface PractitionerSelectorProps {
  selected: UserReadMinimal | null;
  onSelect: (user: UserReadMinimal | null) => void;
  facilityId: string;
  clearSelection?: boolean;
}

export const PractitionerSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection = false,
}: PractitionerSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const {
    data: practitioners,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["practitioners", facilityId],
    queryFn: query(scheduleApi.appointments.availableUsers, {
      pathParams: { facilityId },
    }),
  });

  const triggerButton = (
    <Button
      variant="outline"
      role="combobox"
      className="min-w-60 w-full justify-start"
      disabled={isLoading}
    >
      {selected ? (
        <div className="flex items-center gap-2">
          <ScheduleResourceIcon
            resource={{
              resource_type: SchedulableResourceType.Practitioner,
              resource: selected,
            }}
            className="size-6 rounded-full"
          />
          <span>
            {formatScheduleResourceName({
              resource_type: SchedulableResourceType.Practitioner,
              resource: selected,
            })}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">{t("select_practitioner")}</span>
      )}
      <CaretDownIcon className="ml-auto" />
    </Button>
  );

  const commandContent = (
    <Command>
      <CommandInput
        placeholder={t("search")}
        className="outline-hidden border-none ring-0 shadow-none"
        autoFocus
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? t("searching") : t("no_results")}
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
          {practitioners?.users.map((user) => (
            <CommandItem
              key={user.id}
              value={`${formatName(user)} ${user.username}`}
              onSelect={() => {
                onSelect(user);
                setOpen(false);
              }}
              className="cursor-pointer w-full"
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar
                  imageUrl={user.profile_picture_url}
                  name={formatName(user, true)}
                  className="size-6 rounded-full"
                />
                <div className="flex flex-col min-w-0">
                  <span
                    className="truncate text-sm font-medium"
                    title={formatName(user)}
                  >
                    {formatName(user)}
                  </span>
                  <span className="text-xs text-gray-500 truncate">
                    {user.username}
                  </span>
                </div>
                {selected?.id === user.id && <CheckIcon className="ml-auto" />}
              </div>
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
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-lg"
        >
          <DrawerTitle className="sr-only">
            {t("select_practitioner")}
          </DrawerTitle>
          <div className="mt-6 h-full">{commandContent}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild disabled={isLoading}>
        {triggerButton}
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        {commandContent}
      </PopoverContent>
    </Popover>
  );
};
