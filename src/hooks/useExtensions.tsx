import React, { useCallback, useEffect, useMemo } from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import {
  createExtensionValidationSchema,
  extractSchemaInfo,
} from "@/Utils/schema/extensionSchema";
import { JSONSchema2020 } from "@/Utils/schema/types";

import { ExtensionFields } from "@/components/Extensions/ExtensionFields";

// ============================================================================
// Schema Utilities (for form setup)
// ============================================================================

/**
 * Extract extension info from a JSON Schema.
 * Use this BEFORE creating your form to get defaults and validation.
 *
 * @example
 * ```tsx
 * const ext = getExtensionProps(facility?.extensions_schema_model);
 *
 * const form = useForm({
 *   resolver: zodResolver(baseSchema.extend({ extensions: ext.validation.optional() })),
 *   defaultValues: { name: "", extensions: ext.defaults },
 * });
 * ```
 */
export function getExtensionProps(schema: JSONSchema2020 | undefined) {
  const { defaults, fieldMetadata, conditionalRules } =
    extractSchemaInfo(schema);
  const validation = createExtensionValidationSchema(
    fieldMetadata,
    conditionalRules,
  );

  return {
    /** Default values for extensions */
    defaults,
    /** Zod validation schema - use: baseSchema.extend({ extensions: validation.optional() }) */
    validation,
    /** Field metadata (for advanced use) */
    fieldMetadata,
    /** Conditional rules (for advanced use) */
    conditionalRules,
    /** Whether there are any extension fields */
    hasFields: fieldMetadata.length > 0,
  };
}

// ============================================================================
// Hook Types
// ============================================================================

interface UseExtensionsOptions<TForm extends FieldValues> {
  /** JSON Schema for extension fields */
  schema: JSONSchema2020 | undefined;
  /** React Hook Form instance */
  form: UseFormReturn<TForm>;
  /** Existing extension data (for edit mode) */
  existingData?: Record<string, unknown>;
  /** Path to extensions in form (default: "extensions") */
  basePath?: string;
}

interface UseExtensionsReturn {
  /** JSX element rendering extension fields (null if no fields) */
  fields: React.ReactElement | null;
  /** Whether there are any extension fields */
  hasFields: boolean;
  /** Extension defaults */
  defaults: Record<string, unknown>;
  /** Prepare extension data for API submission (merges defaults, removes undefined) */
  prepareForSubmit: (
    extensions: Record<string, unknown> | undefined,
  ) => Record<string, unknown>;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for rendering extension fields and handling form state.
 *
 * Use `getExtensionProps` BEFORE creating your form to set up validation,
 * then use this hook for rendering and submission helpers.
 *
 * @example
 * ```tsx
 * // 1. Get extension props (for form setup)
 * const ext = getExtensionProps(facility?.extensions_schema_model);
 *
 * // 2. Create form with extension validation
 * const form = useForm({
 *   resolver: zodResolver(baseSchema.extend({ extensions: ext.validation.optional() })),
 *   defaultValues: { name: "", extensions: ext.defaults },
 * });
 *
 * // 3. Use hook for fields & helpers
 * const extensions = useExtensions({
 *   schema: facility?.extensions_schema_model,
 *   form,
 *   existingData: editData?.extensions,
 * });
 *
 * // 4. Render
 * return (
 *   <form onSubmit={form.handleSubmit((data) => {
 *     api.create({ ...data, extensions: extensions.prepareForSubmit(data.extensions) });
 *   })}>
 *     {extensions.fields}
 *   </form>
 * );
 * ```
 */
export function useExtensions<TForm extends FieldValues>({
  schema,
  form,
  existingData,
  basePath = "extensions",
}: UseExtensionsOptions<TForm>): UseExtensionsReturn {
  // Extract schema info
  const { defaults, fieldMetadata, conditionalRules } = useMemo(
    () => extractSchemaInfo(schema),
    [schema],
  );

  // Apply defaults and existing data
  useEffect(() => {
    if (Object.keys(defaults).length === 0 && !existingData) return;

    const currentExtensions =
      (form.getValues(basePath as Path<TForm>) as Record<string, unknown>) ||
      {};

    const merged = {
      ...defaults,
      ...(existingData || {}),
      ...currentExtensions,
    };

    form.setValue(basePath as Path<TForm>, merged as TForm[keyof TForm]);
  }, [defaults, existingData, form, basePath]);

  // Prepare data for submission
  const prepareForSubmit = useCallback(
    (extensions: Record<string, unknown> | undefined) => {
      const merged = { ...defaults, ...extensions };
      return Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value !== undefined),
      );
    },
    [defaults],
  );

  // Render fields
  const fields = useMemo(() => {
    if (fieldMetadata.length === 0) return null;

    return (
      <ExtensionFields
        fieldMetadata={fieldMetadata}
        control={form.control}
        setValue={form.setValue}
        conditionalRules={conditionalRules}
        basePath={basePath}
      />
    );
  }, [fieldMetadata, conditionalRules, form.control, form.setValue, basePath]);

  return {
    fields,
    hasFields: fieldMetadata.length > 0,
    defaults,
    prepareForSubmit,
  };
}

// ============================================================================
// Convenience: Combined Schema Builder
// ============================================================================

/**
 * Extend a base schema with extension validation.
 * Convenience wrapper for common pattern.
 *
 * @example
 * ```tsx
 * const formSchema = withExtensions(
 *   baseSchema,
 *   facility?.extensions_schema_model
 * );
 * ```
 */
export function withExtensions<T extends z.ZodObject<z.ZodRawShape>>(
  baseSchema: T,
  extensionSchema: JSONSchema2020 | undefined,
): z.ZodObject<
  T["shape"] & { extensions: z.ZodOptional<z.ZodType<Record<string, unknown>>> }
> {
  const { validation } = getExtensionProps(extensionSchema);
  return baseSchema.extend({
    extensions: validation.optional(),
  }) as z.ZodObject<
    T["shape"] & {
      extensions: z.ZodOptional<z.ZodType<Record<string, unknown>>>;
    }
  >;
}

export default useExtensions;
