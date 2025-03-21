import { CaretDownIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { CommandInput } from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";
import UserApi from "@/types/user/userApi";

interface Props {
  selected?: UserBase;
  onChange: (user: UserBase) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  popoverClassName?: string;
}

export default function UserSelector({
  selected,
  onChange,
  placeholder,
  noOptionsMessage,
  popoverClassName,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data, isFetching } = useQuery({
    queryKey: ["users", search],
    queryFn: query.debounced(UserApi.list, {
      queryParams: { search_text: search },
    }),
  });

  const users = data?.results || [];

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild className={popoverClassName}>
        <Button
          variant="outline"
          role="combobox"
          className="min-w-60 justify-start"
        >
          {selected ? (
            <div className="flex items-center gap-2">
              <Avatar
                imageUrl={selected.profile_picture_url}
                name={formatName(selected, true)}
                className="size-6 rounded-full"
              />
              <TooltipComponent content={formatName(selected)} side="bottom">
                <p className="font-medium text-gray-900 truncate max-w-48 sm:max-w-56 md:max-w-64">
                  {formatName(selected)}
                </p>
              </TooltipComponent>
            </div>
          ) : (
            <span>{placeholder || t("select_user")}</span>
          )}
          <CaretDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)]"
        align="start"
        sideOffset={4}
      >
        <Command filter={() => 1}>
          <CommandInput
            placeholder={t("search")}
            onValueChange={setSearch}
            className="outline-none border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching
                ? t("searching")
                : noOptionsMessage || t("no_results")}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user: UserBase) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onChange(user);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar
                      imageUrl={user.profile_picture_url}
                      name={formatName(user, true)}
                      className="size-6 rounded-full"
                    />
                    <span>{formatName(user)}</span>
                    <span className="text-xs text-gray-500 font-medium">
                      {user.username}
                    </span>
                  </div>
                  {selected?.id === user.id && (
                    <CheckIcon className="ml-auto" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
