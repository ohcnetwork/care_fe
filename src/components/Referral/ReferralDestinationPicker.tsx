import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/careui/badge";
import { Button } from "@/components/careui/button";
import { Field, FieldLabel } from "@/components/careui/field";
import {
  Command,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import type { PaginatedResponse } from "@/Utils/request/types";
import type { ReferralAvailabilityRead } from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";

const PAGE_SIZE = 20;

interface DestinationOption {
  id: string;
  name: string;
}

interface SearchPage {
  search: string;
  offset: number;
  signal: AbortSignal;
}

interface DestinationComboboxProps<T extends DestinationOption> {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  selected: T | null;
  onSelect: (option: T) => void;
  queryKey: QueryKey;
  fetchOptions: (page: SearchPage) => Promise<PaginatedResponse<T>>;
  disabled?: boolean;
  renderOption?: (option: T) => ReactNode;
}

function DestinationCombobox<T extends DestinationOption>({
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  selected,
  onSelect,
  queryKey,
  fetchOptions,
  disabled,
  renderOption,
}: DestinationComboboxProps<T>) {
  const { t } = useTranslation();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const optionsQuery = useInfiniteQuery({
    queryKey: [...queryKey, search.trim()],
    queryFn: ({ pageParam, signal }) =>
      fetchOptions({ search: search.trim(), offset: pageParam, signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const offset = pages.reduce(
        (count, page) => count + page.results.length,
        0,
      );
      return lastPage.results.length > 0 && offset < lastPage.count
        ? offset
        : undefined;
    },
    enabled: open && !disabled,
    retry: false,
  });
  const options = Array.from(
    new Map(
      optionsQuery.data?.pages.flatMap((page) =>
        page.results.map((option) => [option.id, option] as const),
      ),
    ).values(),
  );
  const hasPageError =
    optionsQuery.isError && !optionsQuery.isFetchNextPageError;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setSearch("");
  };
  const trigger = (
    <Button
      id={id}
      type="button"
      variant="outline"
      role="combobox"
      aria-labelledby={`${id}-label`}
      aria-expanded={open}
      disabled={disabled}
      className="w-full min-w-0 justify-between font-normal tracking-normal shadow-none"
    >
      <span
        className={cn("truncate", !selected && "text-cui-muted-foreground")}
      >
        {selected?.name ?? placeholder}
      </span>
      <ChevronsUpDown className="size-4 opacity-50" aria-hidden="true" />
    </Button>
  );
  const content = (
    <Command
      shouldFilter={false}
      className="bg-cui-background text-cui-foreground"
    >
      <CommandInput
        aria-label={searchPlaceholder}
        placeholder={searchPlaceholder}
        value={search}
        onValueChange={setSearch}
        className="h-9 rounded-none border-0 px-0 py-0 text-base shadow-none focus:ring-0 sm:text-sm"
      />
      <CommandList
        className="max-h-[min(320px,45dvh)]"
        aria-busy={optionsQuery.isFetching}
      >
        {optionsQuery.isPending ? (
          <div
            role="status"
            className="flex items-center justify-center gap-2 p-4 text-sm text-cui-muted-foreground"
          >
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            {t("loading")}
          </div>
        ) : hasPageError ? (
          <div role="alert" className="space-y-2 p-4 text-sm">
            <p>{t("referral_picker_load_error")}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => optionsQuery.refetch()}
            >
              {t("try_again")}
            </Button>
          </div>
        ) : options.length === 0 ? (
          <div
            role="status"
            className="p-4 text-center text-sm text-cui-muted-foreground"
          >
            {emptyMessage}
          </div>
        ) : (
          <CommandGroup>
            {options.map((option) => (
              <CommandItem
                key={option.id}
                value={option.id}
                aria-label={renderOption ? undefined : option.name}
                onSelect={() => {
                  onSelect(option);
                  handleOpenChange(false);
                }}
                className="items-start gap-2 py-2"
              >
                <Check
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    selected?.id !== option.id && "opacity-0",
                  )}
                  aria-hidden="true"
                />
                {renderOption ? (
                  renderOption(option)
                ) : (
                  <span className="min-w-0 break-words">{option.name}</span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
      {!hasPageError &&
        (optionsQuery.hasNextPage || optionsQuery.isFetchNextPageError) && (
          <div className="border-t border-cui-border p-2">
            {optionsQuery.isFetchNextPageError && (
              <p
                role="alert"
                className="mb-2 text-sm text-cui-muted-foreground"
              >
                {t("referral_picker_load_error")}
              </p>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full shadow-none"
              disabled={optionsQuery.isFetching}
              onClick={() => optionsQuery.fetchNextPage()}
            >
              {optionsQuery.isFetchingNextPage && (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              )}
              {t(
                optionsQuery.isFetchNextPageError
                  ? "try_again"
                  : "referral_picker_load_more",
              )}
            </Button>
          </div>
        )}
    </Command>
  );

  return (
    <Field className="min-w-0">
      <FieldLabel id={`${id}-label`} htmlFor={id}>
        {label}
      </FieldLabel>
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent
            className="careui bg-cui-background text-cui-foreground pb-4"
            aria-describedby={undefined}
          >
            <DrawerTitle className="px-4 pt-4 pb-2 text-cui-foreground">
              {label}
            </DrawerTitle>
            {content}
          </DrawerContent>
        </Drawer>
      ) : (
        <Popover open={open} onOpenChange={handleOpenChange} modal>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
          <PopoverContent
            align="start"
            className="careui w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] overflow-hidden border-cui-border bg-cui-background p-0 text-cui-foreground"
          >
            {content}
          </PopoverContent>
        </Popover>
      )}
    </Field>
  );
}

interface ReferralDestinationPickerProps {
  selected: ReferralAvailabilityRead | null;
  onSelect: (availability: ReferralAvailabilityRead) => void;
}

const DESTINATION_TYPES = [
  { value: "facility", label: "referral_destination_facility" },
  { value: "internal_organization", label: "referral_destination_departments" },
  {
    value: "external_organization",
    label: "referral_destination_organization",
  },
] as const;

type DestinationType = (typeof DESTINATION_TYPES)[number]["value"];

export function ReferralDestinationPicker({
  selected,
  onSelect,
}: ReferralDestinationPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const [entityType, setEntityType] = useState<DestinationType>(
    selected?.entity_type === "internal_organization" ||
      selected?.entity_type === "external_organization"
      ? selected.entity_type
      : "facility",
  );

  return (
    <div className="careui space-y-4">
      <Field className="max-w-xs">
        <FieldLabel htmlFor={id}>{t("referral_destination_type")}</FieldLabel>
        <Select
          value={entityType}
          onValueChange={(value: DestinationType) => setEntityType(value)}
        >
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="careui">
            {DESTINATION_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {t(type.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <DestinationCombobox
        key={entityType}
        label={t("referral_picker_unit")}
        placeholder={t("referral_picker_select_unit")}
        searchPlaceholder={t("referral_picker_search_units")}
        emptyMessage={t("referral_picker_no_units")}
        selected={selected?.entity_type === entityType ? selected : null}
        onSelect={onSelect}
        queryKey={["referrals", "destination-picker", "unit", entityType]}
        fetchOptions={({ search, offset, signal }) =>
          query.debounced(referralAvailabilityApi.list, {
            queryParams: {
              entity_type: entityType,
              status: "active",
              name: search || undefined,
              ordering: "name",
              limit: PAGE_SIZE,
              offset,
            },
            silent: true,
          })({ signal })
        }
        renderOption={(option) => (
          <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
            <div className="min-w-0">
              <span className="block break-words font-medium">
                {option.name}
              </span>
              {option.description && (
                <span className="block line-clamp-2 break-words text-xs text-cui-muted-foreground">
                  {option.description}
                </span>
              )}
            </div>
            <Badge variant="neutral" size="xs" className="shrink-0">
              {t(`referral_type_${option.referral_type}`)}
            </Badge>
          </div>
        )}
      />
    </div>
  );
}
