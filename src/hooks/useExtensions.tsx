import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { z } from "zod";

import {
  createExtensionValidationSchema,
  extractSchemaInfo,
} from "@/Utils/schema/extensionSchema";
import { ExtensionFieldMetadata, JSONSchema2020 } from "@/Utils/schema/types";

import { ExtensionFields } from "@/components/Extensions/ExtensionFields";

import useExtensionSchemas, {
  ExtensionSchemaType,
  ExtensionWithSchema,
} from "@/hooks/useExtensionSchemas";
import { ExtensionEntityType } from "@/types/extensions/extensions";

// ============================================================================
// Types
// ============================================================================

/** Namespaced extension data structure: { name: { field: value } } */
export type NamespacedExtensionData = Record<string, Record<string, unknown>>;

/** Field metadata with extension name for display/iteration */
export interface ExtensionFieldWithName extends ExtensionFieldMetadata {
  extensionName: string;
}

/** Processed extension info for forms */
export interface ProcessedExtension {
  config: ExtensionWithSchema["config"];
  schema: JSONSchema2020 | undefined;
  defaults: Record<string, unknown>;
  fieldMetadata: ExtensionFieldMetadata[];
  conditionalRules: ReturnType<typeof extractSchemaInfo>["conditionalRules"];
}

// ============================================================================
// Reading Extension Data
// ============================================================================

/**
 * Get a value from namespaced extension data.
 *
 * @example
 * const value = getExtensionValue(delivery.extensions, "billing_extension", "custom_field");
 */
export function getExtensionValue(
  extensions: NamespacedExtensionData | undefined,
  extensionName: string,
  fieldName: string,
): unknown {
  return extensions?.[extensionName]?.[fieldName];
}

/**
 * Get all field metadata with extension name from extensions.
 * Use for table headers or iterating over all extension fields.
 *
 * @example
 * const fields = getExtensionFieldsWithName(allExtensions);
 * fields.forEach(f => console.log(`${f.extensionName}.${f.name}: ${f.label}`));
 */
export function getExtensionFieldsWithName(
  extensions: ExtensionWithSchema[],
): ExtensionFieldWithName[] {
  return extensions
    .filter(({ schema }) => schema !== undefined)
    .flatMap(({ config, schema }) => {
      const { fieldMetadata } = extractSchemaInfo(schema);
      return fieldMetadata.map((field) => ({
        ...field,
        extensionName: config.name,
      }));
    });
}

// ============================================================================
// Processing Extensions for Forms
// ============================================================================

/**
 * Process an array of extensions, extracting schema info for each.
 */
export function processExtensions(
  extensions: ExtensionWithSchema[],
): ProcessedExtension[] {
  return extensions
    .filter(({ schema }) => schema !== undefined)
    .map(({ config, schema }) => ({
      config,
      schema,
      ...extractSchemaInfo(schema),
    }));
}

/**
 * Build namespaced defaults: { name: { field: defaultValue } }
 */
export function buildNamespacedDefaults(
  processedExtensions: ProcessedExtension[],
): NamespacedExtensionData {
  return processedExtensions.reduce((acc, { config, defaults }) => {
    if (Object.keys(defaults).length > 0) {
      acc[config.name] = defaults;
    }
    return acc;
  }, {} as NamespacedExtensionData);
}

/**
 * Get extension props from a single schema.
 * Use for forms with a single known schema.
 */
export function getExtensionProps(schema: JSONSchema2020 | undefined) {
  const { defaults, fieldMetadata, conditionalRules } =
    extractSchemaInfo(schema);
  const validation = createExtensionValidationSchema(
    fieldMetadata,
    conditionalRules,
  );

  return {
    defaults,
    validation,
    fieldMetadata,
    conditionalRules,
    hasFields: fieldMetadata.length > 0,
  };
}

/**
 * Creates a namespaced validation schema for name-keyed extension data.
 * Structure: { name: { field: value } }
 * Returns a permissive type to be compatible with API response types.
 */
function createNamespacedValidationSchema(
  processedExtensions: ProcessedExtension[],
): z.ZodType<Record<string, unknown>> {
  // Build a schema for each extension's fields
  const extensionSchemas: Record<
    string,
    z.ZodType<Record<string, unknown>>
  > = {};

  for (const {
    config,
    fieldMetadata,
    conditionalRules,
  } of processedExtensions) {
    if (fieldMetadata.length > 0) {
      extensionSchemas[config.name] = createExtensionValidationSchema(
        fieldMetadata,
        conditionalRules,
      );
    }
  }

  // If no extensions have fields, return a simple record schema
  if (Object.keys(extensionSchemas).length === 0) {
    return z.record(z.unknown());
  }

  // Create a schema that validates each extension's data independently
  return z.record(z.unknown()).superRefine((data, ctx) => {
    if (!data || typeof data !== "object") return;

    for (const [extName, extSchema] of Object.entries(extensionSchemas)) {
      const extData = (data as Record<string, unknown>)[extName];
      if (extData && typeof extData === "object") {
        const result = extSchema.safeParse(extData);
        if (!result.success) {
          for (const issue of result.error.issues) {
            ctx.addIssue({
              ...issue,
              path: [extName, ...issue.path],
            });
          }
        }
      }
    }
  });
}

/**
 * Get combined extension props from multiple extensions.
 * Defaults are namespaced by extension name.
 * Use BEFORE creating your form to get defaults and validation.
 */
export function getCombinedExtensionProps(extensions: ExtensionWithSchema[]) {
  const processedExtensions = processExtensions(extensions);
  const namespacedDefaults = buildNamespacedDefaults(processedExtensions);

  // Combine all field metadata and conditional rules
  const allFieldMetadata = processedExtensions.flatMap(
    ({ fieldMetadata }) => fieldMetadata,
  );
  const allConditionalRules = processedExtensions.flatMap(
    ({ conditionalRules }) => conditionalRules,
  );

  // Create namespaced validation schema
  const validation = createNamespacedValidationSchema(processedExtensions);

  return {
    defaults: namespacedDefaults,
    validation,
    fieldMetadata: allFieldMetadata,
    conditionalRules: allConditionalRules,
    hasFields: allFieldMetadata.length > 0,
    processedExtensions,
  };
}

// ============================================================================
// Hook: useExtensions (for single schema)
// ============================================================================

interface UseExtensionsOptions<TForm extends FieldValues> {
  schema: JSONSchema2020 | undefined;
  form: UseFormReturn<TForm>;
  existingData?: Record<string, unknown>;
  basePath?: string;
}

interface UseExtensionsReturn {
  fields: React.ReactElement | null;
  hasFields: boolean;
  defaults: Record<string, unknown>;
  prepareForSubmit: (
    extensions: Record<string, unknown> | undefined,
  ) => Record<string, unknown>;
}

export function useExtensions<TForm extends FieldValues>({
  schema,
  form,
  existingData,
  basePath = "extensions",
}: UseExtensionsOptions<TForm>): UseExtensionsReturn {
  const { defaults, fieldMetadata, conditionalRules } = useMemo(
    () => extractSchemaInfo(schema),
    [schema],
  );

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

  const prepareForSubmit = useCallback(
    (extensions: Record<string, unknown> | undefined) => {
      const merged = { ...defaults, ...extensions };
      return Object.fromEntries(
        Object.entries(merged).filter(([, value]) => value !== undefined),
      );
    },
    [defaults],
  );

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
// Zod Schema Helper
// ============================================================================

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

// ============================================================================
// Hook: useEntityExtensions (fetches from API, handles multiple extensions)
// ============================================================================

interface UseEntityExtensionsOptions<TForm extends FieldValues> {
  entityType: ExtensionEntityType;
  schemaType?: ExtensionSchemaType;
  form: UseFormReturn<TForm>;
  existingData?: NamespacedExtensionData;
  basePath?: string;
}

interface UseEntityExtensionsReturn {
  /** Rendered extension fields (name-namespaced) */
  fields: React.ReactElement | null;
  /** Whether there are any extension fields */
  hasFields: boolean;
  /** Namespaced defaults: { name: { field: value } } */
  defaults: NamespacedExtensionData;
  /** Prepare form data for API submission */
  prepareForSubmit: (
    extensions: NamespacedExtensionData | undefined,
  ) => NamespacedExtensionData;
  /** Loading state */
  isLoading: boolean;
  /** All processed extensions with schema info */
  processedExtensions: ProcessedExtension[];
}

export function useEntityExtensions<TForm extends FieldValues>({
  entityType,
  schemaType = "write",
  form,
  existingData,
  basePath = "extensions",
}: UseEntityExtensionsOptions<TForm>): UseEntityExtensionsReturn {
  const { getExtensions, isLoading } = useExtensionSchemas();

  // Use state to store stable processed extensions - only update when data actually changes
  const [stableExtensions, setStableExtensions] = useState<
    ProcessedExtension[]
  >([]);
  const prevExtensionsKeyRef = useRef<string>("");

  // Track if we've initialized form to prevent infinite loops
  const hasInitializedFormRef = useRef(false);
  const prevExistingDataRef = useRef<string>("");

  // Update stable extensions only when underlying data changes
  useEffect(() => {
    const allExtensions = getExtensions(entityType, schemaType);
    const extensionsKey = JSON.stringify(
      allExtensions.map(({ config }) => ({
        owner: config.owner,
        name: config.name,
        version: config.version,
      })),
    );

    if (extensionsKey !== prevExtensionsKeyRef.current) {
      prevExtensionsKeyRef.current = extensionsKey;
      setStableExtensions(processExtensions(allExtensions));
    }
  }, [getExtensions, entityType, schemaType]);

  // Build namespaced defaults from stable extensions
  const namespacedDefaults = useMemo(
    () => buildNamespacedDefaults(stableExtensions),
    [stableExtensions],
  );

  // Apply defaults and existing data to form (only once per unique data)
  useEffect(() => {
    const existingKey = JSON.stringify(existingData || {});
    const hasDefaults = Object.keys(namespacedDefaults).length > 0;

    // Skip if no data to apply
    if (!hasDefaults && !existingData) {
      return;
    }

    // Skip if already initialized and existing data hasn't changed
    if (
      hasInitializedFormRef.current &&
      existingKey === prevExistingDataRef.current
    ) {
      return;
    }

    // Deep merge by extension name
    const merged: NamespacedExtensionData = {};
    const allNames = new Set([
      ...Object.keys(namespacedDefaults),
      ...Object.keys(existingData || {}),
    ]);

    for (const extName of allNames) {
      merged[extName] = {
        ...(namespacedDefaults[extName] || {}),
        ...(existingData?.[extName] || {}),
      };
    }

    // Update refs before setting value
    prevExistingDataRef.current = existingKey;
    hasInitializedFormRef.current = true;

    form.setValue(basePath as Path<TForm>, merged as TForm[keyof TForm]);
  }, [namespacedDefaults, existingData, form, basePath]);

  // Prepare data for submission
  const prepareForSubmit = useCallback(
    (
      extensions: NamespacedExtensionData | undefined,
    ): NamespacedExtensionData => {
      const result: NamespacedExtensionData = {};

      const allNames = new Set([
        ...Object.keys(namespacedDefaults),
        ...Object.keys(extensions || {}),
      ]);

      for (const extName of allNames) {
        const extDefaults = namespacedDefaults[extName] || {};
        const extValues = extensions?.[extName] || {};
        const merged = { ...extDefaults, ...extValues };

        // Filter out undefined values
        const filtered = Object.fromEntries(
          Object.entries(merged).filter(([, value]) => value !== undefined),
        );

        if (Object.keys(filtered).length > 0) {
          result[extName] = filtered;
        }
      }

      return result;
    },
    [namespacedDefaults],
  );

  // Render fields for each extension with name-namespaced basePath
  // Use stableExtensions which only changes when data actually changes
  const fields = useMemo(() => {
    const extensionsWithFields = stableExtensions.filter(
      ({ fieldMetadata }) => fieldMetadata.length > 0,
    );

    if (extensionsWithFields.length === 0) return null;

    return (
      <>
        {extensionsWithFields.map(
          ({ config, fieldMetadata, conditionalRules }) => (
            <ExtensionFields
              key={config.name}
              fieldMetadata={fieldMetadata}
              control={form.control}
              setValue={form.setValue}
              conditionalRules={conditionalRules}
              basePath={`${basePath}.${config.name}`}
            />
          ),
        )}
      </>
    );
  }, [stableExtensions, form.control, form.setValue, basePath]);

  return {
    fields,
    hasFields: stableExtensions.some(
      ({ fieldMetadata }) => fieldMetadata.length > 0,
    ),
    defaults: namespacedDefaults,
    prepareForSubmit,
    isLoading,
    processedExtensions: stableExtensions,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default useExtensions;
export { ExtensionEntityType, useExtensionSchemas };
