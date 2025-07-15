import { CheckIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react";
import { Fragment, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

interface MultiPractitionerSelectorProps {
  selected: UserBase[] | null;
  onSelect: (users: UserBase[] | null) => void;
  facilityId: string;
  clearSelection?: string;
}

export const MultiPractitionerSelector = ({
  facilityId,
  selected,
  onSelect,
  clearSelection,
}: MultiPractitionerSelectorProps) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [hoveredUser, setHoveredUser] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
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

  const nonSelectedPractitioners = practitioners?.users.filter(
    (user) => !selected?.some((s) => s.id === user.id),
  );

  const getItemValue = (user: UserBase) => {
    return formatName(user) + " " + user.id;
  };

  return (
    <div className="flex items-center gap-2">
      <div className="order-last sm:order-first">
        {selected && selected.length > 0 && (
          <div className="flex items-center gap-1">
            {selected.map((user) => (
              <Fragment key={user.id}>
                <Popover
                  open={hoveredUser === user.id}
                  onOpenChange={(isOpen) =>
                    setHoveredUser(isOpen ? user.id : null)
                  }
                >
                  <PopoverTrigger asChild className="p-0!">
                    <Avatar
                      imageUrl={user.profile_picture_url}
                      name={formatName(user, true)}
                      className="size-8 rounded-full cursor-pointer"
                      onMouseEnter={() => {
                        if (hoverTimeout) {
                          clearTimeout(hoverTimeout);
                          setHoverTimeout(null);
                        }
                        setHoveredUser(user.id);
                      }}
                      onMouseLeave={() => {
                        const timeout = setTimeout(() => {
                          setHoveredUser(null);
                        }, 150);
                        setHoverTimeout(timeout);
                      }}
                    />
                  </PopoverTrigger>
                  <PopoverContent
                    className="p-2 w-fit bg-gray-900 text-gray-50 border-0 shadow-lg"
                    align="start"
                    side="bottom"
                    sideOffset={5}
                  >
                    <div className="flex flex-col gap-0">
                      <span className="text-sm font-medium">
                        {formatName(user)}
                      </span>
                      <span className="text-xs text-gray-300 truncate">
                        {user.username}
                      </span>
                    </div>
                  </PopoverContent>
                </Popover>
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild disabled={isLoading}>
          <Button
            variant="secondary"
            role="combobox"
            className="size-8! rounded-full"
          >
            <CareIcon icon="l-plus" className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start">
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
                    }}
                    className="cursor-pointer w-full"
                  >
                    <div className="w-full flex items-start">
                      <span>{clearSelection}</span>
                      {!selected && <CheckIcon className="ml-auto" />}
                    </div>
                  </CommandItem>
                )}
                {selected && selected.length > 0 && (
                  <h3 className="mt-1 mx-2 text-sm font-medium">
                    {t("selected")}
                  </h3>
                )}
                {selected?.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={getItemValue(user)}
                    onSelect={() => {
                      onSelect(selected.filter((s) => s.id !== user.id));
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
                      <XIcon className="ml-auto" />
                    </div>
                  </CommandItem>
                ))}
                {nonSelectedPractitioners &&
                  nonSelectedPractitioners.length > 0 && (
                    <h3 className="mt-1 mx-2 text-sm font-medium">
                      {t("available")}
                    </h3>
                  )}
                {nonSelectedPractitioners?.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={getItemValue(user)}
                    onSelect={() => {
                      if (selected) {
                        onSelect([...selected, user]);
                      } else {
                        onSelect([user]);
                      }
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
                      {selected?.some((s) => s.id === user.id) && (
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
    </div>
  );
};
