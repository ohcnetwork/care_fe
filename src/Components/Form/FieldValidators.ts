export type FieldError = string | false | null | undefined;
export type FieldValidator<T> = (value: T) => FieldError;

/**
 * Example usage:
 * ```tsx
 * <EmailField
 *   ...
 *   validate={MultiValidator([
 *     RequiredFieldValidator,
 *     EmailValidator,
 *   ])}
 *   ...
 * />
 * ```
 *
 * @param validators List of `FieldValidator`s.
 * @returns `FieldError`
 */
export const MultiValidator = <T>(
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

export const RequiredFieldValidator = <T>(value: T): FieldError => {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value === "")
  )
    return "Field is required";
};
