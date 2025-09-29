import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

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

import query from "@/Utils/request/query";
import { RoleBase } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";

interface RoleSelectProps {
  value?: RoleBase;
  onChange: (value: RoleBase) => void;
  disabled?: boolean;
  className?: string;
}

const PAGE_LIMIT = 10;

export function RoleSelect({
  value,
  onChange,
  disabled,
  className,
}: RoleSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { ref, inView } = useInView();

  const getQueryParams = (pageParam: number) => ({
    limit: String(PAGE_LIMIT),
    offset: String(pageParam),
    name: searchTerm,
  });

  const {
    data: rolesList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["roles", searchTerm],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(roleApi.listRoles, {
        queryParams: getQueryParams(pageParam),
      })({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) => data?.pages.flatMap((p) => p.results) || [],
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          <span className={cn(!value && "text-gray-500")}>
            {value ? value.name : t("select_role")}
          </span>
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <Command>
          <CommandInput
            placeholder={t("search_roles")}
            onValueChange={setSearchTerm}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <CommandEmpty>
              {isFetching ? t("searching") : t("no_roles_found")}
            </CommandEmpty>
            <CommandGroup>
              {rolesList?.map((role, i) => (
                <CommandItem
                  key={role.id}
                  value={role.name}
                  onSelect={() => {
                    onChange(role);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                  ref={i === rolesList.length - 1 ? ref : undefined}
                >
                  <CheckIcon
                    className={cn(
                      "mr-2 size-4",
                      value?.id === role.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col items-start">
                    <span>{role.name}</span>
                    {role.description && (
                      <span className="text-xs text-gray-500">
                        {role.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
              {isFetchingNextPage && (
                <div className="text-center text-sm py-2">{t("loading")}</div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
