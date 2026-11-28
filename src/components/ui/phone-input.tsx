// CareUI phone-input composition with CARE country defaults and digit constraints.
import careConfig from "@careConfig";
import {
  CountryCode,
  getCountryCallingCode,
  getExampleNumber,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { useTranslation } from "react-i18next";
import * as RPNInput from "react-phone-number-input";
import flags from "react-phone-number-input/flags";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { useIsMobile } from "@/hooks/use-mobile";

function getMaxDigits(countryCode: CountryCode): number {
  const example = getExampleNumber(countryCode, examples);
  return example?.nationalNumber?.length ?? 15;
}

function extractDigits(str: string): string {
  return str.replace(/\D/g, "");
}

function getMaxTotalDigits(countryCode: CountryCode): number {
  const countryCallingCode = getCountryCallingCode(countryCode);
  const maxNationalDigits = getMaxDigits(countryCode);
  return countryCallingCode.length + maxNationalDigits;
}

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInputContext = React.createContext<{
  country: CountryCode;
  setCountry: (country: CountryCode) => void;
}>({
  country: careConfig.defaultCountry.code,
  setCountry: () => {},
});

function PhoneInput({
  className,
  onChange,
  value,
  ...props
}: React.ComponentProps<typeof RPNInput.default> & PhoneInputProps) {
  const [country, setCountry] = React.useState<CountryCode>(
    careConfig.defaultCountry.code,
  );

  return (
    <PhoneInputContext.Provider value={{ country, setCountry }}>
      <RPNInput.default
        className={cn(
          "PhoneInput",
          "overflow-clip",
          // A focused country selector rings the whole field, like the number input.
          "has-[[data-slot=popover-trigger]:focus-visible]:border-ring has-[[data-slot=popover-trigger]:focus-visible]:ring-3 has-[[data-slot=popover-trigger]:focus-visible]:ring-ring/50",
          className,
          value && !RPNInput.isValidPhoneNumber(value)
            ? "ring-destructive"
            : "ring-ring",
        )}
        containerComponent={InputGroup}
        flagComponent={FlagComponent}
        countrySelectComponent={CountrySelect}
        inputComponent={InputComponent}
        defaultCountry={careConfig.defaultCountry.code}
        value={value || undefined}
        smartCaret={true}
        onCountryChange={(newCountry) => {
          if (newCountry) {
            setCountry(newCountry as CountryCode);
          }
        }}
        /**
         * Handles the onChange event.
         *
         * react-phone-number-input might trigger the onChange event as undefined
         * when a valid phone number is not entered. To prevent this,
         * the value is coerced to an empty string.
         *
         * @param {E164Number | undefined} value - The entered value
         */
        onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
        {...props}
      />
    </PhoneInputContext.Provider>
  );
}
PhoneInput.displayName = "PhoneInput";

function InputComponent({
  className,
  ...props
}: React.ComponentProps<"input">) {
  const { t } = useTranslation();
  const { country } = React.useContext(PhoneInputContext);
  const maxNationalDigits = getMaxDigits(country);
  const maxTotalDigits = getMaxTotalDigits(country);
  const [announcement, setAnnouncement] = React.useState("");

  const handleBeforeInput = React.useCallback(
    (e: React.InputEvent<HTMLInputElement>) => {
      const inputEvent = e.nativeEvent as InputEvent;
      const newData = inputEvent.data || "";

      if (newData.includes("+")) {
        return;
      }

      const input = e.currentTarget;
      const currentValue = input.value || "";
      const currentDigits = extractDigits(currentValue);
      const newDigits = extractDigits(newData);

      // Calculate digits in the current selection that will be replaced
      const selectionStart = input.selectionStart ?? currentValue.length;
      const selectionEnd = input.selectionEnd ?? currentValue.length;
      const selectedText = currentValue.slice(selectionStart, selectionEnd);
      const selectedDigits = extractDigits(selectedText);

      // Calculate post-replacement digit count:
      // current digits - digits being replaced + new digits being added
      const postReplacementDigits =
        currentDigits.length - selectedDigits.length + newDigits.length;

      // Determine max based on whether international format is being used
      const isInternationalFormat = currentValue.includes("+");
      const maxAllowed = isInternationalFormat
        ? maxTotalDigits
        : maxNationalDigits;

      if (newDigits.length > 0 && postReplacementDigits > maxAllowed) {
        e.preventDefault();
        setAnnouncement(
          t("phone_number_max_digits_reached", { max: maxAllowed }),
        );
        setTimeout(() => setAnnouncement(""), 1000);
      }
    },
    [maxNationalDigits, maxTotalDigits, t],
  );

  return (
    <>
      <Input
        className={cn(
          "PhoneInputInput h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2 shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
          className,
        )}
        onBeforeInput={handleBeforeInput}
        aria-describedby="phone-input-constraint"
        {...props}
        // FormControl's data-slot must not replace the one InputGroup's focus ring reads.
        data-slot="input-group-control"
      />
      <span id="phone-input-constraint" className="sr-only">
        {t("phone_number_max_digits_constraint", { max: maxNationalDigits })}
      </span>
      <span aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
InputComponent.displayName = "InputComponent";

type CountryEntry = { label: string; value: RPNInput.Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: RPNInput.Country;
  options: CountryEntry[];
  onChange: (country: RPNInput.Country) => void;
  "aria-label"?: string;
  /** Where focus goes after a pick, when used outside PhoneInput. */
  pickedFocus?: React.RefObject<HTMLElement | null>;
  /** Classes for the trigger, when used outside PhoneInput. */
  className?: string;
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
  "aria-label": ariaLabel,
  pickedFocus,
  className,
}: CountrySelectProps) => {
  const { t } = useTranslation();
  // On mobile the list opens as a drawer, as the other pickers do there.
  const asDrawer = useIsMobile();
  const listRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [picked, setPicked] = React.useState(false);
  const handleCountrySelect = (country: RPNInput.Country) => {
    onChange(country);
    setPicked(true);
    setOpen(false);
  };
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setSearchValue("");
      setPicked(false);
    }
  };
  const finalFocus = () => (picked && pickedFocus?.current) || true;
  const selectedLabel = countryList.find(
    (entry) => entry.value === selectedCountry,
  )?.label;
  const selectedValue = selectedLabel
    ? `${selectedLabel} +${RPNInput.getCountryCallingCode(selectedCountry)}`
    : undefined;

  const trigger = (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        "border-input flex shrink-0 gap-1.5 rounded-none! border-0 border-r px-2 text-sm no-underline shadow-none not-in-data-[slot=button-group]:rounded-none! focus-visible:outline-0 focus-visible:bg-muted h-full",
        className,
      )}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      <FlagComponent country={selectedCountry} countryName={selectedCountry} />
      {!disabled && (
        <ChevronDown
          aria-hidden="true"
          data-icon="inline-end"
          className="size-3.5 text-muted-foreground"
        />
      )}
    </Button>
  );

  // The standard searchable list: the search takes focus as it opens, and a
  // country is found by its name or calling code.
  const list = (
    <Command
      className={cn(asDrawer && "min-h-0 flex-1")}
      // Opens on the current country, which leads the list.
      defaultValue={selectedValue}
      // Plain substring matching: fuzzy matching would list +244 and +54 for
      // "+44".
      filter={(value, search) =>
        value.toLowerCase().includes(search.trim().toLowerCase()) ? 1 : 0
      }
    >
      <CommandInput
        autoFocus
        aria-label={t("search_countries")}
        placeholder={t("search_country")}
        value={searchValue}
        onValueChange={(value) => {
          setSearchValue(value);
          listRef.current?.scrollTo({ top: 0 });
        }}
      />
      <CommandList
        ref={listRef}
        className={cn(
          "overflow-y-auto",
          asDrawer ? "max-h-none min-h-0 flex-1" : "max-h-80",
        )}
      >
        <CommandEmpty>{t("no_country_found")}</CommandEmpty>
        {/* The selected country leads, apart from the rest; while searching
            it stays first when it matches, and the divider hides. */}
        {selectedLabel && (
          <>
            <CommandGroup>
              <CountrySelectOption
                country={selectedCountry}
                countryName={selectedLabel}
                selectedCountry={selectedCountry}
                onChange={handleCountrySelect}
              />
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup>
          {countryList.map(({ value, label }) =>
            value && value !== selectedCountry ? (
              <CountrySelectOption
                key={value}
                country={value}
                countryName={label}
                selectedCountry={selectedCountry}
                onChange={handleCountrySelect}
              />
            ) : null,
          )}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (asDrawer) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>{trigger}</DrawerTrigger>
        <DrawerContent
          height="fixed"
          aria-label={ariaLabel}
          finalFocus={finalFocus}
        >
          <DrawerTitle className="sr-only">{ariaLabel}</DrawerTitle>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-2 pb-0">
            {list}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} modal onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-72 max-w-(--available-width) gap-0 overflow-hidden p-0"
        align="start"
        sideOffset={5}
        finalFocus={finalFocus}
      >
        {list}
      </PopoverContent>
    </Popover>
  );
};

interface CountrySelectOptionProps extends RPNInput.FlagProps {
  selectedCountry: RPNInput.Country;
  onChange: (country: RPNInput.Country) => void;
}

const CountrySelectOption = ({
  country,
  countryName,
  selectedCountry,
  onChange,
}: CountrySelectOptionProps) => {
  return (
    <CommandItem
      className="gap-2"
      // Found by name or calling code ("India", "+91", "91").
      value={`${countryName} +${RPNInput.getCountryCallingCode(country)}`}
      data-checked={country === selectedCountry}
      onSelect={() => onChange(country)}
    >
      <FlagComponent country={country} countryName={countryName} />
      <span className="min-w-0 flex-1 truncate">{countryName}</span>
      <span className="text-muted-foreground tabular-nums">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];
  const flagProps = { title: countryName, className: "size-full" };

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded bg-foreground/20 [&_svg]:size-full">
      {Flag && <Flag {...flagProps} />}
    </span>
  );
};

export { CountrySelect, PhoneInput };
