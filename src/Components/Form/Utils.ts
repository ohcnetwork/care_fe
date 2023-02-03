import { FieldError } from "./FieldValidators";

export type FormDetails = Record<string, unknown>;
export type FormErrors<T = FormDetails> = Partial<Record<keyof T, FieldError>>;
export type FormState<T = FormDetails> = { form: T; errors: FormErrors<T> };
export type FormAction<T = FormDetails> =
  | { type: "set_form"; form: T }
  | { type: "set_errors"; errors: FormErrors<T> }
  | { type: "set_field"; name: keyof T; value: any; error: FieldError };
export type FormReducer<T = FormDetails> = (
  prevState: FormState<T>,
  action: FormAction<T>
) => FormState<T>;

export const formReducer = <T = FormDetails>(
  state: FormState<T>,
  action: FormAction<T>
): FormState<T> => {
  switch (action.type) {
    case "set_form":
      return { ...state, form: action.form };
    case "set_errors":
      return { ...state, errors: action.errors };
    case "set_field":
      return {
        form: { ...state.form, [action.name]: action.value },
        errors: { ...state.errors, [action.name]: action.error },
      };
  }
};
