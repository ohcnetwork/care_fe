export type FormDetails = { [key: string]: any };
export type FormErrors<T = FormDetails> = Partial<
  Record<keyof T | "$all", string | undefined>
>;
export type FormState<T = FormDetails> = { form: T; errors: FormErrors<T> };
export type FormAction<T = FormDetails> =
  | { type: "set_form"; form: T }
  | { type: "set_errors"; errors: FormErrors<T> }
  | { type: "set_field"; name: keyof T; value: any; error: string | undefined }
  | { type: "set_state"; state: FormState<T> };
export type FormReducer<T = FormDetails> = (
  prevState: FormState<T>,
  action: FormAction<T>,
) => FormState<T>;
