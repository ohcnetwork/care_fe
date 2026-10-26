/**
 * @name filters
 * @description A comprehensive filtering system with multiple filter types, operators, and visual indicators for data organization.
 * @dependencies class-variance-authority lucide-react
 * @registryDependencies badge button button-group checkbox dropdown-menu drawer input input-group kbd popover scroll-area separator tooltip
 * @type registry:ui
 */
"use client";

import { cva } from "class-variance-authority";
import {
  AlertCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ListFilterIcon,
  PlusIcon,
  SquarePenIcon,
  XIcon,
} from "lucide-react";
import * as React from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerNestedRoot,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Kbd } from "@/components/ui/kbd";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

// ─── i18n ────────────────────────────────────────────────────────────────────
export interface FilterI18nConfig {
  addFilter: string;
  clearAll: string;
  removeFilter: string;
  changeOperator: string;
  searchFields: string;
  noFieldsFound: string;
  noResultsFound: string;
  select: string;
  true: string;
  false: string;
  min: string;
  max: string;
  to: string;
  typeAndPressEnter: string;
  selected: string;
  selectedCount: string;
  percent: string;
  defaultCurrency: string;
  defaultColor: string;
  addFilterTitle: string;
  operators: {
    is: string;
    isNot: string;
    isAnyOf: string;
    isNotAnyOf: string;
    includesAll: string;
    excludesAll: string;
    before: string;
    after: string;
    between: string;
    notBetween: string;
    contains: string;
    notContains: string;
    startsWith: string;
    endsWith: string;
    isExactly: string;
    equals: string;
    notEquals: string;
    greaterThan: string;
    lessThan: string;
    overlaps: string;
    includes: string;
    excludes: string;
    includesAllOf: string;
    includesAnyOf: string;
    empty: string;
    notEmpty: string;
  };
  placeholders: {
    enterField: (fieldType: string) => string;
    selectField: string;
    searchField: (fieldName: string) => string;
    enterKey: string;
    enterValue: string;
  };
  helpers: {
    formatOperator: (operator: string) => string;
  };
  validation: {
    invalidEmail: string;
    invalidUrl: string;
    invalidTel: string;
    invalid: string;
  };
}

export const DEFAULT_I18N: FilterI18nConfig = {
  addFilter: "Add Filter",
  clearAll: "Clear all",
  removeFilter: "Remove filter",
  changeOperator: "Change operator",
  searchFields: "Filter...",
  noFieldsFound: "No filters found.",
  noResultsFound: "No results found.",
  select: "Select",
  true: "True",
  false: "False",
  min: "Min",
  max: "Max",
  to: "to",
  typeAndPressEnter: "Type and press Enter to add tag",
  selected: "selected",
  selectedCount: "selected",
  percent: "%",
  defaultCurrency: "$",
  defaultColor: "#000000",
  addFilterTitle: "Filters",
  operators: {
    is: "is",
    isNot: "is not",
    isAnyOf: "is any of",
    isNotAnyOf: "is not any of",
    includesAll: "includes all",
    excludesAll: "excludes all",
    before: "before",
    after: "after",
    between: "between",
    notBetween: "not between",
    contains: "contains",
    notContains: "does not contain",
    startsWith: "starts with",
    endsWith: "ends with",
    isExactly: "is exactly",
    equals: "equals",
    notEquals: "not equals",
    greaterThan: "greater than",
    lessThan: "less than",
    overlaps: "overlaps",
    includes: "includes",
    excludes: "excludes",
    includesAllOf: "includes all of",
    includesAnyOf: "includes any of",
    empty: "is empty",
    notEmpty: "is not empty",
  },
  placeholders: {
    enterField: (fieldType: string) => `Enter ${fieldType}...`,
    selectField: "Select",
    searchField: (fieldName: string) => `Search ${fieldName.toLowerCase()}...`,
    enterKey: "Enter key",
    enterValue: "Enter value",
  },
  helpers: {
    formatOperator: (operator: string) => operator.replace(/_/g, " "),
  },
  validation: {
    invalidEmail: "Invalid email format",
    invalidUrl: "Invalid URL format",
    invalidTel: "Invalid phone format",
    invalid: "Invalid input format",
  },
};

// ─── Context ─────────────────────────────────────────────────────────────────
interface FilterContextValue {
  size: "sm" | "default" | "lg";
  i18n: FilterI18nConfig;
  className?: string;
  showSearchInput?: boolean;
  trigger?: React.ReactNode;
  allowMultiple?: boolean;
}

const FilterContext = createContext<FilterContextValue>({
  size: "default",
  i18n: DEFAULT_I18N,
  className: undefined,
  showSearchInput: true,
  trigger: undefined,
  allowMultiple: true,
});

const useFilterContext = () => useContext(FilterContext);

const FilterPanelMobileContext = createContext(false);

const MobileDrawerRoot = ({
  children,
  ...props
}: React.ComponentProps<typeof Drawer>) => {
  const isInsidePanel = useContext(FilterPanelMobileContext);
  const Root = isInsidePanel ? DrawerNestedRoot : Drawer;
  return <Root {...props}>{children}</Root>;
};

const filtersContainerVariants = cva("flex flex-wrap items-center", {
  variants: {
    size: {
      sm: "gap-1.5",
      default: "gap-2.5",
      lg: "gap-3.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// ─── FilterInput (text input with validation) ────────────────────────────────
function FilterInput<T = unknown>({
  field,
  onBlur,
  onKeyDown,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
  field?: FilterFieldConfig<T>;
}) {
  const context = useFilterContext();
  const [isValid, setIsValid] = useState(true);
  const [validationMessage, setValidationMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (props.autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [props.autoFocus]);

  const validateInput = (value: string, pattern?: string): boolean => {
    if (!pattern || !value) return true;
    const regex = new RegExp(pattern);
    return regex.test(value);
  };

  const getValidationMessage = (): string => context.i18n.validation.invalid;

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const pattern = field?.pattern || props.pattern;

    if (value && (pattern || field?.validation)) {
      let valid = true;
      let customMessage = "";

      if (field?.validation) {
        const result = field.validation(value);
        if (typeof result === "boolean") {
          valid = result;
        } else {
          valid = result.valid;
          customMessage = result.message || "";
        }
      } else if (pattern) {
        valid = validateInput(value, pattern);
      }

      setIsValid(valid);
      setValidationMessage(
        valid ? "" : customMessage || getValidationMessage(),
      );
    } else {
      setIsValid(true);
      setValidationMessage("");
    }

    onBlur?.(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !isValid &&
      ![
        "Tab",
        "Escape",
        "Enter",
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
      ].includes(e.key)
    ) {
      setIsValid(true);
      setValidationMessage("");
    }
    onKeyDown?.(e);
  };

  return (
    <InputGroup className={cn("flex-1 shadow-sm", className)}>
      {field?.prefix && (
        <InputGroupAddon>
          <InputGroupText>{field.prefix}</InputGroupText>
        </InputGroupAddon>
      )}
      <InputGroupInput
        ref={inputRef}
        aria-invalid={!isValid}
        aria-describedby={
          !isValid && validationMessage
            ? `${field?.key || "input"}-error`
            : undefined
        }
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(context.size === "sm" && "text-xs")}
        {...props}
      />

      {!isValid && validationMessage && (
        <InputGroupAddon align="inline-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <InputGroupButton size="icon-xs">
                  <AlertCircleIcon className="text-destructive size-3.5" />
                </InputGroupButton>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-sm">{validationMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </InputGroupAddon>
      )}

      {field?.suffix && (
        <InputGroupAddon align="inline-end">
          <InputGroupText>{field.suffix}</InputGroupText>
        </InputGroupAddon>
      )}
    </InputGroup>
  );
}

// ─── FilterRemoveButton ──────────────────────────────────────────────────────
interface FilterRemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.ReactNode;
}

function FilterRemoveButton({
  icon = <XIcon />,
  className,
  "aria-label": ariaLabel,
  ...props
}: FilterRemoveButtonProps) {
  const context = useFilterContext();

  return (
    <Button
      data-slot="filter-remove"
      variant="outline"
      size={
        context.size === "sm"
          ? "icon-sm"
          : context.size === "lg"
            ? "icon-lg"
            : "icon"
      }
      aria-label={ariaLabel ?? context.i18n.removeFilter}
      className={cn("text-muted-foreground hover:text-foreground", className)}
      {...props}
    >
      {icon}
    </Button>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface FilterOption<T = unknown> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  metadata?: Record<string, unknown>;
  className?: string;
}

export interface FilterOperator {
  value: string;
  label: string;
  supportsMultiple?: boolean;
}

export interface CustomRendererProps<T = unknown> {
  field: FilterFieldConfig<T>;
  values: T[];
  onChange: (values: T[]) => void;
  operator: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export interface FilterFieldGroup<T = unknown> {
  group?: string;
  fields: FilterFieldConfig<T>[];
}

export type FilterFieldsConfig<T = unknown> =
  FilterFieldConfig<T>[] | FilterFieldGroup<T>[];

export interface FilterFieldConfig<T = unknown> {
  key?: string;
  label?: string;
  icon?: React.ReactNode;
  type?: "select" | "multiselect" | "text" | "custom" | "separator";
  group?: string;
  fields?: FilterFieldConfig<T>[];
  options?: FilterOption<T>[];
  operators?: FilterOperator[];
  customRenderer?: (props: CustomRendererProps<T>) => React.ReactNode;
  customValueRenderer?: (
    values: T[],
    options: FilterOption<T>[],
  ) => React.ReactNode;
  placeholder?: string;
  searchable?: boolean;
  maxSelections?: number;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string | React.ReactNode;
  suffix?: string | React.ReactNode;
  pattern?: string;
  validation?: (
    value: unknown,
  ) => boolean | { valid: boolean; message?: string };
  allowCustomValues?: boolean;
  className?: string;
  chipClassName?: string;
  valueClassName?: string;
  disableClear?: boolean;
  disableOperatorUntilSelected?: boolean;
  menuPopupClassName?: string;
  groupLabel?: string;
  onLabel?: string;
  offLabel?: string;
  onInputChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  defaultOperator?: string;
  value?: T[];
  onValueChange?: (values: T[]) => void;
}

// ─── Field helpers ───────────────────────────────────────────────────────────
const isFieldGroup = <T = unknown,>(
  item: FilterFieldConfig<T> | FilterFieldGroup<T>,
): item is FilterFieldGroup<T> =>
  "fields" in item && Array.isArray(item.fields) && !("key" in item);

const isGroupLevelField = <T = unknown,>(
  field: FilterFieldConfig<T>,
): boolean => Boolean(field.group && field.fields);

const flattenFields = <T = unknown,>(
  fields: FilterFieldsConfig<T>,
): FilterFieldConfig<T>[] => {
  const result: FilterFieldConfig<T>[] = [];
  for (const item of fields) {
    if (isFieldGroup(item)) {
      result.push(...item.fields);
    } else if (isGroupLevelField(item)) {
      result.push(...(item.fields as FilterFieldConfig<T>[]));
    } else {
      result.push(item);
    }
  }
  return result;
};

const getFieldsMap = <T = unknown,>(
  fields: FilterFieldsConfig<T>,
): Record<string, FilterFieldConfig<T>> => {
  const map: Record<string, FilterFieldConfig<T>> = {};
  for (const field of flattenFields(fields)) {
    if (field.key) map[field.key] = field;
  }
  return map;
};

const getSelectableFields = <T = unknown,>(
  fields: FilterFieldsConfig<T>,
): FilterFieldConfig<T>[] =>
  flattenFields(fields).filter(
    (field) => Boolean(field.key) && field.type !== "separator",
  );

const mergeI18n = (i18n?: Partial<FilterI18nConfig>): FilterI18nConfig => ({
  ...DEFAULT_I18N,
  ...i18n,
  operators: { ...DEFAULT_I18N.operators, ...i18n?.operators },
  placeholders: { ...DEFAULT_I18N.placeholders, ...i18n?.placeholders },
  validation: { ...DEFAULT_I18N.validation, ...i18n?.validation },
});

const createOperatorsFromI18n = (
  i18n: FilterI18nConfig,
): Record<string, FilterOperator[]> => ({
  select: [
    { value: "is", label: i18n.operators.is },
    { value: "is_not", label: i18n.operators.isNot },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  multiselect: [
    { value: "is_any_of", label: i18n.operators.isAnyOf },
    { value: "is_not_any_of", label: i18n.operators.isNotAnyOf },
    { value: "includes_all", label: i18n.operators.includesAll },
    { value: "excludes_all", label: i18n.operators.excludesAll },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  text: [
    { value: "contains", label: i18n.operators.contains },
    { value: "not_contains", label: i18n.operators.notContains },
    { value: "starts_with", label: i18n.operators.startsWith },
    { value: "ends_with", label: i18n.operators.endsWith },
    { value: "is", label: i18n.operators.isExactly },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
  custom: [
    { value: "is", label: i18n.operators.is },
    { value: "after", label: i18n.operators.after },
    { value: "between", label: i18n.operators.between },
    { value: "empty", label: i18n.operators.empty },
    { value: "not_empty", label: i18n.operators.notEmpty },
  ],
});

export const DEFAULT_OPERATORS: Record<string, FilterOperator[]> =
  createOperatorsFromI18n(DEFAULT_I18N);

const getOperatorsForField = <T = unknown,>(
  field: FilterFieldConfig<T>,
  values: T[],
  i18n: FilterI18nConfig,
): FilterOperator[] => {
  if (field.operators) return field.operators;

  const operators = createOperatorsFromI18n(i18n);
  let fieldType = field.type || "select";
  if (fieldType === "select" && values.length > 1) fieldType = "multiselect";
  if (fieldType === "multiselect" || field.type === "multiselect") {
    return operators.multiselect;
  }
  return operators[fieldType] || operators.select;
};

// ─── FilterOperatorDropdown ──────────────────────────────────────────────────
interface FilterOperatorDropdownProps<T = unknown> {
  field: FilterFieldConfig<T>;
  operator: string;
  values: T[];
  onChange: (operator: string) => void;
}

function FilterOperatorDropdown<T = unknown>({
  field,
  operator,
  values,
  onChange,
}: FilterOperatorDropdownProps<T>) {
  const { t } = useTranslation();
  const context = useFilterContext();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const operators = getOperatorsForField(field, values, context.i18n);

  const operatorLabel =
    operators.find((op) => op.value === operator)?.label ||
    context.i18n.helpers.formatOperator(operator);

  const triggerButton = (
    <Button
      data-slot="filter-operator"
      variant="outline"
      size={context.size}
      disabled={field.disableOperatorUntilSelected && values.length === 0}
      aria-label={t("filter_operator_current", {
        action: context.i18n.changeOperator,
        field: field.label ? ` (${field.label})` : "",
        operator: operatorLabel,
      })}
      className="text-muted-foreground hover:text-foreground font-normal underline underline-offset-4 shadow-sm"
    >
      {operatorLabel}
    </Button>
  );

  if (isMobile) {
    return (
      <MobileDrawerRoot open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{context.i18n.changeOperator}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {field.label
                ? t("filter_select_operator", { field: field.label })
                : context.i18n.changeOperator}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="p-1">
            {operators.map((op) => (
              <button
                key={op.value}
                type="button"
                onClick={() => {
                  onChange(op.value);
                  setMobileOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-sm px-3 py-2.5 text-sm outline-none",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:bg-accent focus-visible:text-accent-foreground",
                )}
              >
                <span>{op.label}</span>
                <CheckIcon
                  className={cn(
                    "text-primary ms-auto size-4",
                    op.value === operator ? "opacity-100" : "opacity-0",
                  )}
                />
              </button>
            ))}
          </DrawerBody>
        </DrawerContent>
      </MobileDrawerRoot>
    );
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-fit min-w-fit">
        {operators.map((op) => (
          <DropdownMenuItem
            key={op.value}
            onClick={() => onChange(op.value)}
            className="data-highlighted:bg-accent data-highlighted:text-accent-foreground flex items-center justify-between"
          >
            <span>{op.label}</span>
            <CheckIcon
              className={cn(
                "text-primary ms-auto size-4",
                op.value === operator ? "opacity-100" : "opacity-0",
              )}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── SelectOptionsPopover ────────────────────────────────────────────────────
interface FilterValueSelectorProps<T = unknown> {
  field: FilterFieldConfig<T>;
  values: T[];
  onChange: (values: T[]) => void;
  operator: string;
  autoFocus?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

interface SelectOptionsPopoverProps<T = unknown> {
  field: FilterFieldConfig<T>;
  values: T[];
  onChange: (values: T[]) => void;
  onClose?: () => void;
  inline?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function SelectOptionsPopover<T = unknown>({
  field,
  values,
  onChange,
  onClose,
  inline = false,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  className,
}: SelectOptionsPopoverProps<T>) {
  const { t } = useTranslation();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = controlledOnOpenChange ?? setUncontrolledOpen;
  const [searchInput, setSearchInputState] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const context = useFilterContext();
  const isMobile = useIsMobile();
  const baseId = useId();

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
    setHighlightedIndex(-1);
  }, []);

  // Reset highlight when popover open state changes
  const [prevOpen, setPrevOpen] = useState(open);
  if (prevOpen !== open) {
    setPrevOpen(open);
    setHighlightedIndex(-1);
  }

  useEffect(() => {
    if (highlightedIndex >= 0 && open) {
      const element = document.getElementById(
        `${baseId}-item-${highlightedIndex}`,
      );
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, open, baseId]);

  const isMultiSelect = field.type === "multiselect";

  const effectiveValues = useMemo(
    () => (field.value !== undefined ? (field.value as T[]) : values) || [],
    [field.value, values],
  );

  const selectedOptions = useMemo(
    () =>
      field.options?.filter((opt) => effectiveValues.includes(opt.value)) || [],
    [field.options, effectiveValues],
  );
  const unselectedOptions = useMemo(
    () =>
      field.options?.filter((opt) => !effectiveValues.includes(opt.value)) ||
      [],
    [field.options, effectiveValues],
  );

  const filteredUnselectedOptions = useMemo(
    () =>
      unselectedOptions.filter((opt) =>
        opt.label.toLowerCase().includes(searchInput.toLowerCase()),
      ),
    [unselectedOptions, searchInput],
  );

  const allFilteredOptions = useMemo(
    () => [...selectedOptions, ...filteredUnselectedOptions],
    [selectedOptions, filteredUnselectedOptions],
  );

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const toggleOption = (option: FilterOption<T>) => {
    const isSelected = effectiveValues.includes(option.value as T);
    const next = isSelected
      ? (effectiveValues.filter((v) => v !== option.value) as T[])
      : isMultiSelect
        ? ([...effectiveValues, option.value] as T[])
        : ([option.value] as T[]);

    if (
      !isSelected &&
      isMultiSelect &&
      field.maxSelections &&
      next.length > field.maxSelections
    ) {
      return;
    }

    if (field.onValueChange) field.onValueChange(next);
    else onChange(next);
    if (!isMultiSelect) handleClose();
  };

  const renderMenuContent = () => (
    <>
      {field.searchable !== false && (
        <>
          <Input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${baseId}-item-${highlightedIndex}`
                : undefined
            }
            placeholder={context.i18n.placeholders.searchField(
              field.label || "",
            )}
            className={cn(
              "border-input h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
              "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (allFilteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < allFilteredOptions.length - 1 ? prev + 1 : 0,
                  );
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (allFilteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : allFilteredOptions.length - 1,
                  );
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                setOpen(false);
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                const option = allFilteredOptions[highlightedIndex];
                if (option) toggleOption(option);
              }
              e.stopPropagation();
            }}
          />
          <Separator />
        </>
      )}
      <div className="relative flex max-h-full">
        <div
          className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain"
          role="listbox"
          id={`${baseId}-listbox`}
        >
          <ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-viewport]:h-full **:data-[slot=scroll-area-viewport]:overscroll-contain">
            {allFilteredOptions.length === 0 && (
              <div className="text-muted-foreground py-2 text-center text-sm">
                {context.i18n.noResultsFound}
              </div>
            )}

            {selectedOptions.length > 0 && (
              <div className="px-1 py-1">
                {selectedOptions.map((option, index) => {
                  const isHighlighted = highlightedIndex === index;
                  const itemId = `${baseId}-item-${index}`;
                  return (
                    <button
                      key={String(option.value)}
                      id={itemId}
                      type="button"
                      role="option"
                      aria-selected={true}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                        option.className,
                      )}
                      onClick={() => toggleOption(option)}
                    >
                      <Checkbox
                        checked={true}
                        size="md"
                        className="pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedOptions.length > 0 &&
              filteredUnselectedOptions.length > 0 && <Separator />}

            {filteredUnselectedOptions.length > 0 && (
              <div className="px-1 py-1">
                {filteredUnselectedOptions.map((option, index) => {
                  const overallIndex = index + selectedOptions.length;
                  const isHighlighted = highlightedIndex === overallIndex;
                  const itemId = `${baseId}-item-${overallIndex}`;
                  return (
                    <button
                      key={String(option.value)}
                      id={itemId}
                      type="button"
                      role="option"
                      aria-selected={false}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(overallIndex)}
                      className={cn(
                        "relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none",
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
                        option.className,
                      )}
                      onClick={() => toggleOption(option)}
                    >
                      <Checkbox
                        checked={false}
                        size="md"
                        className="pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </>
  );

  if (inline) {
    return <div className="w-full">{renderMenuContent()}</div>;
  }

  const triggerButton = (
    <Button
      data-slot="filter-value"
      variant="outline"
      size={context.size}
      aria-label={t("filter_value_current", {
        field: field.label ?? t("filter"),
        value:
          selectedOptions.length === 0
            ? context.i18n.select
            : selectedOptions.length === 1
              ? selectedOptions[0].label
              : `${selectedOptions.length} ${context.i18n.selectedCount}`,
      })}
      className={cn("font-normal shadow-sm", className)}
    >
      <div className="flex w-full items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          {field.customValueRenderer ? (
            field.customValueRenderer(values, field.options || [])
          ) : (
            <>
              {selectedOptions.some((opt) => opt.icon) && (
                <div
                  className="flex items-center [&>*:not(:first-child)]:-ml-1.5"
                  aria-hidden="true"
                >
                  {selectedOptions.slice(0, 3).map((option) => (
                    <div key={String(option.value)}>{option.icon}</div>
                  ))}
                </div>
              )}
              <span
                className={cn(
                  selectedOptions.length > 0 && "underline underline-offset-4",
                )}
              >
                {selectedOptions.length === 1
                  ? selectedOptions[0].label
                  : selectedOptions.length > 1
                    ? `${selectedOptions.length} ${context.i18n.selectedCount}`
                    : context.i18n.select}
              </span>
            </>
          )}
        </div>
        {selectedOptions.length === 0 && (
          <ChevronDownIcon
            className="text-muted-foreground size-3.5 shrink-0"
            aria-hidden="true"
          />
        )}
      </div>
    </Button>
  );

  if (isMobile) {
    return (
      <MobileDrawerRoot
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) {
            setTimeout(() => setSearchInput(""), 200);
          }
        }}
      >
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>{field.label ?? context.i18n.select}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {context.i18n.placeholders.searchField(field.label || "")}
            </DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="p-0">{renderMenuContent()}</DrawerBody>
          {isMultiSelect && (
            <div className="flex justify-end gap-2 p-3 pt-0">
              <DrawerClose asChild>
                <Button variant="outline" size="sm">
                  {t("done")}
                </Button>
              </DrawerClose>
            </div>
          )}
        </DrawerContent>
      </MobileDrawerRoot>
    );
  }

  return (
    <Popover
      modal={false}
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setTimeout(() => setSearchInput(""), 200);
        }
      }}
    >
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent
        align="start"
        className={cn("w-50 gap-0 p-0", field.className)}
      >
        {renderMenuContent()}
      </PopoverContent>
    </Popover>
  );
}

// ─── FilterValueSelector ─────────────────────────────────────────────────────
function FilterValueSelector<T = unknown>({
  field,
  values,
  onChange,
  operator,
  autoFocus,
  open,
  onOpenChange,
  className,
}: FilterValueSelectorProps<T>) {
  if (operator === "empty" || operator === "not_empty") {
    return null;
  }

  if (field.customRenderer) {
    return (
      <>
        {field.customRenderer({
          field,
          values,
          onChange,
          operator,
          open,
          onOpenChange,
        })}
      </>
    );
  }

  if (field.type === "text") {
    return (
      <FilterInput
        type="text"
        value={(values[0] as string) || ""}
        onChange={(e) => onChange([e.target.value] as T[])}
        placeholder={field.placeholder}
        pattern={field.pattern}
        field={field}
        className={cn("min-w-max", className, field.className)}
        autoFocus={autoFocus}
      />
    );
  }

  return (
    <SelectOptionsPopover
      field={field}
      values={values}
      onChange={onChange}
      open={open}
      onOpenChange={onOpenChange}
      className={className}
    />
  );
}

// ─── Filter / FilterGroup types ──────────────────────────────────────────────
export interface Filter<T = unknown> {
  id: string;
  field: string;
  operator: string;
  values: T[];
}

export interface FilterGroup<T = unknown> {
  id: string;
  label?: string;
  filters: Filter<T>[];
  fields: FilterFieldConfig<T>[];
}

// ─── FilterSubmenuContent ────────────────────────────────────────────────────
interface FilterSubmenuContentProps<T = unknown> {
  field: FilterFieldConfig<T>;
  currentValues: T[];
  isMultiSelect: boolean;
  onToggle: (value: T, isSelected: boolean) => void;
  i18n: FilterI18nConfig;
  isActive?: boolean;
  onActive?: () => void;
  onBack?: () => void;
  onClose?: () => void;
}

function FilterSubmenuContent<T = unknown>({
  field,
  currentValues,
  isMultiSelect,
  onToggle,
  i18n,
  isActive,
  onActive,
  onBack,
  onClose,
}: FilterSubmenuContentProps<T>) {
  const [searchInput, setSearchInputState] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();

  const setSearchInput = useCallback((value: string) => {
    setSearchInputState(value);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (highlightedIndex >= 0 && isActive) {
      const element = document.getElementById(
        `${baseId}-item-${highlightedIndex}`,
      );
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, isActive, baseId]);

  const filteredOptions = useMemo(() => {
    return (
      field.options?.filter((option) => {
        const isSelected = currentValues.includes(option.value);
        if (isSelected) return true;
        if (!searchInput) return true;
        return option.label.toLowerCase().includes(searchInput.toLowerCase());
      }) || []
    );
  }, [field.options, searchInput, currentValues]);

  // Reset highlight to first item when submenu becomes active
  const [prevIsActive, setPrevIsActive] = useState(isActive);
  if (prevIsActive !== isActive) {
    setPrevIsActive(isActive);
    if (isActive && filteredOptions.length > 0) {
      setHighlightedIndex(0);
    }
  }

  // Auto-focus search input when submenu becomes active (keyboard navigation)
  useEffect(() => {
    if (isActive && field.searchable !== false) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isActive, field.searchable]);

  return (
    <div className="flex flex-col" onMouseEnter={onActive}>
      {field.searchable !== false && (
        <>
          <Input
            ref={inputRef}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={true}
            aria-haspopup="listbox"
            aria-controls={`${baseId}-listbox`}
            aria-activedescendant={
              highlightedIndex >= 0
                ? `${baseId}-item-${highlightedIndex}`
                : undefined
            }
            placeholder={i18n.placeholders.searchField(field.label || "")}
            className={cn(
              "h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
              "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0",
            )}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0,
                  );
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1,
                  );
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                onBack?.();
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                const option = filteredOptions[highlightedIndex];
                if (option) {
                  onToggle(
                    option.value as T,
                    currentValues.includes(option.value),
                  );
                  if (!isMultiSelect) onBack?.();
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
              }
              e.stopPropagation();
            }}
          />
          <DropdownMenuSeparator />
        </>
      )}
      <div className="relative flex max-h-full">
        <div
          className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain outline-hidden"
          role="listbox"
          id={`${baseId}-listbox`}
          tabIndex={field.searchable === false ? 0 : -1}
          onKeyDown={(e) => {
            if (field.searchable === false) {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev < filteredOptions.length - 1 ? prev + 1 : 0,
                  );
                }
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                if (filteredOptions.length > 0) {
                  setHighlightedIndex((prev) =>
                    prev > 0 ? prev - 1 : filteredOptions.length - 1,
                  );
                }
              } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                onBack?.();
              } else if (e.key === "Enter" && highlightedIndex >= 0) {
                e.preventDefault();
                const option = filteredOptions[highlightedIndex];
                if (option) {
                  onToggle(
                    option.value as T,
                    currentValues.includes(option.value),
                  );
                  if (!isMultiSelect) onBack?.();
                }
              } else if (e.key === "Escape") {
                e.preventDefault();
                onClose?.();
              }
              e.stopPropagation();
            }
          }}
        >
          <ScrollArea className="size-full min-h-0 **:data-[slot=scroll-area-scrollbar]:m-0 **:data-[slot=scroll-area-viewport]:h-full **:data-[slot=scroll-area-viewport]:overscroll-contain">
            {filteredOptions.length === 0 ? (
              <div className="text-muted-foreground py-2 text-center text-sm">
                {i18n.noResultsFound}
              </div>
            ) : (
              <DropdownMenuGroup>
                {filteredOptions.map((option, index) => {
                  const isSelected = currentValues.includes(option.value);
                  const isHighlighted = highlightedIndex === index;
                  const itemId = `${baseId}-item-${index}`;
                  return (
                    <DropdownMenuItem
                      key={String(option.value)}
                      id={itemId}
                      role="option"
                      aria-selected={isSelected}
                      data-highlighted={isHighlighted || undefined}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      className={cn(
                        "data-highlighted:bg-accent data-highlighted:text-accent-foreground gap-2",
                        option.className,
                      )}
                      closeOnClick={!isMultiSelect}
                      onClick={() => onToggle(option.value as T, isSelected)}
                    >
                      <Checkbox
                        checked={isSelected}
                        size="md"
                        className="pointer-events-none"
                        tabIndex={-1}
                        aria-hidden="true"
                      />
                      {option.icon}
                      <span className="truncate">{option.label}</span>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuGroup>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─── FilterChip ──────────────────────────────────────────────────────────────
interface FilterChipProps<T = unknown> {
  filter: Filter<T>;
  field: FilterFieldConfig<T>;
  size: "sm" | "default" | "lg";
  i18n: FilterI18nConfig;
  lastAddedFilterId: string | null;
  onUpdateFilter: (filterId: string, updates: Partial<Filter<T>>) => void;
  onRemoveFilter: (filterId: string) => void;
  openFilterId?: string | null;
  onOpenFilterHandled?: () => void;
}

function FilterChip<T = unknown>({
  filter,
  field,
  size,
  i18n,
  lastAddedFilterId,
  onUpdateFilter,
  onRemoveFilter,
  openFilterId,
  onOpenFilterHandled,
}: FilterChipProps<T>) {
  const isNewlyAdded = filter.id === lastAddedFilterId;
  const [valueSelectorOpen, setValueSelectorOpen] = useState(false);
  const chipRef = useRef<HTMLDivElement>(null);

  // Auto-open value selector for non-text fields when newly added
  useEffect(() => {
    if (isNewlyAdded && field.type !== "text") {
      // Small delay to let the chip render and the add-filter dropdown close
      const timer = setTimeout(() => setValueSelectorOpen(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isNewlyAdded, field.type]);

  // Open value selector when triggered from add-filter menu (duplicate prevention)
  useEffect(() => {
    if (openFilterId === filter.id) {
      const timer = setTimeout(() => {
        if (field.type === "text") {
          chipRef.current?.querySelector("input")?.focus();
        } else {
          setValueSelectorOpen(true);
        }
        onOpenFilterHandled?.();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [openFilterId, filter.id, field.type, onOpenFilterHandled]);

  const isMobile = useIsMobile();

  const fieldButton = (
    <Button
      variant="outline"
      size={size}
      data-slot="filter-field"
      className="text-foreground [&_svg]:text-muted-foreground min-w-0 flex-1 justify-start font-medium md:flex-none"
      onClick={() => {
        if (field.type === "text") {
          chipRef.current?.querySelector("input")?.focus();
        } else if (field.type === "custom") {
          const clickable = chipRef.current?.querySelector<HTMLElement>(
            "[data-slot=filter-value], [data-slot=button]",
          );
          clickable?.click();
        } else {
          setValueSelectorOpen(true);
        }
      }}
    >
      {field.icon}
      <span className="truncate">{field.label}</span>
    </Button>
  );

  const operatorDropdown = (
    <FilterOperatorDropdown<T>
      field={field}
      operator={filter.operator}
      values={filter.values}
      onChange={(operator) => onUpdateFilter(filter.id, { operator })}
    />
  );

  const valueSelector = (
    <FilterValueSelector<T>
      field={field}
      values={filter.values}
      operator={filter.operator}
      onChange={(values) => onUpdateFilter(filter.id, { values })}
      autoFocus={filter.id === lastAddedFilterId}
      open={valueSelectorOpen}
      onOpenChange={setValueSelectorOpen}
      className={cn("min-w-0 flex-1 md:flex-none", field.valueClassName)}
    />
  );

  const removeButton = !field.disableClear && (
    <FilterRemoveButton
      onClick={() => onRemoveFilter(filter.id)}
      aria-label={i18n.removeFilter}
      aria-description={field.label}
    />
  );

  if (isMobile) {
    return (
      <div
        ref={chipRef}
        data-slot="filter-chip"
        role="group"
        aria-label={field.label}
        className={cn(
          "bg-muted-background flex w-full max-w-full min-w-0 flex-col rounded-lg p-1",
          field.chipClassName,
        )}
      >
        <ButtonGroup
          className={cn(
            "grid w-full grid-cols-2",
            "[&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none!",
            "[&>*:not(:first-child)]:border-l-0!",
            "[&>*]:rounded-b-none! [&>*]:shadow-none! [&>[data-slot]:not(:has(~[data-slot]))]:rounded-br-none!",
          )}
        >
          {fieldButton}
          {operatorDropdown}
        </ButtonGroup>
        <ButtonGroup
          className={cn(
            "w-full",
            "[&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none!",
            "[&>*]:border-t-0! [&>*:not(:first-child)]:border-l-0!",
            "[&>*]:rounded-t-none! [&>*]:shadow-none! [&>[data-slot]:not(:has(~[data-slot]))]:rounded-tr-none!",
          )}
        >
          {valueSelector}
          {removeButton}
        </ButtonGroup>
      </div>
    );
  }

  return (
    <ButtonGroup
      ref={chipRef}
      data-slot="filter-chip"
      aria-label={field.label}
      className={cn(
        "w-fit max-w-full min-w-0 shrink-0",
        "[&>*:not(:first-child)]:rounded-l-none! [&>*:not(:last-child)]:rounded-r-none!",
        "[&>*:not(:first-child)]:border-l-0!",
        field.chipClassName,
      )}
    >
      {fieldButton}
      {operatorDropdown}
      {valueSelector}
      {removeButton}
    </ButtonGroup>
  );
}

// ─── Filters (main) ──────────────────────────────────────────────────────────
interface FiltersProps<T = unknown> {
  filters: Filter<T>[];
  fields: FilterFieldsConfig<T>;
  onChange: (filters: Filter<T>[]) => void;
  onClearAll?: () => void;
  clearAllButtonClassName?: string;
  align?: "start" | "end";
  className?: string;
  size?: "sm" | "default" | "lg";
  i18n?: Partial<FilterI18nConfig>;
  showSearchInput?: boolean;
  trigger?: React.ReactNode;
  allowMultiple?: boolean;
  menuPopupClassName?: string;
  enableShortcut?: boolean;
  shortcutKey?: string;
  shortcutLabel?: string;
}

export function Filters<T = unknown>({
  filters,
  fields,
  onChange,
  onClearAll,
  clearAllButtonClassName,
  align = "start",
  className,
  size = "default",
  i18n,
  showSearchInput = true,
  trigger,
  allowMultiple = true,
  menuPopupClassName,
  enableShortcut = false,
  shortcutKey = "f",
  shortcutLabel = "F",
}: FiltersProps<T>) {
  const [addFilterOpen, setAddFilterOpen] = useState(false);
  const [menuSearchInput, setMenuSearchInputState] = useState("");
  const [activeMenu, setActiveMenu] = useState<string>("root");
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [lastAddedFilterId, setLastAddedFilterId] = useState<string | null>(
    null,
  );
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const clearOpenFilterId = useCallback(() => setOpenFilterId(null), []);
  const rootInputRef = useRef<HTMLInputElement>(null);
  const rootId = useId();

  const setMenuSearchInput = useCallback((value: string) => {
    setMenuSearchInputState(value);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (!enableShortcut) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === shortcutKey.toLowerCase() &&
        !addFilterOpen &&
        !(
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        )
      ) {
        e.preventDefault();
        setAddFilterOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableShortcut, shortcutKey, addFilterOpen]);

  useEffect(() => {
    if (highlightedIndex >= 0 && addFilterOpen) {
      const element = document.getElementById(
        `${rootId}-item-${highlightedIndex}`,
      );
      element?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex, addFilterOpen, rootId]);

  useEffect(() => {
    if (!addFilterOpen) {
      const timer = setTimeout(() => setOpenSubMenu(null), 200);
      return () => clearTimeout(timer);
    }
  }, [addFilterOpen]);

  const [sessionFilterIds, setSessionFilterIds] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (lastAddedFilterId) {
      const timer = setTimeout(() => setLastAddedFilterId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedFilterId]);

  const mergedI18n: FilterI18nConfig = useMemo(() => mergeI18n(i18n), [i18n]);

  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (
              updates.operator === "empty" ||
              updates.operator === "not_empty"
            ) {
              updatedFilter.values = [] as T[];
            }
            return updatedFilter;
          }
          return filter;
        }),
      );
    },
    [filters, onChange],
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      onChange(filters.filter((filter) => filter.id !== filterId));
    },
    [filters, onChange],
  );

  const addFilter = useCallback(
    (fieldKey: string) => {
      const field = fieldsMap[fieldKey];
      if (field && field.key) {
        // If a chip already exists for this field, open its dropdown instead
        const existingFilter = filters.find((f) => f.field === fieldKey);
        if (existingFilter) {
          setOpenFilterId(existingFilter.id);
          setAddFilterOpen(false);
          setMenuSearchInput("");
          return;
        }

        const defaultOperator =
          field.defaultOperator ||
          (field.type === "multiselect" ? "is_any_of" : "is");
        const defaultValues: unknown[] = field.type === "text" ? [""] : [];
        const newFilter = createFilter<T>(
          fieldKey,
          defaultOperator,
          defaultValues as T[],
        );
        setLastAddedFilterId(newFilter.id);
        onChange([...filters, newFilter]);
        setAddFilterOpen(false);
        setMenuSearchInput("");
      }
    },
    [fieldsMap, filters, onChange, setMenuSearchInput],
  );

  const selectableFields = useMemo(() => getSelectableFields(fields), [fields]);

  const filteredFields = useMemo(() => {
    return selectableFields.filter(
      (f) =>
        !menuSearchInput ||
        f.label?.toLowerCase().includes(menuSearchInput.toLowerCase()),
    );
  }, [selectableFields, menuSearchInput]);

  // Sync highlight to first item when dropdown opens or filtered list changes
  const [prevAddFilterOpen, setPrevAddFilterOpen] = useState(addFilterOpen);
  const [prevFilteredCount, setPrevFilteredCount] = useState(
    filteredFields.length,
  );
  if (
    prevAddFilterOpen !== addFilterOpen ||
    prevFilteredCount !== filteredFields.length
  ) {
    setPrevAddFilterOpen(addFilterOpen);
    setPrevFilteredCount(filteredFields.length);
    if (addFilterOpen && filteredFields.length > 0) {
      setHighlightedIndex(0);
    }
  }

  return (
    <FilterContext.Provider
      value={{
        size,
        i18n: mergedI18n,
        className,
        trigger,
        allowMultiple,
      }}
    >
      <div
        data-slot="filters"
        className={cn(filtersContainerVariants({ size }), className)}
      >
        {selectableFields.length > 0 && (
          <DropdownMenu
            modal={false}
            open={addFilterOpen}
            onOpenChange={(open) => {
              setAddFilterOpen(open);
              if (!open) {
                setTimeout(() => {
                  setMenuSearchInput("");
                  setSessionFilterIds({});
                }, 200);
              } else {
                setActiveMenu("root");
              }
            }}
          >
            <DropdownMenuTrigger asChild>
              {trigger || (
                <Button
                  data-slot="filter-trigger"
                  variant="outline"
                  size={size}
                  className="shadow-sm"
                  aria-label={mergedI18n.addFilter}
                  aria-haspopup="menu"
                  aria-expanded={addFilterOpen}
                >
                  <ListFilterIcon aria-hidden="true" />
                  {mergedI18n.addFilter}
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className={cn("w-55", menuPopupClassName)}
              align={align}
            >
              {showSearchInput && (
                <>
                  <div className="relative">
                    <Input
                      ref={rootInputRef}
                      role="combobox"
                      aria-controls={`${rootId}-listbox`}
                      aria-activedescendant={
                        highlightedIndex >= 0
                          ? `${rootId}-item-${highlightedIndex}`
                          : undefined
                      }
                      placeholder={mergedI18n.searchFields}
                      className={cn(
                        "h-8 rounded-none border-0 bg-transparent! px-2 text-sm shadow-none",
                        "focus-visible:border-border focus-visible:ring-0 focus-visible:ring-offset-0",
                      )}
                      value={menuSearchInput}
                      onChange={(e) => setMenuSearchInput(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          if (filteredFields.length > 0) {
                            setHighlightedIndex((prev) =>
                              prev < filteredFields.length - 1 ? prev + 1 : 0,
                            );
                          }
                        } else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          if (filteredFields.length > 0) {
                            setHighlightedIndex((prev) =>
                              prev > 0 ? prev - 1 : filteredFields.length - 1,
                            );
                          }
                        } else if (
                          (e.key === "ArrowRight" || e.key === "ArrowLeft") &&
                          highlightedIndex >= 0
                        ) {
                          const field = filteredFields[highlightedIndex];
                          const hasSubMenu =
                            field &&
                            (field.type === "select" ||
                              field.type === "multiselect") &&
                            field.options?.length;

                          if (e.key === "ArrowRight" && hasSubMenu) {
                            e.preventDefault();
                            setOpenSubMenu(field.key || null);
                            setActiveMenu(field.key || "root");
                          } else if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            if (openSubMenu) {
                              setOpenSubMenu(null);
                              setActiveMenu("root");
                            }
                          }
                        } else if (e.key === "Enter" && highlightedIndex >= 0) {
                          e.preventDefault();
                          const field = filteredFields[highlightedIndex];
                          if (field.key) {
                            const hasSubMenu =
                              (field.type === "select" ||
                                field.type === "multiselect") &&
                              field.options?.length;
                            if (!hasSubMenu) {
                              addFilter(field.key);
                            } else {
                              if (openSubMenu === field.key) {
                                setOpenSubMenu(null);
                                setActiveMenu("root");
                              } else {
                                setOpenSubMenu(field.key);
                                setActiveMenu(field.key);
                              }
                            }
                          }
                        } else if (e.key === "Escape") {
                          setAddFilterOpen(false);
                        }
                        e.stopPropagation();
                      }}
                    />
                    {enableShortcut && shortcutLabel && (
                      <Kbd className="bg-background absolute top-1/2 right-2 -translate-y-1/2 border">
                        {shortcutLabel}
                      </Kbd>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                </>
              )}

              <div className="relative flex max-h-full">
                <div
                  className="flex max-h-[min(var(--available-height),24rem)] w-full scroll-pt-2 scroll-pb-2 flex-col overscroll-contain"
                  role="listbox"
                  id={`${rootId}-listbox`}
                >
                  <ScrollArea className="**:data-[slot=scroll-area-scrollbar]:m-0">
                    {(() => {
                      if (filteredFields.length === 0) {
                        return (
                          <div className="text-muted-foreground py-2 text-center text-sm">
                            {mergedI18n.noFieldsFound}
                          </div>
                        );
                      }

                      return filteredFields.map((field, index) => {
                        const isHighlighted = highlightedIndex === index;
                        const itemId = `${rootId}-item-${index}`;
                        const hasSubMenu =
                          (field.type === "select" ||
                            field.type === "multiselect") &&
                          field.options?.length;

                        if (hasSubMenu) {
                          const isMultiSelect = field.type === "multiselect";
                          const fieldKey = field.key as string;
                          const existingFieldFilter = filters.find(
                            (f) => f.field === fieldKey,
                          );
                          const sessionFilterId = sessionFilterIds[fieldKey];
                          const sessionFilter = sessionFilterId
                            ? filters.find((f) => f.id === sessionFilterId)
                            : null;
                          const currentValues =
                            existingFieldFilter?.values ||
                            sessionFilter?.values ||
                            [];

                          return (
                            <DropdownMenuSub
                              key={fieldKey}
                              open={openSubMenu === fieldKey}
                              onOpenChange={(open) => {
                                if (open) {
                                  setOpenSubMenu((prev) =>
                                    prev === fieldKey ? prev : fieldKey,
                                  );
                                } else {
                                  if (openSubMenu === fieldKey) {
                                    setOpenSubMenu(null);
                                    setActiveMenu("root");
                                  }
                                }
                              }}
                            >
                              <DropdownMenuSubTrigger
                                id={itemId}
                                role="option"
                                aria-selected={isHighlighted}
                                data-highlighted={isHighlighted || undefined}
                                onMouseEnter={() => setHighlightedIndex(index)}
                                className="data-[state=open]:bg-accent data-[state=open]:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                              >
                                {field.icon}
                                <span>{field.label}</span>
                                {currentValues.length > 0 && (
                                  <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                    {currentValues.length}
                                  </span>
                                )}
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="w-50">
                                <FilterSubmenuContent
                                  field={field}
                                  currentValues={currentValues}
                                  isMultiSelect={isMultiSelect}
                                  i18n={mergedI18n}
                                  isActive={activeMenu === fieldKey}
                                  onActive={() => {
                                    if (field.searchable !== false) {
                                      setActiveMenu(fieldKey);
                                    }
                                  }}
                                  onBack={() => {
                                    setOpenSubMenu(null);
                                    setActiveMenu("root");
                                  }}
                                  onClose={() => setAddFilterOpen(false)}
                                  onToggle={(value, isSelected) => {
                                    if (isMultiSelect) {
                                      const nextValues = isSelected
                                        ? (currentValues.filter(
                                            (v) => v !== value,
                                          ) as T[])
                                        : ([...currentValues, value] as T[]);

                                      // Find an existing filter to update (either from chips or this session)
                                      const targetFilter =
                                        existingFieldFilter ?? sessionFilter;
                                      if (targetFilter) {
                                        if (nextValues.length === 0) {
                                          onChange(
                                            filters.filter(
                                              (f) => f.id !== targetFilter.id,
                                            ),
                                          );
                                          setSessionFilterIds((prev) => ({
                                            ...prev,
                                            [fieldKey]: "",
                                          }));
                                        } else {
                                          onChange(
                                            filters.map((f) =>
                                              f.id === targetFilter.id
                                                ? { ...f, values: nextValues }
                                                : f,
                                            ),
                                          );
                                        }
                                      } else {
                                        const newFilter = createFilter<T>(
                                          fieldKey,
                                          field.defaultOperator || "is_any_of",
                                          nextValues,
                                        );
                                        onChange([...filters, newFilter]);
                                        setSessionFilterIds((prev) => ({
                                          ...prev,
                                          [fieldKey]: newFilter.id,
                                        }));
                                      }
                                    } else {
                                      // Single-select: update existing filter if present
                                      if (existingFieldFilter) {
                                        onChange(
                                          isSelected
                                            ? filters.filter(
                                                (f) =>
                                                  f.id !==
                                                  existingFieldFilter.id,
                                              )
                                            : filters.map((f) =>
                                                f.id === existingFieldFilter.id
                                                  ? {
                                                      ...f,
                                                      values: [value] as T[],
                                                    }
                                                  : f,
                                              ),
                                        );
                                        setAddFilterOpen(false);
                                      } else {
                                        const newFilter = createFilter<T>(
                                          fieldKey,
                                          field.defaultOperator || "is",
                                          [value] as T[],
                                        );
                                        setLastAddedFilterId(newFilter.id);
                                        onChange([...filters, newFilter]);
                                        setAddFilterOpen(false);
                                      }
                                    }
                                  }}
                                />
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          );
                        }

                        const existingFilter = filters.find(
                          (f) => f.field === field.key,
                        );
                        const filterValueCount =
                          existingFilter?.values.filter(
                            (v) => v !== "" && v != null,
                          ).length || 0;

                        return (
                          <DropdownMenuItem
                            key={field.key}
                            id={itemId}
                            role="option"
                            aria-selected={isHighlighted}
                            data-highlighted={isHighlighted || undefined}
                            onMouseEnter={() => setHighlightedIndex(index)}
                            onClick={() => field.key && addFilter(field.key)}
                            className="data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                          >
                            {field.icon}
                            <span>{field.label}</span>
                            {filterValueCount > 0 && (
                              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                {filterValueCount}
                              </span>
                            )}
                          </DropdownMenuItem>
                        );
                      });
                    })()}
                  </ScrollArea>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {filters.map((filter) => {
          const field = fieldsMap[filter.field];
          if (!field) return null;
          return (
            <FilterChip<T>
              key={filter.id}
              filter={filter}
              field={field}
              size={size}
              i18n={mergedI18n}
              lastAddedFilterId={lastAddedFilterId}
              onUpdateFilter={updateFilter}
              onRemoveFilter={removeFilter}
              openFilterId={openFilterId}
              onOpenFilterHandled={clearOpenFilterId}
            />
          );
        })}

        {filters.length > 0 && (
          <Button
            data-slot="filter-clear-all"
            type="button"
            variant="ghost"
            size={size}
            onClick={onClearAll ?? (() => onChange([]))}
            className={cn(
              "text-muted-foreground hover:text-foreground gap-1.5 underline underline-offset-4",
              clearAllButtonClassName,
            )}
          >
            <XIcon aria-hidden="true" />
            {mergedI18n.clearAll}
          </Button>
        )}
      </div>
    </FilterContext.Provider>
  );
}

// ─── SavedFilterRow / SavedFilterRenameRow ───────────────────────────────────
interface SavedFilterRowProps {
  name: string;
  index: number;
  isActive: boolean;
  canRename: boolean;
  canDelete: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
  onFocusRow: (index: number) => void;
  onActivate: (index: number) => void;
  rowCount: number;
}

function SavedFilterRow({
  name,
  index,
  isActive,
  canRename,
  canDelete,
  onSelect,
  onRename,
  onDelete,
  onFocusRow,
  onActivate,
  rowCount,
}: SavedFilterRowProps) {
  const { t } = useTranslation();
  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        onFocusRow(index < rowCount - 1 ? index + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        onFocusRow(index > 0 ? index - 1 : rowCount - 1);
        break;
      case "Home":
        e.preventDefault();
        onFocusRow(0);
        break;
      case "End":
        e.preventDefault();
        onFocusRow(rowCount - 1);
        break;
      case "ArrowRight": {
        const firstAction =
          e.currentTarget.parentElement?.querySelector<HTMLButtonElement>(
            '[data-saved-action="rename"], [data-saved-action="delete"]',
          );
        if (firstAction) {
          e.preventDefault();
          firstAction.focus();
        }
        break;
      }
      default:
        break;
    }
  };

  const handleActionKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    const rowEl = e.currentTarget.closest<HTMLElement>('[role="option"]');
    const selectBtn = rowEl?.querySelector<HTMLButtonElement>(
      '[data-saved-action="select"]',
    );
    switch (e.key) {
      case "ArrowLeft": {
        e.preventDefault();
        const prev = e.currentTarget
          .previousElementSibling as HTMLButtonElement | null;
        if (prev?.hasAttribute("data-saved-action")) prev.focus();
        else selectBtn?.focus();
        break;
      }
      case "ArrowRight": {
        e.preventDefault();
        const next = e.currentTarget
          .nextElementSibling as HTMLButtonElement | null;
        if (next?.hasAttribute("data-saved-action")) next.focus();
        else selectBtn?.focus();
        break;
      }
      case "ArrowDown":
        e.preventDefault();
        onFocusRow(index < rowCount - 1 ? index + 1 : 0);
        break;
      case "ArrowUp":
        e.preventDefault();
        onFocusRow(index > 0 ? index - 1 : rowCount - 1);
        break;
      case "Escape":
        e.preventDefault();
        selectBtn?.focus();
        break;
      default:
        break;
    }
  };

  return (
    <div
      role="option"
      aria-selected={isActive}
      className={cn(
        "group/saved-row relative flex items-center gap-0.5 rounded-sm px-1 py-0.5 transition-colors",
        "hover:bg-accent/40",
        "focus-within:bg-accent/60",
        isActive && "bg-accent/40",
      )}
      onFocus={() => onActivate(index)}
    >
      <Button
        data-saved-action="select"
        data-saved-index={index}
        variant="ghost"
        size="sm"
        tabIndex={0}
        className={cn(
          "min-w-0 flex-1 justify-start px-2 font-normal",
          "hover:bg-accent hover:text-accent-foreground",
          "focus-visible:bg-accent focus-visible:text-accent-foreground",
        )}
        onClick={onSelect}
        onKeyDown={handleRowKeyDown}
        aria-label={t("filter_load_saved", { name })}
      >
        <span className="truncate">{name}</span>
      </Button>
      <span
        className={cn(
          "flex shrink-0 items-center gap-0.5 transition-opacity",
          "opacity-0 group-focus-within/saved-row:opacity-100 group-hover/saved-row:opacity-100",
        )}
      >
        {canRename && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-saved-action="rename"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground size-7"
                onClick={onRename}
                onKeyDown={handleActionKeyDown}
                aria-label={t("filter_rename_saved", { name })}
              >
                <SquarePenIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("rename")}</TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                data-saved-action="delete"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive size-7"
                onClick={onDelete}
                onKeyDown={handleActionKeyDown}
                aria-label={t("filter_delete_saved", { name })}
              >
                <XIcon />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("delete")}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </div>
  );
}

interface SavedFilterRenameRowProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function SavedFilterRenameRow({
  value,
  onChange,
  onSubmit,
  onCancel,
  inputRef,
}: SavedFilterRenameRowProps) {
  const { t } = useTranslation();
  return (
    <div className="px-1 py-0.5">
      <ButtonGroup className="w-full">
        <Input
          ref={inputRef}
          className="flex-1 text-sm"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              onCancel();
            }
          }}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label={t("filter_cancel_rename")}
          onClick={onCancel}
        >
          <XIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={t("filter_save_name")}
          onClick={onSubmit}
        >
          <CheckIcon />
        </Button>
      </ButtonGroup>
    </div>
  );
}

// ─── FilterPanel (popover-based variant) ─────────────────────────────────────
type FilterConjunction = "and" | "or";

export interface SavedFilter<T = unknown> {
  id: string;
  name: string;
  filters: Filter<T>[];
  conjunction: FilterConjunction;
}

interface FilterPanelProps<T = unknown> {
  filters: Filter<T>[];
  fields: FilterFieldsConfig<T>;
  onChange: (filters: Filter<T>[]) => void;
  conjunction?: FilterConjunction;
  onConjunctionChange?: (conjunction: FilterConjunction) => void;
  onSave?: (
    name: string,
    filters: Filter<T>[],
    conjunction: FilterConjunction,
  ) => void;
  savedFilters?: SavedFilter<T>[];
  onLoadSavedFilter?: (saved: SavedFilter<T>) => void;
  onDeleteSavedFilter?: (id: string) => void;
  onRenameSavedFilter?: (id: string, name: string) => void;
  className?: string;
  size?: "sm" | "default" | "lg";
  i18n?: Partial<FilterI18nConfig>;
  trigger?: React.ReactNode;
  allowMultiple?: boolean;
  popoverClassName?: string;
}

export function FilterPanel<T = unknown>({
  filters,
  fields,
  onChange,
  conjunction: controlledConjunction,
  onSave,
  savedFilters,
  onLoadSavedFilter,
  onDeleteSavedFilter,
  onRenameSavedFilter,
  className,
  size = "default",
  i18n,
  trigger,
  allowMultiple = true,
  popoverClassName,
}: FilterPanelProps<T>) {
  const { t } = useTranslation();
  const [open, setOpenState] = useState(false);
  const [internalConjunction] = useState<FilterConjunction>("and");
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [fieldPickerSearch, setFieldPickerSearchState] = useState("");
  const [highlightedFieldIndex, setHighlightedFieldIndex] = useState(-1);
  const [lastAddedFilterId, setLastAddedFilterId] = useState<string | null>(
    null,
  );
  const [openFilterId, setOpenFilterId] = useState<string | null>(null);
  const [savingFilterName, setSavingFilterName] = useState<string | null>(null);
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [editingFilterName, setEditingFilterName] = useState("");
  const [savedFiltersOpen, setSavedFiltersOpenState] = useState(false);
  const [highlightedSavedIndex, setHighlightedSavedIndex] = useState(-1);
  const savedListRef = useRef<HTMLDivElement>(null);
  const savedPopoverContentRef = useRef<HTMLDivElement>(null);
  const saveInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const clearOpenFilterId = useCallback(() => setOpenFilterId(null), []);
  const fieldPickerInputRef = useRef<HTMLInputElement>(null);
  const fieldPickerId = useId();

  const conjunction = controlledConjunction ?? internalConjunction;
  const isMobile = useIsMobile();

  const mergedI18n: FilterI18nConfig = useMemo(() => mergeI18n(i18n), [i18n]);

  const fieldsMap = useMemo(() => getFieldsMap(fields), [fields]);

  const setFieldPickerSearch = useCallback((value: string) => {
    setFieldPickerSearchState(value);
    setHighlightedFieldIndex(-1);
  }, []);

  const setOpen = useCallback(
    (next: boolean) => {
      setOpenState(next);
      if (next && filters.length === 0) {
        setShowFieldPicker(true);
      }
      if (!next) {
        setTimeout(() => {
          setShowFieldPicker(false);
          setFieldPickerSearchState("");
          setHighlightedFieldIndex(-1);
          setSavingFilterName(null);
          setEditingFilterId(null);
        }, 200);
      }
    },
    [filters.length],
  );

  const setSavedFiltersOpen = useCallback((next: boolean) => {
    setSavedFiltersOpenState(next);
    if (next) setHighlightedSavedIndex(-1);
  }, []);

  const selectableFields = useMemo(() => getSelectableFields(fields), [fields]);

  const filteredPickerFields = useMemo(
    () =>
      selectableFields.filter(
        (f) =>
          !fieldPickerSearch ||
          f.label?.toLowerCase().includes(fieldPickerSearch.toLowerCase()),
      ),
    [selectableFields, fieldPickerSearch],
  );

  // Sync highlight to first item when picker opens or filtered list changes
  const [prevShowFieldPicker, setPrevShowFieldPicker] =
    useState(showFieldPicker);
  const [prevFilteredPickerCount, setPrevFilteredPickerCount] = useState(
    filteredPickerFields.length,
  );
  if (
    prevShowFieldPicker !== showFieldPicker ||
    prevFilteredPickerCount !== filteredPickerFields.length
  ) {
    setPrevShowFieldPicker(showFieldPicker);
    setPrevFilteredPickerCount(filteredPickerFields.length);
    if (showFieldPicker && filteredPickerFields.length > 0) {
      setHighlightedFieldIndex(0);
    }
  }

  // Focus the search input when field picker opens
  useEffect(() => {
    if (showFieldPicker) {
      requestAnimationFrame(() => fieldPickerInputRef.current?.focus());
    }
  }, [showFieldPicker]);

  useEffect(() => {
    if (lastAddedFilterId) {
      const timer = setTimeout(() => setLastAddedFilterId(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [lastAddedFilterId]);

  // Auto-focus and select save input
  useEffect(() => {
    if (savingFilterName !== null) {
      requestAnimationFrame(() => {
        saveInputRef.current?.focus();
        saveInputRef.current?.select();
      });
    }
  }, [savingFilterName]);

  // Auto-focus and select edit input
  useEffect(() => {
    if (editingFilterId) {
      requestAnimationFrame(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
      });
    }
  }, [editingFilterId]);

  const addFilter = useCallback(
    (fieldKey: string) => {
      const field = fieldsMap[fieldKey];
      if (field && field.key) {
        // If a chip already exists for this field, open its dropdown instead
        const existingFilter = filters.find((f) => f.field === fieldKey);
        if (existingFilter) {
          setOpenFilterId(existingFilter.id);
          setShowFieldPicker(false);
          setFieldPickerSearch("");
          return;
        }

        const defaultOperator =
          field.defaultOperator ||
          (field.type === "multiselect" ? "is_any_of" : "is");
        const defaultValues: unknown[] = field.type === "text" ? [""] : [];
        const newFilter = createFilter<T>(
          fieldKey,
          defaultOperator,
          defaultValues as T[],
        );
        setLastAddedFilterId(newFilter.id);
        onChange([...filters, newFilter]);
        setShowFieldPicker(false);
        setFieldPickerSearch("");
      }
    },
    [fieldsMap, filters, onChange, setFieldPickerSearch],
  );

  const updateFilter = useCallback(
    (filterId: string, updates: Partial<Filter<T>>) => {
      onChange(
        filters.map((filter) => {
          if (filter.id === filterId) {
            const updatedFilter = { ...filter, ...updates };
            if (
              updates.operator === "empty" ||
              updates.operator === "not_empty"
            ) {
              updatedFilter.values = [] as T[];
            }
            return updatedFilter;
          }
          return filter;
        }),
      );
    },
    [filters, onChange],
  );

  const removeFilter = useCallback(
    (filterId: string) => {
      const next = filters.filter((f) => f.id !== filterId);
      onChange(next);
      if (next.length === 0) {
        setShowFieldPicker(true);
      }
    },
    [filters, onChange],
  );

  const activeFilterCount = filters.filter((f) => {
    if (f.operator === "empty" || f.operator === "not_empty") return true;
    return f.values.length > 0 && f.values.some((v) => v !== "" && v != null);
  }).length;

  return (
    <FilterContext.Provider
      value={{
        size,
        i18n: mergedI18n,
        className,
        allowMultiple,
      }}
    >
      {(() => {
        const triggerNode = trigger || (
          <Button
            data-slot="filter-panel-trigger"
            variant="outline"
            size={size}
            className={cn(activeFilterCount > 0 && "gap-1.5", className)}
          >
            <ListFilterIcon aria-hidden="true" />
            {mergedI18n.addFilter}
            {activeFilterCount > 0 && (
              <Badge variant="primary" size="sm" counter>
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        );

        const body = (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-muted-foreground text-sm font-medium tracking-wider">
                {mergedI18n.addFilterTitle}
              </span>
              <div className="flex items-center gap-1">
                {onSave && (
                  <Popover
                    open={savedFiltersOpen}
                    onOpenChange={(v) => {
                      setSavedFiltersOpen(v);
                      if (!v) {
                        setSavingFilterName(null);
                        setEditingFilterId(null);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground gap-1.5"
                        aria-label={t("saved_filters")}
                      >
                        {t("saved_filters")}
                        <ChevronDownIcon className="size-3.5" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      ref={savedPopoverContentRef}
                      align="end"
                      side="bottom"
                      className="w-64 gap-0 p-0"
                      initialFocus={() =>
                        savedPopoverContentRef.current ?? undefined
                      }
                      onKeyDown={(e) => {
                        if (e.key !== "ArrowDown" && e.key !== "ArrowUp")
                          return;
                        const active =
                          document.activeElement as HTMLElement | null;
                        if (
                          active &&
                          savedListRef.current?.contains(active) &&
                          active.closest('[role="option"]')
                        ) {
                          return;
                        }
                        if (!savedFilters || savedFilters.length === 0) return;
                        e.preventDefault();
                        const targetIndex =
                          e.key === "ArrowDown" ? 0 : savedFilters.length - 1;
                        const el =
                          savedListRef.current?.querySelector<HTMLElement>(
                            `[data-saved-index="${targetIndex}"]`,
                          );
                        el?.focus();
                        setHighlightedSavedIndex(targetIndex);
                      }}
                    >
                      {/* Saved filter list */}
                      {savedFilters && savedFilters.length > 0 && (
                        <TooltipProvider delay={300}>
                          <div
                            ref={savedListRef}
                            role="listbox"
                            aria-label={t("saved_filters")}
                            className="max-h-64 overflow-y-auto p-1"
                          >
                            {savedFilters.map((saved, index) => {
                              if (editingFilterId === saved.id) {
                                return (
                                  <SavedFilterRenameRow
                                    key={saved.id}
                                    value={editingFilterName}
                                    onChange={setEditingFilterName}
                                    inputRef={editInputRef}
                                    onSubmit={() => {
                                      const trimmed = editingFilterName.trim();
                                      if (trimmed) {
                                        onRenameSavedFilter?.(
                                          saved.id,
                                          trimmed,
                                        );
                                        setEditingFilterId(null);
                                        requestAnimationFrame(() => {
                                          const el =
                                            savedListRef.current?.querySelector<HTMLElement>(
                                              `[data-saved-index="${index}"]`,
                                            );
                                          el?.focus();
                                        });
                                      }
                                    }}
                                    onCancel={() => {
                                      setEditingFilterId(null);
                                      requestAnimationFrame(() => {
                                        const el =
                                          savedListRef.current?.querySelector<HTMLElement>(
                                            `[data-saved-index="${index}"]`,
                                          );
                                        el?.focus();
                                      });
                                    }}
                                  />
                                );
                              }
                              return (
                                <SavedFilterRow
                                  key={saved.id}
                                  name={saved.name}
                                  index={index}
                                  rowCount={savedFilters.length}
                                  isActive={highlightedSavedIndex === index}
                                  canRename={Boolean(onRenameSavedFilter)}
                                  canDelete={Boolean(onDeleteSavedFilter)}
                                  onActivate={setHighlightedSavedIndex}
                                  onFocusRow={(i) => {
                                    setHighlightedSavedIndex(i);
                                    const el =
                                      savedListRef.current?.querySelector<HTMLElement>(
                                        `[data-saved-index="${i}"]`,
                                      );
                                    el?.focus();
                                  }}
                                  onSelect={() => {
                                    setSavedFiltersOpen(false);
                                    setTimeout(
                                      () => onLoadSavedFilter?.(saved),
                                      150,
                                    );
                                  }}
                                  onRename={() => {
                                    setEditingFilterId(saved.id);
                                    setEditingFilterName(saved.name);
                                  }}
                                  onDelete={() => {
                                    onDeleteSavedFilter?.(saved.id);
                                    const nextIndex = Math.min(
                                      index,
                                      savedFilters.length - 2,
                                    );
                                    if (nextIndex >= 0) {
                                      setHighlightedSavedIndex(nextIndex);
                                      requestAnimationFrame(() => {
                                        const el =
                                          savedListRef.current?.querySelector<HTMLElement>(
                                            `[data-saved-index="${nextIndex}"]`,
                                          );
                                        el?.focus();
                                      });
                                    }
                                  }}
                                />
                              );
                            })}
                          </div>
                        </TooltipProvider>
                      )}

                      {/* Save new filter input */}
                      {savingFilterName !== null && (
                        <>
                          {savedFilters && savedFilters.length > 0 && (
                            <Separator />
                          )}
                          <div className="p-1">
                            <ButtonGroup className="w-full">
                              <Input
                                ref={saveInputRef}
                                className="h-8 flex-1 text-sm"
                                placeholder={t("filter_name_placeholder")}
                                value={savingFilterName}
                                onChange={(e) =>
                                  setSavingFilterName(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault();
                                    const trimmed = savingFilterName.trim();
                                    if (trimmed) {
                                      onSave(trimmed, filters, conjunction);
                                      setSavingFilterName(null);
                                    }
                                  } else if (e.key === "Escape") {
                                    setSavingFilterName(null);
                                  }
                                }}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={t("cancel")}
                                onClick={() => setSavingFilterName(null)}
                              >
                                <XIcon />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                aria-label={t("filter_save")}
                                onClick={() => {
                                  const trimmed = savingFilterName.trim();
                                  if (trimmed) {
                                    onSave(trimmed, filters, conjunction);
                                    setSavingFilterName(null);
                                  }
                                }}
                              >
                                <CheckIcon />
                              </Button>
                            </ButtonGroup>
                          </div>
                        </>
                      )}

                      {/* Empty state or save button */}
                      {savingFilterName === null && (
                        <>
                          {(!savedFilters || savedFilters.length === 0) && (
                            <div className="px-3 py-4 text-center">
                              <p className="text-muted-foreground text-sm font-medium">
                                {t("filter_no_saved")}
                              </p>
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                {t("filter_save_frequent_hint")}
                              </p>
                            </div>
                          )}
                          {activeFilterCount > 0 && (
                            <>
                              {savedFilters && savedFilters.length > 0 && (
                                <Separator />
                              )}
                              <div className="p-3">
                                <Button
                                  variant="outline"
                                  className="w-full"
                                  onClick={() =>
                                    setSavingFilterName(
                                      t("filter_set_name", {
                                        number: (savedFilters?.length ?? 0) + 1,
                                      }),
                                    )
                                  }
                                >
                                  <PlusIcon />
                                  {t("filter_save_current")}
                                </Button>
                              </div>
                            </>
                          )}
                          {activeFilterCount === 0 &&
                            savedFilters &&
                            savedFilters.length > 0 && (
                              <div className="text-muted-foreground px-3 py-2 text-center text-xs">
                                {t("filter_add_to_save")}
                              </div>
                            )}
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {filters.length > 0 && (
                  <Button
                    data-slot="filter-clear-all"
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange([])}
                    className="text-muted-foreground hover:text-foreground gap-1.5 underline underline-offset-4"
                  >
                    {mergedI18n.clearAll}
                  </Button>
                )}
              </div>
            </div>

            <Separator />

            {/* Filter chips */}
            {filters.length > 0 && (
              <div className="grid gap-2 px-3 py-2 **:data-[slot=filter-chip]:w-full">
                {filters.map((filter) => {
                  const field = fieldsMap[filter.field];
                  if (!field) return null;

                  return (
                    <FilterChip<T>
                      key={filter.id}
                      filter={filter}
                      field={field}
                      size={size}
                      i18n={mergedI18n}
                      lastAddedFilterId={lastAddedFilterId}
                      onUpdateFilter={updateFilter}
                      onRemoveFilter={removeFilter}
                      openFilterId={openFilterId}
                      onOpenFilterHandled={clearOpenFilterId}
                    />
                  );
                })}
              </div>
            )}

            {/* Field picker (inline dropdown) */}
            {showFieldPicker && (
              <>
                {filters.length > 0 && <Separator />}
                <div className="p-1">
                  <Input
                    ref={fieldPickerInputRef}
                    role="combobox"
                    aria-controls={`${fieldPickerId}-listbox`}
                    aria-activedescendant={
                      highlightedFieldIndex >= 0
                        ? `${fieldPickerId}-item-${highlightedFieldIndex}`
                        : undefined
                    }
                    placeholder={mergedI18n.searchFields}
                    className={cn(
                      "h-8 border-0 bg-transparent! px-2 text-sm shadow-none",
                      "focus-visible:ring-0 focus-visible:ring-offset-0",
                    )}
                    value={fieldPickerSearch}
                    onChange={(e) => setFieldPickerSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        if (filteredPickerFields.length > 0) {
                          setHighlightedFieldIndex((prev) =>
                            prev < filteredPickerFields.length - 1
                              ? prev + 1
                              : 0,
                          );
                        }
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        if (filteredPickerFields.length > 0) {
                          setHighlightedFieldIndex((prev) =>
                            prev > 0
                              ? prev - 1
                              : filteredPickerFields.length - 1,
                          );
                        }
                      } else if (
                        e.key === "Enter" &&
                        highlightedFieldIndex >= 0
                      ) {
                        e.preventDefault();
                        const f = filteredPickerFields[highlightedFieldIndex];
                        if (f?.key) addFilter(f.key);
                      } else if (e.key === "Escape") {
                        if (filters.length > 0) {
                          setShowFieldPicker(false);
                        } else {
                          setOpen(false);
                        }
                      }
                    }}
                  />
                  <Separator className="mb-1" />
                  <div
                    role="listbox"
                    id={`${fieldPickerId}-listbox`}
                    className="max-h-52 overflow-y-auto"
                  >
                    {filteredPickerFields.length === 0 ? (
                      <div className="text-muted-foreground py-4 text-center text-sm">
                        {mergedI18n.noFieldsFound}
                      </div>
                    ) : (
                      filteredPickerFields.map((f, index) => {
                        const existingFilter = filters.find(
                          (fil) => fil.field === f.key,
                        );
                        const filterValueCount =
                          existingFilter?.values.filter(
                            (v) => v !== "" && v != null,
                          ).length || 0;

                        return (
                          <button
                            key={f.key}
                            id={`${fieldPickerId}-item-${index}`}
                            role="option"
                            aria-selected={highlightedFieldIndex === index}
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
                              highlightedFieldIndex === index
                                ? "bg-accent text-accent-foreground"
                                : "hover:bg-accent hover:text-accent-foreground",
                            )}
                            onMouseEnter={() => setHighlightedFieldIndex(index)}
                            onClick={() => f.key && addFilter(f.key)}
                          >
                            {f.icon && (
                              <span className="text-muted-foreground">
                                {f.icon}
                              </span>
                            )}
                            <span>{f.label}</span>
                            {filterValueCount > 0 && (
                              <span className="text-muted-foreground ml-auto text-xs tabular-nums">
                                {filterValueCount}
                              </span>
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Add filter button */}
            {!showFieldPicker && selectableFields.length > 0 && (
              <>
                <Separator />
                <div className="p-3">
                  <Button
                    variant="secondary"
                    className=""
                    onClick={() => setShowFieldPicker(true)}
                  >
                    <PlusIcon />
                    {mergedI18n.addFilter}
                  </Button>
                </div>
              </>
            )}
          </>
        );

        if (isMobile) {
          return (
            <Drawer open={open} onOpenChange={setOpen}>
              <DrawerTrigger asChild>{triggerNode}</DrawerTrigger>
              <DrawerContent
                className={cn(
                  "max-h-[85vh] gap-0 overflow-y-auto p-0",
                  popoverClassName,
                )}
              >
                <FilterPanelMobileContext.Provider value={true}>
                  {body}
                </FilterPanelMobileContext.Provider>
              </DrawerContent>
            </Drawer>
          );
        }

        return (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>{triggerNode}</PopoverTrigger>
            <PopoverContent
              align="start"
              className={cn(
                "w-auto max-w-[calc(100vw-2rem)] min-w-80 gap-0 p-0",
                popoverClassName,
              )}
            >
              {body}
            </PopoverContent>
          </Popover>
        );
      })()}
    </FilterContext.Provider>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const createFilter = <T = unknown,>(
  field: string,
  operator?: string,
  values: T[] = [],
): Filter<T> => ({
  id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
  field,
  operator: operator || "is",
  values,
});

export const createFilterGroup = <T = unknown,>(
  id: string,
  label: string,
  fields: FilterFieldConfig<T>[],
  initialFilters: Filter<T>[] = [],
): FilterGroup<T> => ({
  id,
  label,
  filters: initialFilters,
  fields,
});
