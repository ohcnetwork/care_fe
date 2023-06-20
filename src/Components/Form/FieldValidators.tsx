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

export const EmailValidator = (message = "Invalid email address") => {
  return (value: string): FieldError => {
    const pattern =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return pattern.test(value) ? undefined : message;
  };
};
