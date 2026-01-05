import { Control, FieldValues, UseFormSetValue } from "react-hook-form";

import { cn } from "@/lib/utils";

import { useConditionalFields } from "@/hooks/useConditionalFields";

import { ConditionalRule, ExtensionFieldMetadata } from "@/Utils/schema/types";

import { SchemaField } from "./SchemaField";

interface ExtensionFieldsProps<TFieldValues extends FieldValues> {
  /** Array of field metadata from JSON Schema */
  fieldMetadata: ExtensionFieldMetadata[];
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** React Hook Form setValue function (needed for clearing hidden fields) */
  setValue?: UseFormSetValue<TFieldValues>;
  /** Conditional rules from schema */
  conditionalRules?: ConditionalRule[];
  /** Base path for nested fields (e.g., "extensions") */
  basePath?: string;
  /** Additional class name for the container */
  className?: string;
  /** Class name applied to each field */
  fieldClassName?: string;
}

/**
 * Container component that renders multiple schema-driven fields
 * Iterates over field metadata and renders appropriate SchemaField components
 * Supports conditional visibility and required fields via if/then/else rules
 * Automatically hides fields when conditions are not met and clears their values
 */
export function ExtensionFields<TFieldValues extends FieldValues>({
  fieldMetadata,
  control,
  setValue,
  conditionalRules = [],
  basePath = "extensions",
  className,
  fieldClassName,
}: ExtensionFieldsProps<TFieldValues>) {
  // Evaluate conditional rules - handles visibility, required, and clearing values
  const { isFieldRequired, isFieldVisible } = useConditionalFields({
    rules: conditionalRules,
    control,
    setValue,
    basePath,
  });

  // Don't render anything if there are no fields
  if (!fieldMetadata || fieldMetadata.length === 0) {
    return null;
  }

  // Filter out hidden/const fields for display (they're still in the form)
  const schemaVisibleFields = fieldMetadata.filter(
    (field) => !field.isConst && field.type !== "hidden",
  );
  const hiddenFields = fieldMetadata.filter(
    (field) => field.isConst || field.type === "hidden",
  );

  // Further filter by conditional visibility
  const displayFields = schemaVisibleFields.filter((field) =>
    isFieldVisible(field.name),
  );

  // Create visibility check function that handles full paths
  // SchemaField passes paths like "extensions.cold_chain_requirements.temperature_settings"
  // We need to strip the basePath prefix to get "cold_chain_requirements.temperature_settings"
  const checkFieldVisible = (fullPath: string): boolean => {
    // Strip basePath prefix if present
    const fieldPath = fullPath.startsWith(`${basePath}.`)
      ? fullPath.slice(basePath.length + 1)
      : fullPath;
    return isFieldVisible(fieldPath);
  };

  const checkFieldRequired = (fullPath: string): boolean => {
    const fieldPath = fullPath.startsWith(`${basePath}.`)
      ? fullPath.slice(basePath.length + 1)
      : fullPath;
    return isFieldRequired(fieldPath);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Render conditionally visible fields */}
      {displayFields.map((metadata) => {
        // Merge base required with conditional required
        const isConditionallyRequired = isFieldRequired(metadata.name);
        const effectiveMetadata = isConditionallyRequired
          ? { ...metadata, required: true }
          : metadata;

        return (
          <SchemaField
            key={metadata.name}
            metadata={effectiveMetadata}
            control={control}
            basePath={basePath}
            className={fieldClassName}
            conditionalRules={conditionalRules}
            isFieldVisible={checkFieldVisible}
            isFieldRequired={checkFieldRequired}
          />
        );
      })}

      {/* Render hidden fields (const values) */}
      {hiddenFields.map((metadata) => (
        <SchemaField
          key={metadata.name}
          metadata={metadata}
          control={control}
          basePath={basePath}
        />
      ))}
    </div>
  );
}
