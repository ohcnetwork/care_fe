import { ChevronDown, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { ButtonGroup } from "@/components/ui/button-group";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
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

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";

import useBreakpoints from "@/hooks/useBreakpoints";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface AutoCompleteOption {
  label: string;
  value: string;
}

interface AutocompleteProps {
  options: AutoCompleteOption[];
  isLoading?: boolean;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  onOpenChange?: (open: boolean) => void;
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: React.ReactNode;
  disabled?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
  popoverClassName?: string;
  popoverContentClassName?: string;
  freeInput?: boolean;
  closeOnSelect?: boolean;
  showClearButton?: boolean;
  ref?: React.RefCallback<HTMLButtonElement | null>;
  "aria-invalid"?: boolean;
  id?: string;
  "aria-labelledby"?: string;
  shortcutId?: string;
}

export default function Autocomplete({
  options,
  isLoading = false,
  value,
  onChange,
  onSearch,
  onOpenChange,
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
  disabled,
  align = "start",
  className,
  popoverClassName,
  popoverContentClassName,
  freeInput = false,
  closeOnSelect = true,
  showClearButton = true,
  ref,
  shortcutId,
  ...props
}: AutocompleteProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const controlRef = React.useRef<HTMLDivElement>(null);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption?.label || (freeInput ? value : "");
  const clearVisible = !!selectedOption && showClearButton && !disabled;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
    onOpenChange?.(nextOpen);
  };

  const triggerButton = (
    <button
      {...props}
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      title={displayText || undefined}
      data-shortcut-id={shortcutId}
      className={cn(
        fieldTriggerLayout,
        fieldTriggerSurface,
        triggerFocus,
        invalidTriggerRing,
        "min-w-0 flex-1 justify-between font-normal",
        className,
        popoverClassName,
      )}
    >
      <span
        className={cn(
          "w-0 min-w-0 flex-1 truncate text-left",
          !displayText && "text-muted-foreground",
        )}
      >
        {displayText || placeholder || t("autocomplete_select_placeholder")}
      </span>
      <span className="flex items-center gap-1 shrink-0">
        {shortcutId && <ShortcutBadge actionId={shortcutId} />}
        {!clearVisible && (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </span>
    </button>
  );

  const clearButton = clearVisible && (
    <button
      type="button"
      data-slot="autocomplete-clear"
      aria-label={t("clear")}
      className={cn(
        fieldTriggerSurface,
        triggerFocus,
        "inline-flex size-12 shrink-0 items-center justify-center md:size-10",
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onChange("");
        onSearch?.("");
        handleOpenChange(false);
      }}
    >
      <X aria-hidden="true" className="size-4" />
    </button>
  );

  const content = (
    <>
      <div className="p-2 border-b border-gray-100 shadow-xs">
        <ComboboxInput
          placeholder={inputPlaceholder || t("autocomplete_search_placeholder")}
          aria-label={inputPlaceholder || t("autocomplete_search_placeholder")}
          disabled={disabled}
          showTrigger={false}
        />
      </div>
      {isLoading ? (
        <CardListSkeleton count={3} />
      ) : (
        <ComboboxEmpty>
          {noOptionsMessage || t("autocomplete_no_options")}
        </ComboboxEmpty>
      )}
      <ComboboxList showScrollbar className="flex-1 min-h-0">
        {(option: AutoCompleteOption) => (
          <ComboboxItem
            key={option.value}
            value={option}
            className={cn(isMobile && "min-h-11 py-2.5")}
          >
            {option.label}
          </ComboboxItem>
        )}
      </ComboboxList>
    </>
  );

  return (
    <Combobox<AutoCompleteOption>
      items={isLoading ? [] : options}
      value={selectedOption ?? null}
      inputValue={query}
      open={open}
      inline={isMobile}
      disabled={disabled}
      filter={onSearch ? null : undefined}
      isItemEqualToValue={(option, selected) => option.value === selected.value}
      onInputValueChange={(nextQuery, details) => {
        setQuery(nextQuery);
        if (
          details.reason !== "input-change" &&
          details.reason !== "input-clear"
        )
          return;
        if (freeInput) {
          const match = options.find(
            (option) => option.label.toLowerCase() === nextQuery.toLowerCase(),
          );
          onChange(match?.value ?? nextQuery);
        } else {
          onSearch?.(nextQuery);
        }
      }}
      onValueChange={(option) => {
        if (option) onChange(option.value);
      }}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && details.reason === "item-press" && !closeOnSelect) {
          details.cancel();
          return;
        }
        handleOpenChange(nextOpen);
      }}
    >
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <ButtonGroup className="w-full min-w-0">
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            {clearButton}
          </ButtonGroup>
          <DrawerContent
            aria-describedby={undefined}
            height="fixed"
            className="p-1.5"
          >
            <DrawerHeader className="pl-1 md:pb-2" showCloseButton>
              <DrawerTitle>{placeholder || t("search")}</DrawerTitle>
            </DrawerHeader>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          <ButtonGroup ref={controlRef} className="w-full min-w-0">
            <ComboboxTrigger render={triggerButton} showChevron={false} />
            {clearButton}
          </ButtonGroup>
          {/* Anchored to the whole control (trigger + clear) and start-aligned; narrow
              triggers get the standard popover width so options don't wrap.
              `data-chips={false}`: a custom anchor here is not a chips input. */}
          <ComboboxContent
            anchor={controlRef}
            data-chips={false}
            align={align}
            className={cn(
              "flex w-(--anchor-width) min-w-[max(var(--anchor-width),--spacing(72))] min-h-40 flex-col",
              popoverContentClassName,
            )}
          >
            {content}
          </ComboboxContent>
        </>
      )}
    </Combobox>
  );
}
