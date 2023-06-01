import { FormFieldBaseProps, useFormFieldPropsResolver } from "./Utils";
import FormField from "./FormField";
import { AsYouType } from "libphonenumber-js";
import { useMemo } from "react";
import { classNames } from "../../../Utils/utils";
import phoneCodesJson from "../../../Common/static/countryPhoneAndFlags.json";

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
}

export default function PhoneNumberFormField(props: Props) {
  const field = useFormFieldPropsResolver(props as any);

  const { asYouType, setValue } = useMemo(() => {
    const asYouType = new AsYouType();

    const setValue = (value: string) => {
      asYouType.reset();
      asYouType.input(value);
      field.handleChange(asYouType.getNumberValue());
    };

    setValue(field.value || "+91");

    return { asYouType, setValue };
  }, []);

  return (
    <FormField field={field}>
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          type="tel"
          name="phone-number"
          autoComplete={props.autoComplete ?? "tel"}
          id={field.id}
          className={classNames(
            "cui-input-base pr-24 md:pr-28 sm:leading-6 tracking-widest",
            field.error && "border-danger-500",
            field.className
          )}
          maxLength={field.value?.startsWith("1800") ? 11 : 15}
          placeholder={props.placeholder}
          value={asYouType.getNumberValue()}
          onChange={(e) => setValue(e.target.value)}
        />
        {!props.disableCountry && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <label htmlFor={field.id + "__country"} className="sr-only">
              Country
            </label>
            <select
              id={field.id + "__country"}
              name="country"
              autoComplete="country"
              className="cui-input-base h-full border-0 bg-transparent pl-2 pr-8 text-gray-700 focus:ring-2 focus:ring-inset text-end tracking-wider font-medium"
              value={
                asYouType.getCountry() ??
                (field.value?.startsWith("1800") ? "1800" : "Other")
              }
              onChange={(e) => {
                if (e.target.value === "Other") return setValue("");
                if (e.target.value === "1800") return setValue("1800");
                setValue(conditionPhoneCode(phoneCodes[e.target.value].code));
              }}
            >
              {Object.entries(phoneCodes).map(([country, { flag, code }]) => (
                <option key={country} value={country}>
                  {flag} {conditionPhoneCode(code)}
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
