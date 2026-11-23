import { useQuery } from "@tanstack/react-query";
import { ChevronsUpDown as CaretSortIcon, ChevronDown } from "lucide-react";
import { useState } from "react";
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
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  fieldTriggerLayout,
  fieldTriggerSurface,
  invalidTriggerRing,
  triggerFocus,
} from "@/components/ui/field-trigger-styles";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import useBreakpoints from "@/hooks/useBreakpoints";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { RoleBase, RoleContext } from "@/types/emr/role/role";
import roleApi from "@/types/emr/role/roleApi";
import query from "@/Utils/request/query";

interface RoleSelectProps {
  value?: RoleBase;
  onChange: (value: RoleBase) => void;
  context?: RoleContext;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  /** "field" renders the trigger like the other form field comboboxes. */
  appearance?: "button" | "field";
}

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
        aria-label={t("search_roles")}
        onValueChange={setSearchTerm}
        wrapperClassName="border-b border-soft-border shadow-xs"
        className="text-base sm:text-sm"
        autoFocus
      />
      <CommandList className="scrollbar-gutter-auto">
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
              data-checked={value?.id === role.id}
              ref={i === rolesList.length - 1 ? ref : undefined}
            >
              <div className="flex flex-col items-start">
                <span>{role.name}</span>
                {role.description && (
                  <span className="text-xs text-muted-foreground">
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
  context,
  disabled,
  className,
  placeholder,
  appearance = "button",
}: RoleSelectProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const selectedRoleId = value?.id;

  const { data, isFetchingNextPage, isFetching, ref } = useInfiniteList({
    queryKey: ["roles", searchTerm, context],
    ...query.infinite(roleApi.listRoles, {
      queryParams: { name: searchTerm, context },
      pageSize: 10,
      debounceInterval: 500,
    }),
  });
  const rolesList = data?.results;

  const { data: selectedRoleData } = useQuery({
    queryKey: ["role", selectedRoleId],
    queryFn: query(roleApi.getRole, {
      pathParams: { external_id: selectedRoleId || "" },
    }),
    enabled: !!selectedRoleId && !value?.name,
  });

  const selectedRole = value?.name ? value : selectedRoleData;

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSearchTerm("");
    }
  };

  const renderTriggerButton = () =>
    appearance === "field" ? (
      <button
        type="button"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        className={cn(
          fieldTriggerLayout,
          fieldTriggerSurface,
          triggerFocus,
          invalidTriggerRing,
          "w-full min-w-0 justify-between font-normal",
          className,
        )}
      >
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-left",
            !selectedRole && "text-placeholder-foreground",
          )}
        >
          {selectedRole ? selectedRole.name : placeholder || t("select_role")}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
    ) : (
      <Button
        variant="outline"
        role="combobox"
        aria-expanded={open}
        className={cn("w-full justify-between", className)}
        disabled={disabled}
      >
        <span className={cn(!selectedRole && "text-placeholder-foreground")}>
          {selectedRole ? selectedRole.name : placeholder || t("select_role")}
        </span>
        <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
      </Button>
    );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{renderTriggerButton()}</DrawerTrigger>
        <DrawerContent
          aria-describedby={undefined}
          height="fixed"
          className="p-1.5"
        >
          <DrawerHeader className="pl-1 md:pb-2" showCloseButton>
            <DrawerTitle>{placeholder || t("select_role")}</DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col pb-[env(safe-area-inset-bottom)]">
            <RoleCommandContent
              setSearchTerm={setSearchTerm}
              rolesList={rolesList}
              isFetching={isFetching}
              isFetchingNextPage={isFetchingNextPage}
              value={selectedRole}
              onChange={onChange}
              setOpen={handleOpenChange}
              ref={ref}
            />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange} modal>
      <PopoverTrigger asChild>{renderTriggerButton()}</PopoverTrigger>
      <PopoverContent className="w-(--anchor-width) p-0 overflow-clip">
        <RoleCommandContent
          setSearchTerm={setSearchTerm}
          rolesList={rolesList}
          isFetching={isFetching}
          isFetchingNextPage={isFetchingNextPage}
          value={selectedRole}
          onChange={onChange}
          setOpen={handleOpenChange}
          ref={ref}
        />
      </PopoverContent>
    </Popover>
  );
}
