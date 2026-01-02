import { useEffect, useMemo, useRef } from "react";
import {
  Control,
  FieldValues,
  Path,
  UseFormSetValue,
  useWatch,
} from "react-hook-form";

import { evaluateConditionalRules } from "@/Utils/schema/extensionSchema";
import { ConditionalRule } from "@/Utils/schema/types";

interface UseConditionalFieldsOptions<T extends FieldValues> {
  /** Conditional rules extracted from the schema */
  rules: ConditionalRule[];
  /** React Hook Form control (needed for useWatch) */
  control?: Control<T>;
  /** React Hook Form setValue function (needed to clear hidden fields) */
  setValue?: UseFormSetValue<T>;
  /** Base path for extension fields (e.g., "extensions") */
  basePath?: string;
}

interface ConditionalFieldsResult {
  /** Check if a specific field is conditionally required */
  isFieldRequired: (fieldName: string) => boolean;
  /** Check if a specific field should be visible */
  isFieldVisible: (fieldName: string) => boolean;
  /** Check if a field is controlled by conditional rules */
  isConditionalField: (fieldName: string) => boolean;
}

/**
 * Extracts all fields that are controlled by conditional rules
 * This is independent of form values - just looks at what fields CAN be conditional
 */
function extractConditionalFieldsFromRules(
  rules: ConditionalRule[],
): Set<string> {
  const conditionalFields = new Set<string>();
  for (const rule of rules) {
    for (const field of rule.then.visibleFields) {
      conditionalFields.add(field);
    }
    if (rule.else) {
      for (const field of rule.else.visibleFields) {
        conditionalFields.add(field);
      }
    }
  }
  return conditionalFields;
}

/**
 * Gets a value at a nested path (supports dot notation)
 * e.g., getValueAtPath(obj, "cold_chain.temperature") returns obj.cold_chain?.temperature
 */
function getValueAtPath(
  obj: Record<string, unknown> | undefined,
  path: string,
): unknown {
  if (!obj) return undefined;
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Hook that evaluates conditional rules against form values
 * Returns which fields should be required and visible based on current values
 * Also clears field values when they become hidden
 */
export function useConditionalFields<T extends FieldValues>({
  rules,
  control,
  setValue,
  basePath = "extensions",
}: UseConditionalFieldsOptions<T>): ConditionalFieldsResult {
  // Use useWatch to properly subscribe to extension value changes
  const extensionValues = useWatch({
    control,
    name: basePath as Path<T>,
  }) as Record<string, unknown> | undefined;

  // Always extract which fields are controlled by conditions
  // This ensures conditional fields are hidden even before form data exists
  const allConditionalFields = useMemo(
    () => extractConditionalFieldsFromRules(rules),
    [rules],
  );

  const evaluation = useMemo(() => {
    if (!rules.length || !extensionValues) {
      // Return empty required/visible but keep track of ALL conditional fields
      // This ensures conditional fields stay hidden until their condition is met
      return {
        requiredFields: new Set<string>(),
        visibleFields: new Set<string>(),
        conditionalFields: allConditionalFields,
      };
    }
    return evaluateConditionalRules(rules, extensionValues);
  }, [rules, extensionValues, allConditionalFields]);

  // Track previously visible fields to detect when fields become hidden
  const prevVisibleRef = useRef<Set<string>>(new Set());

  // Handle field visibility changes:
  // - Initialize objects when they become visible (for nested field validation)
  // - Clear field values when they become hidden
  useEffect(() => {
    if (!setValue || !rules.length) return;

    const prevVisible = prevVisibleRef.current;
    const { visibleFields, conditionalFields } = evaluation;

    for (const field of conditionalFields) {
      const wasVisible = prevVisible.has(field);
      const isNowVisible = visibleFields.has(field);
      const fieldPath = `${basePath}.${field}` as Path<T>;
      // Use getValueAtPath to handle nested paths like "cold_chain.temperature_settings"
      const currentValue = getValueAtPath(extensionValues, field);

      if (!wasVisible && isNowVisible) {
        // Field became visible - initialize as empty object if it doesn't exist
        // This allows nested field validation to work properly
        if (currentValue === undefined) {
          setValue(fieldPath, {} as T[keyof T]);
        }
      } else if (wasVisible && !isNowVisible) {
        // Field became hidden - clear its value
        setValue(fieldPath, undefined as T[keyof T]);
      }
    }

    // Update the ref for next comparison
    prevVisibleRef.current = new Set(visibleFields);
  }, [evaluation, setValue, basePath, rules.length, extensionValues]);

  const isFieldRequired = useMemo(() => {
    return (fieldName: string) => evaluation.requiredFields.has(fieldName);
  }, [evaluation.requiredFields]);

  const isFieldVisible = useMemo(() => {
    return (fieldName: string) => {
      // If the field is controlled by conditions, check visibility
      if (evaluation.conditionalFields.has(fieldName)) {
        return evaluation.visibleFields.has(fieldName);
      }
      // Non-conditional fields are always visible
      return true;
    };
  }, [evaluation.conditionalFields, evaluation.visibleFields]);

  const isConditionalField = useMemo(() => {
    return (fieldName: string) => evaluation.conditionalFields.has(fieldName);
  }, [evaluation.conditionalFields]);

  return {
    isFieldRequired,
    isFieldVisible,
    isConditionalField,
  };
}
