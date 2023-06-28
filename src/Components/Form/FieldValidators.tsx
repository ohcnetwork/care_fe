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
  validators: FieldValidator<T>[]
): FieldValidator<T> => {
  const validator = (value: T) => {
    for (const validate of validators) {
      const error = validate(value);
      if (error) return error;
    }
  };
  return validator;
};

export const RequiredFieldValidator = (message = "Field is required") => {
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

const PHONE_NUMBER_REGEX =
  /^(?:(?:(?:\+|0{0,2})91|0{0,2})(?:\()?\d{3}(?:\))?[-]?\d{3}[-]?\d{4})$/;

export const PhoneNumberValidator = (message = "Invalid phone number") => {
  return RegexValidator(PHONE_NUMBER_REGEX, message);
};
