import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import { useEffect, useMemo, useState } from "react";
import {
  classNames,
  parsePhoneNumber,
  formatPhoneNumber as formatPhoneNumberUtil,
  getCountryCode,
  CountryData,
} from "../../../Utils/utils";
import phoneCodesJson from "../../../Common/static/countryPhoneAndFlags.json";
import {
  FieldError,
  PhoneNumberValidator,
  PhoneNumberType,
} from "../FieldValidators";
import CareIcon from "../../../CAREUI/icons/CareIcon";

const phoneCodes: Record<string, CountryData> = phoneCodesJson;

interface Props extends FormFieldBaseProps<string> {
  types: PhoneNumberType[];
  placeholder?: string;
  autoComplete?: string;
  disableValidation?: boolean;
}

export default function PhoneNumberFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);
  const [error, setError] = useState<FieldError>();

  const validator = useMemo(
    () => PhoneNumberValidator(props.types),
    [props.types]
  );

  const validate = useMemo(
    () => (value: string | undefined, event: "blur" | "change") => {
      if (!value || props.disableValidation) {
        return;
      }

      const newError = validator(value);

      if (!newError) {
        return;
      } else if (event === "blur") {
        return newError;
      }
    },
    [props.disableValidation]
  );

  const setValue = (value: string) => {
    value = value.replaceAll(/[^0-9+]/g, "");
    if (value.length > 12 && value.startsWith("+910")) {
      value = "+91" + value.slice(4);
    }

    const error = validate(value, "change");
    field.handleChange(value);

    setError(error);
  };

  useEffect(() => setValue(field.value || "+91"), []);

  return (
    <FormField
      field={{
        ...field,
        error: field.error || error,
        labelSuffix: field.labelSuffix || (
          <PhoneNumberTypesHelp types={props.types} />
        ),
      }}
    >
      <div className="relative rounded-md shadow-sm">
        <input
          type="tel"
          id={field.id}
          name={field.name}
          autoComplete={props.autoComplete ?? "tel"}
          className={classNames(
            "cui-input-base pr-24 tracking-widest sm:leading-6 md:pr-28",
            field.error && "border-danger-500",
            field.className
          )}
          maxLength={field.value?.startsWith("1800") ? 11 : 15}
          placeholder={props.placeholder}
          value={formatPhoneNumber(field.value, props.types)}
          onChange={(e) => setValue(e.target.value)}
          disabled={field.disabled}
          onBlur={() => setError(validate(field.value, "blur"))}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          <label htmlFor={field.id + "__country"} className="sr-only">
            Country
          </label>
          <select
            disabled={field.disabled}
            id={field.id + "__country"}
            name="country"
            autoComplete="country"
            className="cui-input-base h-full border-0 bg-transparent pl-2 pr-8 text-end font-medium tracking-wider text-gray-700 focus:ring-2 focus:ring-inset"
            value={
              getCountryCode(field.value) ??
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
      </div>
    </FormField>
  );
}

const phoneNumberTypeIcons: Record<PhoneNumberType, string> = {
  international_mobile: "globe",
  indian_mobile: "mobile-android",
  mobile: "mobile-android",
  landline: "phone",
  support: "headset",
};

const PhoneNumberTypesHelp = ({ types }: { types: PhoneNumberType[] }) => (
  <div className="flex gap-1">
    {types.map((type) => (
      <span className="tooltip mt-1">
        <CareIcon
          className={classNames(
            `care-l-${phoneNumberTypeIcons[type]}`,
            "text-lg text-gray-500"
          )}
        />
        <span className="tooltip-text tooltip-bottom -translate-x-1/2 translate-y-1 text-xs capitalize">
          {type.replace("_", " ")}
        </span>
      </span>
    ))}
  </div>
);

const conditionPhoneCode = (code: string) => {
  code = code.split(" ")[0];
  return code.startsWith("+") ? code : "+" + code;
};

const formatPhoneNumber = (value: string, types: PhoneNumberType[]) => {
  if (value === undefined || value === null) {
    return "+91 ";
  }

  if (PhoneNumberValidator(types)(value) !== undefined || value.length < 13) {
    return value;
  }

  const phoneNumber = parsePhoneNumber(value);
  return phoneNumber ? formatPhoneNumberUtil(phoneNumber) : value;
};
