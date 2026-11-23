import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxTrigger,
} from "@/components/ui/combobox";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  fieldTriggerLayout,
  fieldTriggerSurface,
  invalidTriggerRing,
  triggerFocus,
} from "@/components/ui/field-trigger-styles";
import { Label } from "@/components/ui/label";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";

type TriggerProps = Omit<
  React.ComponentProps<"button">,
  keyof MultiSelectProps
>;
interface MultiSelectProps {
  options: { label: string; value: string; icon?: IconName }[];
  onValueChange: (value: string[]) => void;
  value: string[];
  placeholder: string;
  className?: string;
  selectionSummary?: string;
  translationBasekey?: string;
}

export function MultiSelect({
  options,
  onValueChange,
  value = [],
  placeholder,
  className,
  ref,
  selectionSummary,
  translationBasekey,
  ...props
}: TriggerProps & MultiSelectProps) {
  const { t } = useTranslation();
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const selectAllId = React.useId();

  // Re-sync the draft only when the contents of `value` change
  const valueKey = JSON.stringify([...value].sort());
  const [syncedValueKey, setSyncedValueKey] = React.useState(valueKey);
  if (syncedValueKey !== valueKey) {
    setSyncedValueKey(valueKey);
    setSelectedValues(value);
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelectedValues(value);
    } else if (open) {
      onValueChange(selectedValues);
    }
    setOpen(nextOpen);
  };

  const optionByValue = new Map(
    options.map((option) => [option.value, option]),
  );
  const committed = new Set(value);
  const draft = new Set(selectedValues);
  const groups = [
    { value: "selected", items: value },
    {
      value: "available",
      items: [...optionByValue.keys()].filter((item) => !committed.has(item)),
    },
  ].filter((group) => group.items.length > 0);
  const allSelected =
    options.length > 0 && options.every((option) => draft.has(option.value));

  const trigger = (
    <button
      type="button"
      ref={ref}
      role="combobox"
      aria-expanded={open}
      className={cn(
        fieldTriggerLayout,
        fieldTriggerSurface,
        triggerFocus,
        invalidTriggerRing,
        "h-auto min-h-12 w-full min-w-0 justify-between py-1 text-start font-normal md:h-auto md:min-h-10",
        className,
      )}
      {...props}
    >
      {value.length === 0 ? (
        <span className="truncate text-muted-foreground">{placeholder}</span>
      ) : selectionSummary ? (
        <Badge
          variant="neutral"
          className="min-w-0 shrink whitespace-normal wrap-anywhere"
        >
          {selectionSummary}
        </Badge>
      ) : (
        <span className="flex min-w-0 flex-wrap gap-1">
          {value.map((item) => (
            <Badge
              key={item}
              variant="neutral"
              className="max-w-full whitespace-normal wrap-anywhere"
            >
              {optionByValue.get(item)?.label ?? item}
            </Badge>
          ))}
        </span>
      )}
      <ChevronDown
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground"
      />
    </button>
  );

  const content = (
    <>
      <ComboboxInput
        showTrigger={false}
        placeholder={
          translationBasekey
            ? t(`search_${translationBasekey}`)
            : t("search_options")
        }
        aria-label={
          translationBasekey
            ? t(`search_${translationBasekey}`)
            : t("search_options")
        }
      />
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border px-3 py-2",
          isMobile && "min-h-11",
        )}
      >
        <Checkbox
          id={selectAllId}
          checked={allSelected}
          onCheckedChange={() =>
            setSelectedValues(
              allSelected
                ? []
                : [...new Set([...draft, ...optionByValue.keys()])],
            )
          }
        />
        <Label htmlFor={selectAllId}>{t("select_all")}</Label>
      </div>
      <ComboboxEmpty>{t("no_results_found")}</ComboboxEmpty>
      <ComboboxList showScrollbar className="min-h-0 flex-1">
        {(group: { value: string; items: string[] }) => (
          <ComboboxGroup key={group.value} items={group.items}>
            {group.value === "selected" && (
              <ComboboxLabel>{t("selected")}</ComboboxLabel>
            )}
            <ComboboxCollection>
              {(optionValue: string) => {
                const option = optionByValue.get(optionValue);
                return (
                  <ComboboxItem
                    key={optionValue}
                    value={optionValue}
                    className={cn(isMobile && "min-h-11 py-2.5")}
                  >
                    {option?.icon && (
                      <CareIcon icon={option.icon} className="size-4" />
                    )}
                    {option?.label ?? optionValue}
                  </ComboboxItem>
                );
              }}
            </ComboboxCollection>
          </ComboboxGroup>
        )}
      </ComboboxList>
      <div className="flex shrink-0 justify-end gap-2 border-t border-border p-2">
        <Button onClick={() => handleOpenChange(false)}>{t("done")}</Button>
      </div>
    </>
  );

  return (
    <Combobox<string, true>
      multiple
      items={groups}
      value={selectedValues}
      onValueChange={setSelectedValues}
      itemToStringLabel={(optionValue) =>
        optionByValue.get(optionValue)?.label ?? optionValue
      }
      open={open}
      inline={isMobile}
      disabled={props.disabled}
      onOpenChange={(nextOpen, details) => {
        if (!nextOpen && details.reason === "item-press") {
          details.cancel();
          return;
        }
        handleOpenChange(nextOpen);
      }}
    >
      {isMobile ? (
        <Drawer open={open} onOpenChange={handleOpenChange}>
          <DrawerTrigger asChild>{trigger}</DrawerTrigger>
          <DrawerContent height="fixed">
            <DrawerTitle className="sr-only">{placeholder}</DrawerTitle>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pb-0">
              {content}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <>
          <ComboboxTrigger render={trigger} showChevron={false} />
          <ComboboxContent className="flex w-(--anchor-width) flex-col">
            {content}
          </ComboboxContent>
        </>
      )}
    </Combobox>
  );
}
