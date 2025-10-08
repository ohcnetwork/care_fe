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
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import useBreakpoints from "@/hooks/useBreakpoints";
import { RoleBase } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";
import query from "@/Utils/request/query";
import { isAppleDevice } from "@/Utils/utils";

interface RoleSelectProps {
  value?: RoleBase;
  onChange: (value: RoleBase) => void;
  disabled?: boolean;
  className?: string;
}

const PAGE_LIMIT = 10;

interface RoleCommandContentProps {
  setSearchTerm: (value: string) => void;
  rolesList?: RoleBase[];
  isFetching: boolean;
  isFetchingNextPage: boolean;
  value?: RoleBase;
  onChange: (value: RoleBase) => void;
  setOpen: (value: boolean) => void;
  ref: (node?: Element | null) => void;
}

function RoleCommandContent({
  setSearchTerm,
  rolesList,
  isFetching,
  isFetchingNextPage,
  value,
  onChange,
  setOpen,
  ref,
}: RoleCommandContentProps) {
  const { t } = useTranslation();

  return (
    <Command>
      <CommandInput
        placeholder={t("search_roles")}
        onValueChange={setSearchTerm}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
        autoFocus={!isAppleDevice}
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
  );
}

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
  const isMobile = useBreakpoints({ default: true, sm: false });

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

  const renderTriggerButton = () => (
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
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>{renderTriggerButton()}</DrawerTrigger>
        <DrawerContent className="px-0 pt-2 min-h-[50vh] max-h-[85vh] rounded-t-lg">
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            <RoleCommandContent
              setSearchTerm={setSearchTerm}
              rolesList={rolesList}
              isFetching={isFetching}
              isFetchingNextPage={isFetchingNextPage}
              value={value}
              onChange={onChange}
              setOpen={setOpen}
              ref={ref}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>{renderTriggerButton()}</PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
        <RoleCommandContent
          setSearchTerm={setSearchTerm}
          rolesList={rolesList}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          value={value}
          onChange={onChange}
          setOpen={setOpen}
          ref={ref}
        />
      </PopoverContent>
    </Popover>
  );
}
