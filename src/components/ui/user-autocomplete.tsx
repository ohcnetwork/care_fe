import { CaretDownIcon, CheckIcon } from "@radix-ui/react-icons";
import { PopoverClose } from "@radix-ui/react-popover";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Avatar } from "@/components/Common/Avatar";

import { formatName, isUserOnline } from "@/Utils/utils";
import { UserBase } from "@/types/user/user";

interface UserCompleteProps {
  id: string;
  disabled?: boolean;
  value: UserBase | undefined;
  isLoading?: boolean;
  onSelect: (user: UserBase | null) => void;
  options: {
    users: UserBase[];
  };
}

export default function UserAutocomplete({
  value,
  options,
  onSelect,
  isLoading,
}: UserCompleteProps) {
  const { t } = useTranslation();

  return (
    <Popover>
      <PopoverTrigger asChild disabled={isLoading}>
        <Button
          variant="outline"
          role="combobox"
          className="min-w-60 justify-start"
        >
          {value ? (
            <div className="flex items-center gap-2">
              <Avatar
                imageUrl={value.profile_picture_url}
                name={formatName(value)}
                className="size-6 rounded-full"
              />
              <span>{formatName(value)}</span>
            </div>
          ) : (
            <span>{t("show_all")}</span>
          )}
          <CaretDownIcon className="ml-auto" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("search")}
            className="outline-none border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>
              {isLoading ? t("searching") : t("no_results")}
            </CommandEmpty>
            <CommandGroup>
              <PopoverClose className="w-full">
                <CommandItem value="all" onSelect={() => onSelect(null)}>
                  <span>{t("show_all")}</span>
                  {!value && <CheckIcon className="ml-auto" />}
                </CommandItem>
              </PopoverClose>
              {options.users?.map((user) => (
                <PopoverClose className="w-full" key={user.id}>
                  <CommandItem
                    value={formatName(user)}
                    onSelect={() => onSelect(user)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {userOnlineDot(user)}
                      <Avatar
                        imageUrl={user.profile_picture_url}
                        name={formatName(user)}
                        className="size-6 rounded-full"
                      />
                      <span>{formatName(user)}</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {user.user_type}
                      </span>
                    </div>
                    {value?.id === user.id && <CheckIcon className="ml-auto" />}
                  </CommandItem>
                </PopoverClose>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const userOnlineDot = (user: UserBase) => (
  <div
    className={cn(
      "mr-4 size-2.5 rounded-full",
      isUserOnline(user) ? "bg-primary-500" : "bg-secondary-400",
    )}
  />
);
