import careConfig from "@careConfig";
import {
  CountryCode,
  getCountryCallingCode,
  getExampleNumber,
} from "libphonenumber-js";
import examples from "libphonenumber-js/mobile/examples";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
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
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

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
          "flex rounded-md focus-within:ring-1",
          className,
          props.value &&
            !RPNInput.isValidPhoneNumber((props.value ?? "") as string)
            ? "ring-red-500"
            : "ring-primary-700",
        )}
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
    (e: React.FormEvent<HTMLInputElement>) => {
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
          "rounded-e-md rounded-s-none focus-visible:ring-0 focus-visible:outline-hidden focus-visible:border-gray-200",
          className,
        )}
        onBeforeInput={handleBeforeInput}
        aria-describedby="phone-input-constraint"
        {...props}
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
};

const CountrySelect = ({
  disabled,
  value: selectedCountry,
  options: countryList,
  onChange,
}: CountrySelectProps) => {
  const { t } = useTranslation();
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const [searchValue, setSearchValue] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const handleCountrySelect = (country: RPNInput.Country) => {
    onChange(country);
    setOpen(false);
  };
  return (
    <Popover
      open={open}
      modal
      onOpenChange={(open) => {
        setOpen(open);
        open && setSearchValue("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-md border-r-0 border-gray-200 shadow-xs px-3 focus:z-10 h-auto"
          disabled={disabled}
        >
          <FlagComponent
            country={selectedCountry}
            countryName={selectedCountry}
          />
          <ChevronsUpDown
            className={cn(
              "-mr-2 size-4 opacity-50",
              disabled ? "hidden" : "opacity-100",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 sm:p-0 w-[var(--radix-popover-trigger-width)] min-w-64"
        align="start"
        sideOffset={5}
      >
        <Command>
          <CommandInput
            value={searchValue}
            onValueChange={(value) => {
              setSearchValue(value);
              setTimeout(() => {
                if (scrollAreaRef.current) {
                  const viewportElement = scrollAreaRef.current.querySelector(
                    "[data-radix-scroll-area-viewport]",
                  );
                  if (viewportElement) {
                    viewportElement.scrollTop = 0;
                  }
                }
              }, 0);
            }}
            placeholder={t("search_country")}
            className="outline-hidden border-none ring-0 shadow-none"
          />
          <CommandList>
            <ScrollArea ref={scrollAreaRef} className="h-72">
              <CommandEmpty>{t("no_country_found")}</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
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
            </ScrollArea>
          </CommandList>
        </Command>
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
    <CommandItem className="gap-2" onSelect={() => onChange(country)}>
      <FlagComponent country={country} countryName={countryName} />
      <span className="flex-1 text-sm">{countryName}</span>
      <span className="text-sm text-foreground/50">{`+${RPNInput.getCountryCallingCode(country)}`}</span>
      <CheckIcon
        className={`ml-auto size-4 ${country === selectedCountry ? "opacity-100" : "opacity-0"}`}
      />
    </CommandItem>
  );
};

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
