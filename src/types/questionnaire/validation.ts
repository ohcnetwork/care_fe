import { t } from "i18next";

import { QuestionValidationError } from "@/types/questionnaire/batch";

export interface FieldMetadata<T = unknown> {
  key: string;
  required: boolean;
  /**
   * Returns `true` when valid. Returns `false` for a generic invalid value, or
   * an already-translated message string to surface a specific reason.
   */
  validate?: (value: T) => boolean | string;
}

export type FieldDefinitions = {
  [key: string]: FieldMetadata;
};

export interface FieldErrorProps<T extends string> {
  fieldKey: T;
  questionId: string;
  errors?: QuestionValidationError[];
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

  const getError = (fieldKey: string) => {
    return errors?.find(
      (error) =>
        error.question_id === questionId &&
        error.field_key === fieldKey &&
        (index === undefined || error.index === index),
    );
  };

  return { hasError, getError };
}

export function validateFields(
  value: object | null | undefined,
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
      const fieldValue = (value as Record<string, unknown>)[field.key];

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

/**
 * Errors for choice fields still empty in each entry. A deployment can default
 * these fields to none (`REACT_CLINICAL_DEFAULTS`) so the clinician must pick
 * them; this stops the form from saving until they do. `keys` are also the
 * i18n keys of the field labels.
 */
export function validateChosenFields<T extends object>(
  entries: T[],
  questionId: string,
  keys: (keyof T & string)[],
  entryName: (entry: T) => string,
  skip?: (entry: T) => boolean,
): QuestionValidationError[] {
  return entries.flatMap((entry, index) =>
    skip?.(entry)
      ? []
      : keys
          .filter((key) => entry[key] == null || entry[key] === "")
          .map((key) => ({
            question_id: questionId,
            error: t("field_required_for_entry", {
              field: t(key as string),
              entry: entryName(entry),
            }),
            type: "validation_error",
            field_key: key,
            index,
          })),
  );
}
