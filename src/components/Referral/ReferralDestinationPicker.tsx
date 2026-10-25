import { useInfiniteQuery, type QueryKey } from "@tanstack/react-query";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/careui/badge";
import { Button } from "@/components/careui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/careui/field";
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
import type {
  ReferralAvailabilityRead,
  ReferralDestinationOption,
} from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";

const PAGE_SIZE = 20;

interface SearchPage {
  search: string;
  offset: number;
  signal: AbortSignal;
}

interface DestinationComboboxProps<T extends ReferralDestinationOption> {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  selected: T | null;
  onSelect: (option: T) => void;
  queryKey: QueryKey;
  fetchOptions: (page: SearchPage) => Promise<PaginatedResponse<T>>;
  disabled?: boolean;
  description?: string;
  clearOption?: { label: string; onSelect: () => void };
  renderOption?: (option: T) => ReactNode;
}

function DestinationCombobox<T extends ReferralDestinationOption>({
  label,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  selected,
  onSelect,
  queryKey,
  fetchOptions,
  disabled,
  description,
  clearOption,
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
      aria-describedby={description ? `${id}-description` : undefined}
      aria-expanded={open}
      disabled={disabled}
      className="w-full min-w-0 justify-between font-normal tracking-normal shadow-none"
    >
      <span
        className={cn("truncate", !selected && "text-cui-muted-foreground")}
      >
        {selected?.name ?? clearOption?.label ?? placeholder}
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
        {clearOption && (
          <CommandGroup>
            <CommandItem
              value="all-departments"
              onSelect={() => {
                clearOption.onSelect();
                handleOpenChange(false);
              }}
            >
              <Check
                className={cn("size-4", selected && "opacity-0")}
                aria-hidden="true"
              />
              {clearOption.label}
            </CommandItem>
          </CommandGroup>
        )}
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
      {description && (
        <FieldDescription id={`${id}-description`}>
          {description}
        </FieldDescription>
      )}
    </Field>
  );
}

interface ReferralDestinationPickerProps {
  defaultFacility?: ReferralDestinationOption;
  selected: ReferralAvailabilityRead | null;
  onSelect: (availability: ReferralAvailabilityRead) => void;
}

export function ReferralDestinationPicker({
  defaultFacility,
  selected,
  onSelect,
}: ReferralDestinationPickerProps) {
  const { t } = useTranslation();
  const id = useId();
  const [mode, setMode] = useState<"facility" | "organization">(
    selected?.entity_type === "external_organization"
      ? "organization"
      : "facility",
  );
  // An unresolved default may arrive later; an explicit user choice takes precedence.
  const [facilityOverride, setFacilityOverride] =
    useState<ReferralDestinationOption | null>();
  const facility =
    facilityOverride === undefined
      ? (selected?.destination.facility ?? defaultFacility ?? null)
      : facilityOverride;
  const [department, setDepartment] =
    useState<ReferralDestinationOption | null>(
      selected?.destination.departments[0] ?? null,
    );
  const [organization, setOrganization] =
    useState<ReferralDestinationOption | null>(
      selected?.destination.organization ?? null,
    );
  const [unit, setUnit] = useState(selected);
  const fetchDestinations =
    (kind: "facility" | "department" | "organization") =>
    ({ search, offset, signal }: SearchPage) =>
      query.debounced(referralAvailabilityApi.destinations, {
        queryParams: {
          kind,
          facility: kind === "department" ? facility?.id : undefined,
          name: search || undefined,
          limit: PAGE_SIZE,
          offset,
        },
        silent: true,
      })({ signal });

  return (
    <div className="careui space-y-4">
      <Field className="max-w-xs">
        <FieldLabel htmlFor={id}>{t("referral_destination_type")}</FieldLabel>
        <Select
          value={mode}
          onValueChange={(value: "facility" | "organization") => {
            setMode(value);
            setDepartment(null);
            setUnit(null);
          }}
        >
          <SelectTrigger id={id}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="careui">
            <SelectItem value="facility">
              {t("referral_picker_facility")}
            </SelectItem>
            <SelectItem value="organization">
              {t("referral_picker_organization")}
            </SelectItem>
          </SelectContent>
        </Select>
      </Field>
      {mode === "facility" ? (
        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <DestinationCombobox
            label={t("referral_picker_facility")}
            placeholder={t("referral_picker_select_facility")}
            searchPlaceholder={t("referral_picker_search_facilities")}
            emptyMessage={t("referral_picker_no_facilities")}
            selected={facility}
            onSelect={(option) => {
              setFacilityOverride(option);
              setDepartment(null);
              setUnit(null);
            }}
            queryKey={["referrals", "destination-picker", "facility"]}
            fetchOptions={fetchDestinations("facility")}
          />
          <DestinationCombobox
            key={facility?.id ?? "department"}
            label={t("referral_picker_department")}
            placeholder={t("referral_picker_all_departments")}
            searchPlaceholder={t("referral_picker_search_departments")}
            emptyMessage={t("referral_picker_no_departments")}
            selected={department}
            onSelect={(option) => {
              setDepartment(option);
              setUnit(null);
            }}
            clearOption={{
              label: t("referral_picker_all_departments"),
              onSelect: () => {
                setDepartment(null);
                setUnit(null);
              },
            }}
            description={t("referral_picker_department_hint")}
            disabled={!facility}
            queryKey={[
              "referrals",
              "destination-picker",
              "department",
              facility?.id,
            ]}
            fetchOptions={fetchDestinations("department")}
          />
        </div>
      ) : (
        <DestinationCombobox
          label={t("referral_picker_organization")}
          placeholder={t("referral_picker_select_organization")}
          searchPlaceholder={t("referral_picker_search_organizations")}
          emptyMessage={t("referral_picker_no_organizations")}
          selected={organization}
          onSelect={(option) => {
            setOrganization(option);
            setUnit(null);
          }}
          queryKey={["referrals", "destination-picker", "organization"]}
          fetchOptions={fetchDestinations("organization")}
        />
      )}
      <DestinationCombobox
        key={`${mode}:${facility?.id}:${department?.id}:${organization?.id}`}
        label={t("referral_picker_unit")}
        placeholder={t("referral_picker_select_unit")}
        searchPlaceholder={t("referral_picker_search_units")}
        emptyMessage={t("referral_picker_no_units")}
        selected={unit}
        onSelect={onSelect}
        disabled={mode === "facility" ? !facility : !organization}
        queryKey={[
          "referrals",
          "destination-picker",
          "unit",
          mode,
          facility?.id,
          department?.id,
          organization?.id,
        ]}
        fetchOptions={({ search, offset, signal }) =>
          query.debounced(referralAvailabilityApi.list, {
            queryParams: {
              facility: mode === "facility" ? facility?.id : undefined,
              internal_organization:
                mode === "facility" ? department?.id : undefined,
              entity_type:
                mode === "organization" ? "external_organization" : undefined,
              external_organization:
                mode === "organization" ? organization?.id : undefined,
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
              <span className="block break-words text-xs text-cui-muted-foreground">
                {option.destination.departments
                  .map((item) => item.name)
                  .join(", ") ||
                  option.destination.organization?.name ||
                  t("referral_picker_facility_wide")}
              </span>
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
