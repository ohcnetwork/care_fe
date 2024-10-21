import { t } from "i18next";

export type FieldError = string | undefined;
export type FieldValidator<T> = (value: T, ...args: any) => FieldError;

/**
 * Example usage:
 * ```tsx
 * <EmailField
 *   ...
 *   validate={MultiValidator([
 *     RequiredFieldValidator(),
 *     EmailValidator(),
 *   ])}
 *   ...
 * />
 * ```
 *
 * @param validators List of `FieldValidator`s.
 * @returns `FieldError`
 */
export const MultiValidator = <T,>(
  validators: FieldValidator<T>[],
): FieldValidator<T> => {
  const validator = (value: T) => {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error;
    }
  };
  return validator;
};

export const AnyValidator = <T,>(
  validators: FieldValidator<T>[],
): FieldValidator<T> => {
  const validator = (value: T) => {
    for (const validate of validators) {
      const error = validate(value);
      if (!error) return;
    }
    return validators[0](value);
  };
  return validator;
};

export const RequiredFieldValidator = (message = t("field_required")) => {
  return <T,>(value: T): FieldError => {
    if (!value) return message;
    if (Array.isArray(value) && value.length === 0) return message;
  };
};

export const RegexValidator = (regex: RegExp, message = "Invalid input") => {
  return (value: string): FieldError => {
    return regex.test(value) ? undefined : message;
  };
};

const EMAIL_REGEX =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export const EmailValidator = (message = "Invalid email address") => {
  return RegexValidator(EMAIL_REGEX, message);
};

// const PHONE_NUMBER_REGEX =
//   /^(?:(?:(?:\+|0{0,2})91|0{0,2})(?:\()?\d{3}(?:\))?[-]?\d{3}[-]?\d{4})$/;

// export const PhoneNumberValidator = (message = "Invalid phone number") => {
//   return RegexValidator(PHONE_NUMBER_REGEX, message);
// };

// const SUPPORT_PHONE_NUMBER_REGEX = /^1800[-]?\d{3}[-]?\d{3,4}$/;

// export const SupportPhoneNumberValidator = (
//   message = "Invalid support phone number"
// ) => {
//   return RegexValidator(SUPPORT_PHONE_NUMBER_REGEX, message);
// };

// References: https://trai.gov.in/sites/default/files/Recommendations_29052020.pdf
const INDIAN_MOBILE_NUMBER_REGEX = /^(?=^\+91)(^\+91[6-9]\d{9}$)/;
const INTERNATIONAL_MOBILE_NUMBER_REGEX = /^(?!^\+91)(^\+\d{1,3}\d{8,14}$)/;
const MOBILE_NUMBER_REGEX = new RegExp(
  `(${INDIAN_MOBILE_NUMBER_REGEX.source})|(${INTERNATIONAL_MOBILE_NUMBER_REGEX.source})`,
);
const INDIAN_LANDLINE_NUMBER_REGEX = /^\+91[2-9]\d{9}$/;
const INDIAN_SUPPORT_NUMBER_REGEX = /^(1800|1860)\d{6,7}$/;

const PHONE_NUMBER_REGEX_MAP = {
  indian_mobile: INDIAN_MOBILE_NUMBER_REGEX,
  international_mobile: INTERNATIONAL_MOBILE_NUMBER_REGEX,
  mobile: MOBILE_NUMBER_REGEX,
  landline: INDIAN_LANDLINE_NUMBER_REGEX,
  support: INDIAN_SUPPORT_NUMBER_REGEX,
};

export type PhoneNumberType = keyof typeof PHONE_NUMBER_REGEX_MAP;

export const PhoneNumberValidator = (
  type: PhoneNumberType[] = ["mobile", "landline"],
  message = "Invalid phone number",
) => {
  const regexes = type.map((t) => PHONE_NUMBER_REGEX_MAP[t]);
  return RegexValidator(
    new RegExp(regexes.map((r) => r.source).join("|")),
    message,
  );
};
