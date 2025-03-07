import { t } from "i18next";

import { QuestionValidationError } from "@/types/questionnaire/batch";

export interface FieldMetadata<T = any> {
  key: string;
  required: boolean;
  validate?: (value: T) => boolean;
}

export type FieldDefinitions = {
  [key: string]: FieldMetadata;
};

export interface FieldErrorProps<T extends string> {
  fieldKey: T;
  questionId: string;
  errors?: QuestionValidationError[];
}

export function createFieldKeys<T extends { [K: string]: string }>(keys: T) {
  return keys as { readonly [P in keyof T]: T[P] };
}

export function useFieldError<T extends string>(
  questionId: string,
  errors?: QuestionValidationError[],
) {
  return {
    getError: (fieldKey: T) =>
      errors?.find(
        (error) =>
          error.question_id === questionId && error.field_key === fieldKey,
      )?.error,
    hasError: (fieldKey: T) =>
      errors?.some(
        (error) =>
          error.question_id === questionId && error.field_key === fieldKey,
      ),
  };
}

export function createValidationError(
  questionId: string,
  fieldKey: string,
  error: string,
): QuestionValidationError {
  return {
    question_id: questionId,
    field_key: fieldKey,
    error,
    type: "validation_error",
    msg: error,
  };
}

export function validateFields(
  value: any,
  questionId: string,
  fields: FieldDefinitions,
): QuestionValidationError[] {
  return Object.entries(fields).reduce((errors, [_, field]) => {
    if (
      field.required &&
      (!value?.[field.key] ||
        (field.validate && !field.validate(value[field.key])))
    ) {
      errors.push(
        createValidationError(questionId, field.key, t("field_required")),
      );
    }
    return errors;
  }, [] as QuestionValidationError[]);
}
