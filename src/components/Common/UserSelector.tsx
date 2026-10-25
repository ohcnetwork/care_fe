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
  appearance?: "default" | "careui";
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
  appearance: "default" | "careui";
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
  appearance,
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
    <Command
      className={cn(
        appearance === "careui" &&
          "rounded-xl bg-white p-1 text-neutral-950 [&_[data-slot=command-input-wrapper]]:m-1 [&_[data-slot=command-input-wrapper]]:h-12 [&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-neutral-300/30 [&_[data-slot=command-input-wrapper]]:bg-neutral-300/30 md:[&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-input]]:h-full [&_[data-slot=command-group]]:text-neutral-950 [&_[data-slot=command-item]]:min-h-12 [&_[data-slot=command-item]]:text-neutral-950 md:[&_[data-slot=command-item]]:min-h-10 [&_[data-selected=true]]:bg-neutral-100",
      )}
    >
      <CommandInput
        aria-label={t("search")}
        placeholder={t("search")}
        value={search}
        onValueChange={setSearch}
        className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
      />
      <CommandList>
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
              className="cursor-pointer text-destructive"
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
  appearance = "default",
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
        <DrawerContent
          className={cn(
            "px-0 pt-2 min-h-[50vh] max-h-[85vh] rounded-t-lg",
            appearance === "careui" &&
              "border-neutral-200 bg-white text-neutral-950",
          )}
        >
          {dialogTitle && (
            <DrawerTitle className="sr-only">{dialogTitle}</DrawerTitle>
          )}
          <div className="mt-3 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            <UserCommandContent
              appearance={appearance}
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
        className={cn(
          "p-0 w-(--radix-popover-trigger-width)",
          appearance === "careui" &&
            "rounded-xl border-neutral-200 bg-white text-neutral-950 shadow-md",
          contentClassName,
        )}
        align={contentAlign || "start"}
        sideOffset={4}
      >
        <UserCommandContent
          appearance={appearance}
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
