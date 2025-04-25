import { CaretDownIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

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

import routes from "@/Utils/request/api";
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
  facilityId?: string;
}

const PAGE_LIMIT = 50;

export default function UserSelector({
  selected,
  onChange,
  placeholder,
  noOptionsMessage,
  popoverClassName,
  facilityId,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ["users", facilityId, search],
      queryFn: async ({ pageParam = 0 }) => {
        const response = await query(
          facilityId ? routes.facility.getUsers : UserApi.list,
          {
            pathParams: facilityId ? { facility_id: facilityId } : undefined,
            queryParams: {
              limit: String(PAGE_LIMIT),
              offset: String(pageParam),
              search_text: search,
            },
          },
        )({ signal: new AbortController().signal });

        return response;
      },
      initialPageParam: 0,
      getNextPageParam: (lastPage, allPages) => {
        const currentOffset = allPages.length * PAGE_LIMIT;
        return currentOffset < lastPage.count ? currentOffset : null;
      },
    });

  const usersList = data?.pages.flatMap((p) => p.results) || [];

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild className={popoverClassName}>
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
        <Command
          filter={(value, search) => {
            const user = usersList.find((u) => u.id === value);
            if (!user) return 0;

            const name = formatName(user).toLowerCase();
            const username = user.username?.toLowerCase() ?? "";
            const input = search.toLowerCase();

            return name.includes(input) || username.includes(input) ? 1 : 0;
          }}
        >
          <CommandInput
            placeholder={t("search")}
            onValueChange={setSearch}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching
                ? t("searching")
                : noOptionsMessage || t("no_results")}
            </CommandEmpty>
            <CommandGroup>
              {usersList.map((user: UserBase, i) => (
                <CommandItem
                  key={user.id}
                  value={user.id}
                  onSelect={() => {
                    onChange(user);
                    setOpen(false);
                  }}
                  className="cursor-pointer w-full"
                  ref={i === usersList.length - 1 ? ref : undefined}
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
              {isFetchingNextPage && (
                <div className="text-center text-sm text-muted py-2">
                  {t("loading")}
                </div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
