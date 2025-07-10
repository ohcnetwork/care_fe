import { CaretDownIcon } from "@radix-ui/react-icons";
import { CheckIcon } from "@radix-ui/react-icons";
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
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import scheduleApi from "@/types/scheduling/scheduleApi";
import { UserBase } from "@/types/user/user";

interface PractitionerSelectorProps {
  selected: UserBase | null;
  onSelect: (user: UserBase | null) => void;
  facilityId: string;
  clearSelection?: string;
}

export const PractitionerSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection,
}: PractitionerSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
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
              <Avatar
                imageUrl={selected.profile_picture_url}
                name={formatName(selected, true)}
                className="size-6 rounded-full"
              />
              <span>{formatName(selected)}</span>
            </div>
          ) : (
            <span>{t("show_all")}</span>
          )}
          <CaretDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={t("search")}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? t("searching") : t("no_results")}
            </CommandEmpty>
            <CommandGroup>
              {clearSelection && (
                <CommandItem
                  value="all"
                  onSelect={() => {
                    onSelect(null);
                    setOpen(false);
                  }}
                  className="cursor-pointer w-full"
                >
                  <div className="w-full flex items-start">
                    <span>{clearSelection}</span>
                    {!selected && <CheckIcon className="ml-auto" />}
                  </div>
                </CommandItem>
              )}
              {practitioners?.users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={formatName(user)}
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
                    {selected?.id === user.id && (
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
