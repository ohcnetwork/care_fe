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
import { Label } from "@/components/ui/label";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { isIOSDevice } from "@/Utils/utils";

type ButtonProps = Omit<
  React.ComponentProps<typeof Button>,
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
}: ButtonProps & MultiSelectProps) {
  const { t } = useTranslation();
  const [selectedValues, setSelectedValues] = React.useState<string[]>(value);
  const [open, setOpen] = React.useState(false);
  const isMobile = useBreakpoints({ default: true, sm: false });
  const selectAllId = React.useId();

  const handleOpenChange = (nextOpen: boolean) => {
    setSelectedValues(value);
    setOpen(nextOpen);
  };

  const handleDone = () => {
    onValueChange(selectedValues);
    setOpen(false);
  };

  const groups = [
    {
      value: "selected",
      items: options
        .filter((option) => value.includes(option.value))
        .map((option) => option.value),
    },
    {
      value: "available",
      items: options
        .filter((option) => !value.includes(option.value))
        .map((option) => option.value),
    },
  ].filter((group) => group.items.length > 0);
  const allSelected =
    options.length > 0 &&
    options.every((option) => selectedValues.includes(option.value));

  const trigger = (
    <Button
      variant="outline"
      ref={ref}
      role="combobox"
      aria-expanded={open}
      className={cn(
        "h-auto min-h-9 w-full min-w-0 justify-between py-1 font-normal",
        className,
      )}
      {...props}
    >
      {value.length === 0 ? (
        <span className="truncate text-muted-foreground">{placeholder}</span>
      ) : selectionSummary ? (
        <Badge
          variant="neutral"
          className="max-w-full whitespace-normal wrap-break-word"
        >
          {selectionSummary}
        </Badge>
      ) : (
        <div className="flex min-w-0 flex-wrap gap-1">
          {options
            .filter((option) => value.includes(option.value))
            .map((option) => (
              <Badge
                key={option.value}
                variant="neutral"
                className="max-w-full whitespace-normal wrap-break-word"
              >
                {option.label}
              </Badge>
            ))}
        </div>
      )}
      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
    </Button>
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
        autoFocus={!isIOSDevice}
      />
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Checkbox
          id={selectAllId}
          checked={allSelected}
          onCheckedChange={() =>
            setSelectedValues(
              allSelected ? [] : options.map((option) => option.value),
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
                const option = options.find(
                  (option) => option.value === optionValue,
                );
                return (
                  <ComboboxItem key={optionValue} value={optionValue}>
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
      <div className="flex shrink-0 justify-end gap-2 border-t border-border p-3">
        <Button variant="ghost" onClick={() => handleOpenChange(false)}>
          {t("cancel")}
        </Button>
        <Button onClick={handleDone}>{t("done")}</Button>
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
        options.find((option) => option.value === optionValue)?.label ??
        optionValue
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
          <DrawerContent className="min-h-[50vh] max-h-[85vh]">
            <DrawerTitle className="sr-only">{placeholder}</DrawerTitle>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-3 pb-[max(--spacing(3),env(safe-area-inset-bottom))]">
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
