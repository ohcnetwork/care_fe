import { t } from "i18next";

import { QuestionValidationError } from "@/types/questionnaire/batch";

export interface FieldMetadata<T = unknown> {
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

export function useFieldError(
  questionId: string,
  errors?: QuestionValidationError[],
  index?: number,
) {
  const hasError = (fieldKey: string) => {
    return errors?.some(
      (error) =>
        error.question_id === questionId &&
        error.field_key === fieldKey &&
        (index === undefined || error.index === index),
    );
  };

  return { hasError };
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
  index?: number,
): QuestionValidationError[] {
  return Object.entries(fields).reduce(
    (errors: QuestionValidationError[], [_, field]) => {
      // Handle case where value itself is undefined
      if (!value) {
        if (field.required) {
          errors.push({
            question_id: questionId,
            error: t("field_required"),
            type: "validation_error",
            field_key: field.key,
            index,
          });
        }
        return errors;
      }

      // Check if the field exists and has a value
      const hasField = field.key in value;
      const fieldValue = value[field.key];

      if (field.required && (!hasField || !fieldValue)) {
        errors.push({
          question_id: questionId,
          error: t("field_required"),
          type: "validation_error",
          field_key: field.key,
          index,
        });
      } else if (hasField && field.validate) {
        try {
          const validationResult = field.validate(fieldValue);
          if (validationResult !== true) {
            errors.push({
              question_id: questionId,
              error: validationResult || t("invalid_value"),
              type: "validation_error",
              field_key: field.key,
              index,
            });
          }
        } catch (error) {
          if (error instanceof Error) {
            errors.push({
              question_id: questionId,
              error: t(error.message || "invalid_value"),
              type: "validation_error",
              field_key: field.key,
              index,
            });
          } else {
            throw error;
          }
        }
      }
      return errors;
    },
    [],
  );
}
