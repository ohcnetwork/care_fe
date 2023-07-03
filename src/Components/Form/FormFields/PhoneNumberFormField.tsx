import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import {
  AsYouType,
  isValidPhoneNumber,
  parsePhoneNumber,
} from "libphonenumber-js";
import { useMemo, useState } from "react";
import { classNames } from "../../../Utils/utils";
import phoneCodesJson from "../../../Common/static/countryPhoneAndFlags.json";
import {
  AnyValidator,
  FieldError,
  PhoneNumberValidator,
  SupportPhoneNumberValidator,
} from "../FieldValidators";

interface CountryData {
  flag: string;
  name: string;
  code: string;
}

const phoneCodes: Record<string, CountryData> = phoneCodesJson;

interface Props extends FormFieldBaseProps<string> {
  placeholder?: string;
  autoComplete?: string;
  disableCountry?: boolean;
  disableValidation?: boolean;
}

export default function PhoneNumberFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const [error, setError] = useState<FieldError>();

  const asYouType = useMemo(() => {
    const asYouType = new AsYouType();

    asYouType.reset();

    if (field.value) {
      asYouType.input(field.value);
    } else {
      asYouType.input("+91");
      field.handleChange(asYouType.getNumberValue());
    }

    return asYouType;
  }, []);

  const validate = useMemo(
    () => (value: string, event: "blur" | "change") => {
      if (value === "" || props.disableValidation) {
        return;
      }

      const newError = AnyValidator([
        PhoneNumberValidator(),
        SupportPhoneNumberValidator(),
      ])(value);

      if (!newError) {
        return;
      } else if (event === "blur") {
        return newError;
      }
    },
    [props.disableValidation]
  );

  const setValue = (value: string) => {
    value = value.replaceAll(" ", "");

    asYouType.reset();
    asYouType.input(value);

    const error = validate(value, "change");
    field.handleChange(value);

    setError(error);
  };

  return (
    <FormField field={{ ...field, error: field.error || error }}>
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          type="tel"
          id={field.id}
          name={field.name}
          autoComplete={props.autoComplete ?? "tel"}
          className={classNames(
            "cui-input-base pr-24 md:pr-28 sm:leading-6 tracking-widest",
            field.error && "border-danger-500",
            field.className
          )}
          maxLength={field.value?.startsWith("1800") ? 11 : 15}
          placeholder={props.placeholder}
          value={formatPhoneNumber(field.value, props.disableCountry)}
          onChange={(e) => setValue(e.target.value)}
          disabled={field.disabled}
          onBlur={() => setError(validate(field.value, "blur"))}
        />
        {!props.disableCountry && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <label htmlFor={field.id + "__country"} className="sr-only">
              Country
            </label>
            <select
              disabled={field.disabled}
              id={field.id + "__country"}
              name="country"
              autoComplete="country"
              className="cui-input-base h-full border-0 bg-transparent pl-2 pr-8 text-gray-700 focus:ring-2 focus:ring-inset text-end tracking-wider font-medium"
              value={
                asYouType.getCountry() ??
                (field.value?.startsWith("1800") ? "1800" : "Other")
              }
              onChange={(e) => {
                if (e.target.value === "1800") return setValue("1800");
                if (e.target.value === "Other") return setValue("");
                setValue(conditionPhoneCode(phoneCodes[e.target.value].code));
              }}
            >
              {Object.entries(phoneCodes).map(([country, { flag }]) => (
                <option key={country} value={country}>
                  {flag} {country}
                </option>
              ))}
              <option value="Other">Other</option>
              <option value="1800">Support</option>
            </select>
          </div>
        )}
      </div>
    </FormField>
  );
}

const conditionPhoneCode = (code: string) => {
  code = code.split(" ")[0];
  return code.startsWith("+") ? code : "+" + code;
};

const formatPhoneNumber = (value: string, disableCountry?: boolean) => {
  if (!isValidPhoneNumber(value)) {
    return value;
  }

  const phoneNumber = parsePhoneNumber(value);

  if (disableCountry) {
    return phoneNumber.formatNational();
  }

  return phoneNumber.formatInternational();
};
