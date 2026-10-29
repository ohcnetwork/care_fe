import { ChevronDown, X } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

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
  placeholder?: string;
  inputPlaceholder?: string;
  noOptionsMessage?: string;
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
  placeholder,
  inputPlaceholder,
  noOptionsMessage,
  disabled,
  align = "center",
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
  const isMobile = useBreakpoints({ default: true, sm: false });
  const selectedOption = options.find((option) => option.value === value);
  const displayText = selectedOption?.label || (freeInput ? value : "");
  const clearVisible = !!selectedOption && showClearButton && !disabled;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setQuery("");
  };

  const triggerButton = (
    <Button
      {...props}
      ref={ref}
      type="button"
      variant="outline"
      role="combobox"
      aria-expanded={open}
      disabled={disabled}
      title={displayText || undefined}
      data-shortcut-id={shortcutId}
      className={cn(
        "min-w-0 flex-1 justify-between font-normal",
        className,
        popoverClassName,
      )}
    >
      <span className={cn("truncate", !displayText && "text-muted-foreground")}>
        {displayText || placeholder || t("autocomplete_select_placeholder")}
      </span>
      <span className="flex shrink-0 items-center gap-1">
        {shortcutId && <ShortcutBadge actionId={shortcutId} />}
        {!clearVisible && (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </span>
    </Button>
  );

  const clearButton = clearVisible && (
    <Button
      variant="outline"
      size="icon"
      aria-label={t("clear")}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onChange("");
        onSearch?.("");
        handleOpenChange(false);
      }}
    >
      <X />
    </Button>
  );

  const searchInputRef = React.useCallback(
    (input: HTMLInputElement | null) => {
      // Focus synchronously on mount so iOS opens the keyboard, but without
      // scrolling the page while the drawer is still sliding in. The desktop
      // popover focuses its input itself once positioned.
      if (input && isMobile) input.focus({ preventScroll: true });
    },
    [isMobile],
  );

  const content = (
    <>
      <ComboboxInput
        ref={searchInputRef}
        placeholder={inputPlaceholder || t("autocomplete_search_placeholder")}
        aria-label={inputPlaceholder || t("autocomplete_search_placeholder")}
        disabled={disabled}
        showTrigger={false}
      />
      {isLoading ? (
        <CardListSkeleton count={3} />
      ) : (
        <ComboboxEmpty>
          {noOptionsMessage || t("autocomplete_no_options")}
        </ComboboxEmpty>
      )}
      <ComboboxList showScrollbar>
        {(option: AutoCompleteOption) => (
          <ComboboxItem key={option.value} value={option}>
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
          <ButtonGroup className="w-full">
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            {clearButton}
          </ButtonGroup>
          <DrawerContent
            aria-describedby={undefined}
            className="min-h-[50vh] max-h-[85vh]"
          >
            <DrawerTitle className="sr-only">
              {t("autocomplete_options")}
            </DrawerTitle>
            <div className="group/combobox-content flex min-h-0 flex-col overflow-y-auto p-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))]">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          <ButtonGroup className="w-full">
            <ComboboxTrigger render={triggerButton} showChevron={false} />
            {clearButton}
          </ButtonGroup>
          <ComboboxContent
            align={align}
            className={cn("w-(--anchor-width)", popoverContentClassName)}
          >
            {content}
          </ComboboxContent>
        </>
      )}
    </Combobox>
  );
}
