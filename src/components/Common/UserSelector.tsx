import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronDown as CaretDownIcon, CheckIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useInView } from "react-intersection-observer";

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
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import facilityApi from "@/types/facility/facilityApi";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { UserReadMinimal } from "@/types/user/user";
import UserApi from "@/types/user/userApi";

interface Props {
  selected?: UserReadMinimal;
  selectedId?: string;
  dialogTitle?: string;

  onChange: (user: UserReadMinimal) => void;
  placeholder?: string;
  noOptionsMessage?: string;
  popoverClassName?: string;
  contentClassName?: string;
  contentAlign?: React.ComponentProps<typeof PopoverContent>["align"];
  facilityId?: string;
  organizationId?: string;
  disabled?: boolean;
  isServiceAccount?: boolean;
  trigger?: React.ReactNode;
  onClear?: () => void;
}

const PAGE_LIMIT = 50;

interface UserCommandContentProps {
  search: string;
  setSearch: (value: string) => void;
  usersList?: UserReadMinimal[];
  isFetching: boolean;
  isFetchingNextPage: boolean;
  noOptionsMessage?: string;
  selectedId?: string;
  onChange: (user: UserReadMinimal) => void;
  setOpen: (value: boolean) => void;
  ref: (node?: Element | null) => void;
  onClear?: () => void;
}

function UserCommandContent({
  search,
  setSearch,
  usersList,
  isFetching,
  isFetchingNextPage,
  noOptionsMessage,
  selectedId,
  onChange,
  setOpen,
  ref,
  onClear,
}: UserCommandContentProps) {
  const { t } = useTranslation();

  return (
    <Command>
      <CommandInput
        aria-label={t("search")}
        placeholder={t("search")}
        value={search}
        onValueChange={setSearch}
        wrapperClassName="border-b border-gray-100 p-2 shadow-xs md:pt-2"
        className="text-base sm:text-sm [&>svg:last-child]:hidden"
      />
      <CommandList className="p-1 scrollbar-gutter-auto">
        <CommandEmpty>
          {isFetching ? t("searching") : noOptionsMessage || t("no_results")}
        </CommandEmpty>
        {onClear && (
          <CommandGroup>
            <CommandItem
              onSelect={() => {
                onClear();
                setOpen(false);
              }}
              className="cursor-pointer text-destructive max-md:min-h-11"
            >
              {t("clear_all")}
            </CommandItem>
          </CommandGroup>
        )}
        <CommandGroup>
          {usersList?.map((user: UserReadMinimal, i) => (
            <CommandItem
              key={user.id}
              value={`${formatName(user)} ${user.username ?? ""}`}
              onSelect={() => {
                onChange(user);
                setOpen(false);
              }}
              className="w-full cursor-pointer max-md:min-h-11"
              ref={i === usersList.length - 1 ? ref : undefined}
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar
                  imageUrl={user.profile_picture_url}
                  name={formatName(user, true)}
                  className="size-6"
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
                {selectedId === user.id && <CheckIcon className="ml-auto" />}
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

export default function UserSelector({
  selected,
  selectedId,
  dialogTitle,

  onChange,
  placeholder,
  noOptionsMessage,
  popoverClassName,
  contentClassName,
  contentAlign,
  facilityId,
  organizationId,
  disabled,
  isServiceAccount = false,
  trigger,
  onClear,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { ref, inView } = useInView();
  const isMobile = useBreakpoints({ default: true, sm: false });

  const getPathParams = () => {
    if (!facilityId) return undefined;
    return organizationId
      ? { facilityId, organizationId }
      : { facilityId: facilityId };
  };

  const getQueryParams = (pageParam: number) => ({
    limit: String(PAGE_LIMIT),
    offset: String(pageParam),
    search_text: search,
    is_service_account: isServiceAccount,
  });

  const {
    data: usersList,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery({
    queryKey: ["users", facilityId, search, organizationId, isServiceAccount],
    queryFn: async ({ pageParam = 0, signal }) => {
      const response = await query.debounced(
        facilityId
          ? organizationId
            ? facilityOrganizationApi.listUsers
            : facilityApi.getUsers
          : UserApi.list,
        {
          pathParams: getPathParams(),
          queryParams: getQueryParams(pageParam),
        },
      )({ signal });
      return response;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      const currentOffset = allPages.length * PAGE_LIMIT;
      return currentOffset < lastPage.count ? currentOffset : null;
    },
    select: (data) =>
      data?.pages.flatMap((p) =>
        p.results.map((u) => ("user" in u ? u.user : u)),
      ) || [],
  });

  useEffect(() => {
    if (inView && hasNextPage) fetchNextPage();
  }, [inView, hasNextPage, fetchNextPage]);

  const renderTriggerButton = () =>
    trigger || (
      <Button
        type="button"
        variant="outline"
        role="combobox"
        className="min-w-60 w-full justify-start"
        disabled={disabled}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setOpen(true);
          }
        }}
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
    );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild className={popoverClassName}>
          {renderTriggerButton()}
        </DrawerTrigger>
        <DrawerContent height="fixed" className="p-1.5">
          <DrawerHeader className="pl-1 md:pb-2" showCloseButton>
            <DrawerTitle>
              {dialogTitle || placeholder || t("select_user")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <UserCommandContent
              search={search}
              setSearch={setSearch}
              usersList={usersList}
              isFetching={isFetching}
              isFetchingNextPage={isFetchingNextPage}
              noOptionsMessage={noOptionsMessage}
              selectedId={selectedId ?? selected?.id}
              onChange={onChange}
              setOpen={setOpen}
              ref={ref}
              onClear={onClear}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild className={popoverClassName}>
        {renderTriggerButton()}
      </PopoverTrigger>
      <PopoverContent
        aria-label={dialogTitle}
        className={cn("p-0 w-(--anchor-width) overflow-clip", contentClassName)}
        align={contentAlign || "start"}
        sideOffset={4}
      >
        <UserCommandContent
          search={search}
          setSearch={setSearch}
          usersList={usersList}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          noOptionsMessage={noOptionsMessage}
          selectedId={selectedId ?? selected?.id}
          onChange={onChange}
          setOpen={setOpen}
          ref={ref}
          onClear={onClear}
        />
      </PopoverContent>
    </Popover>
  );
}
