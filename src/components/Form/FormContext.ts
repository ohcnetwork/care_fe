import { createContext } from "react";
import { FieldError, FieldValidator } from "./FieldValidators";
import { FormDetails } from "./Utils";

export type FormContextValue<T extends FormDetails> = (
  name: keyof T,
  validate?: FieldValidator<T[keyof T]>,
  excludeFromDraft?: boolean,
) => {
  id: keyof T;
  name: keyof T;
  onChange: any;
  value: any;
  error: FieldError | undefined;
};

export const createFormContext = <T extends FormDetails>() =>
  createContext<FormContextValue<T>>(undefined as any);
