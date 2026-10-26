import type { FieldPath } from "react-hook-form";

import type { ValueSetFormData } from "./valueSetFormTypes";

export interface FormIssue {
  name: FieldPath<ValueSetFormData>;
  message: string;
}

export function collectFormIssues(errors: unknown, path = ""): FormIssue[] {
  if (!errors || typeof errors !== "object") return [];
  if ("message" in errors && typeof errors.message === "string") {
    return [
      { name: path as FieldPath<ValueSetFormData>, message: errors.message },
    ];
  }
  return Object.entries(errors)
    .filter(([key]) => !["ref", "type", "types"].includes(key))
    .flatMap(([key, value]) =>
      collectFormIssues(value, path ? `${path}.${key}` : key),
    );
}
