import careConfig from "@careConfig";
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

type PhoneInputProps = Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "ref"
> &
  Omit<RPNInput.Props<typeof RPNInput.default>, "onChange"> & {
    onChange?: (value: RPNInput.Value) => void;
  };

const PhoneInput: React.ForwardRefExoticComponent<PhoneInputProps> =
  React.forwardRef<React.ElementRef<typeof RPNInput.default>, PhoneInputProps>(
    ({ className, onChange, ...props }, ref) => {
      const getCountryFromNumber = (phoneNumber: string) => {
        const parsedNumber = RPNInput.parsePhoneNumber(phoneNumber);
        return parsedNumber?.country || careConfig.defaultCountry;
      };

      const [selectedCountry, setSelectedCountry] =
        React.useState<RPNInput.Country>(
          props.value
            ? (getCountryFromNumber(props.value as string) as RPNInput.Country)
            : (careConfig.defaultCountry as RPNInput.Country),
        );
      React.useEffect(() => {
        if (props.value) {
          const detectedCountry = getCountryFromNumber(props.value as string);
          if (detectedCountry && detectedCountry !== selectedCountry) {
            setSelectedCountry(detectedCountry as RPNInput.Country);
          }
        }
      }, [props.value]);

      const handleCountryChange = (country: RPNInput.Country) => {
        setSelectedCountry(country);
        onChange?.("" as RPNInput.Value);
      };

      return (
        <RPNInput.default
          ref={ref}
          className={cn(
            "flex rounded-md focus-within:ring-1",
            className,
            props.value &&
              !RPNInput.isValidPhoneNumber((props.value ?? "") as string)
              ? "ring-red-500"
              : "ring-primary-700",
          )}
          flagComponent={FlagComponent}
          countrySelectComponent={(countrySelectProps) => (
            <CountrySelect
              {...countrySelectProps}
              onChange={handleCountryChange}
              value={selectedCountry}
            />
          )}
          inputComponent={InputComponent}
          defaultCountry={careConfig.defaultCountry}
          smartCaret={true}
          country={selectedCountry}
          onChange={(value) => onChange?.(value || ("" as RPNInput.Value))}
          {...props}
        />
      );
    },
  );
PhoneInput.displayName = "PhoneInput";

const InputComponent = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    className={cn(
      "rounded-e-md rounded-s-none focus-visible:ring-0 focus-visible:outline-none focus-visible:border-gray-200",
      className,
    )}
    {...props}
    ref={ref}
  />
));
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
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="flex gap-1 rounded-e-none rounded-s-md border-r-0 px-3 focus:z-10 h-[42px] md:h-[38px]"
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
            placeholder={t("search_country")}
            className="outline-none border-none ring-0 shadow-none"
          />
          <CommandList>
            <ScrollArea className="h-72">
              <CommandEmpty>{t("no_country_found")}</CommandEmpty>
              <CommandGroup>
                {countryList.map(({ value, label }) =>
                  value ? (
                    <CommandItem
                      key={value}
                      onSelect={() => onChange(value)}
                      className="gap-2"
                    >
                      <FlagComponent country={value} countryName={label} />
                      <span className="flex-1 text-sm">{label}</span>
                      <span className="text-sm text-foreground/50">
                        {`+${RPNInput.getCountryCallingCode(value)}`}
                      </span>
                      <CheckIcon
                        className={cn(
                          "ml-auto size-4",
                          value === selectedCountry
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                    </CommandItem>
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

const FlagComponent = ({ country, countryName }: RPNInput.FlagProps) => {
  const Flag = flags[country];

  return (
    <span className="flex h-4 w-6 overflow-hidden rounded-sm bg-foreground/20 [&_svg]:size-full">
      {Flag && <Flag title={countryName} />}
    </span>
  );
};

export { PhoneInput };
