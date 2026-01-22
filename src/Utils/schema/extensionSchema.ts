import { JSONSchema, JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { z } from "zod";

import {
  ConditionalRule,
  ExtensionFieldMetadata,
  ExtensionSchemaResult,
  FieldCondition,
  JSONSchema2020,
  JSONSchemaConditional,
  JSONSchemaProperty,
  UIFieldType,
} from "./types";

/**
 * Converts a JSON Schema to a Zod schema at runtime
 * @param schema - JSON Schema Draft 2020-12 object
 * @returns Zod schema for validation
 */
export function convertJsonSchemaToZod(
  schema: JSONSchema2020 | undefined,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  if (!schema || !schema.properties) {
    return z.object({});
  }

  try {
    // Cast to the package's expected JSONSchema type
    const zodSchema = JSONSchemaToZod.convert(schema as unknown as JSONSchema);
    return zodSchema as z.ZodObject<Record<string, z.ZodTypeAny>>;
  } catch (error) {
    console.error("Failed to convert JSON Schema to Zod:", error);
    return z.object({});
  }
}

/**
 * Format string to UI field type mapping
 */
const FORMAT_TO_UI_TYPE: Record<string, UIFieldType> = {
  date: "date",
  "date-time": "datetime",
  time: "time",
  email: "email",
  uri: "uri",
};

/**
 * Extracts default values from a JSON Schema property (recursive for nested objects and arrays)
 */
function extractPropertyDefaults(
  property: JSONSchemaProperty,
): unknown | undefined {
  // Use const value if present
  if (property.const !== undefined) {
    return property.const;
  }

  // For object types with nested properties, extract nested defaults
  const type = Array.isArray(property.type) ? property.type[0] : property.type;
  if (type === "object" && property.properties) {
    const nestedDefaults: Record<string, unknown> = {};
    let hasDefaults = false;

    for (const [nestedKey, nestedProp] of Object.entries(property.properties)) {
      const nestedDefault = extractPropertyDefaults(nestedProp);
      if (nestedDefault !== undefined) {
        nestedDefaults[nestedKey] = nestedDefault;
        hasDefaults = true;
      }
    }

    // Return nested defaults if any found, or explicit default if provided
    if (hasDefaults) {
      return nestedDefaults;
    }
  }

  // For array types, use default or empty array
  if (type === "array") {
    // Use explicit default if provided
    if (property.default !== undefined) {
      return property.default;
    }
    // Return empty array as default for arrays (unless minItems requires content)
    return [];
  }

  // Use default value if present
  if (property.default !== undefined) {
    return property.default;
  }

  return undefined;
}

/**
 * Extracts default values from a JSON Schema
 * @param schema - JSON Schema Draft 2020-12 object
 * @returns Record of field names to default values
 */
export function extractDefaults(
  schema: JSONSchema2020 | undefined,
): Record<string, unknown> {
  if (!schema?.properties) {
    return {};
  }

  const defaults: Record<string, unknown> = {};

  for (const [key, property] of Object.entries(schema.properties)) {
    const defaultValue = extractPropertyDefaults(property);
    if (defaultValue !== undefined) {
      defaults[key] = defaultValue;
    }
  }

  return defaults;
}

/**
 * Determines the field type for UI rendering based on JSON Schema property
 * The x-ui control hint is extracted separately and used by the renderer
 */
function determineFieldType(property: JSONSchemaProperty): UIFieldType {
  // If it has a const, it should be hidden
  if (property.const !== undefined) {
    return "hidden";
  }

  // If it has enum options, render as select (unless x-ui specifies radio)
  if (property.enum && property.enum.length > 0) {
    return "select";
  }

  // Map JSON Schema types to UI field types
  const type = Array.isArray(property.type) ? property.type[0] : property.type;

  // Check for string format types first
  if (type === "string" && property.format) {
    const formatType = FORMAT_TO_UI_TYPE[property.format];
    if (formatType) {
      return formatType;
    }
  }

  switch (type) {
    case "boolean":
      return "boolean";
    case "integer":
      return "integer";
    case "number":
      return "number";
    case "object":
      return "object";
    case "array":
      return "array";
    case "string":
    default:
      return "string";
  }
}

/**
 * Converts a field name to a human-readable label
 */
function nameToLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (str) => str.toUpperCase());
}

/**
 * Extracts field metadata from a single JSON Schema property
 */
function extractPropertyMetadata(
  name: string,
  property: JSONSchemaProperty,
  required: boolean,
): ExtensionFieldMetadata {
  const fieldType = determineFieldType(property);
  const xui = property["x-ui"];

  const fieldMeta: ExtensionFieldMetadata = {
    name,
    label: property.title || nameToLabel(name),
    description: property.description,
    type: fieldType,
    format: property.format,
    readOnly: property.readOnly === true,
    isConst: property.const !== undefined,
    constValue: property.const,
    defaultValue: property.default,
    required,
    // x-ui hints
    uiControl: xui?.control,
    uiVariant: xui?.variant,
    uiMetadata: xui?.metadata,
  };

  // Add numeric constraints
  if (property.minimum !== undefined) {
    fieldMeta.minimum = property.minimum;
  }
  if (property.maximum !== undefined) {
    fieldMeta.maximum = property.maximum;
  }

  // Add string constraints
  if (property.minLength !== undefined) {
    fieldMeta.minLength = property.minLength;
  }
  if (property.maxLength !== undefined) {
    fieldMeta.maxLength = property.maxLength;
  }
  if (property.pattern !== undefined) {
    fieldMeta.pattern = property.pattern;
  }

  // Add array constraints
  if (property.minItems !== undefined) {
    fieldMeta.minItems = property.minItems;
  }
  if (property.maxItems !== undefined) {
    fieldMeta.maxItems = property.maxItems;
  }

  // Add enum options
  if (property.enum && property.enum.length > 0) {
    fieldMeta.options = property.enum.map((value) => ({
      value,
      label: String(value),
    }));
  }

  // Handle nested object properties
  if (fieldType === "object" && property.properties) {
    const nestedRequired = new Set(property.required || []);
    fieldMeta.nestedFields = Object.entries(property.properties).map(
      ([nestedName, nestedProp]) =>
        extractPropertyMetadata(
          nestedName,
          nestedProp,
          nestedRequired.has(nestedName),
        ),
    );
  }

  // Handle array items schema
  if (fieldType === "array" && property.items) {
    // For arrays, extract metadata for the item schema
    // The item is treated as an anonymous object
    fieldMeta.itemMetadata = extractPropertyMetadata(
      "item",
      property.items,
      false,
    );
  }

  return fieldMeta;
}

/**
 * Extracts field metadata from a JSON Schema for UI rendering
 * @param schema - JSON Schema Draft 2020-12 object
 * @returns Array of field metadata objects
 */
export function extractFieldMetadata(
  schema: JSONSchema2020 | undefined,
): ExtensionFieldMetadata[] {
  if (!schema?.properties) {
    return [];
  }

  const requiredFields = new Set(schema.required || []);

  return Object.entries(schema.properties).map(([name, property]) =>
    extractPropertyMetadata(name, property, requiredFields.has(name)),
  );
}

/**
 * Type guard to check if an item is a conditional (has if/then)
 */
function isConditional(
  item: JSONSchemaProperty | JSONSchemaConditional,
): item is JSONSchemaConditional {
  return "if" in item && item.if !== undefined;
}

/**
 * Recursively extracts conditions from an "if" schema
 * Supports nested property paths like cold_chain.requires_cold_chain
 */
function extractConditionsFromIf(
  ifSchema: JSONSchemaProperty,
  basePath: string = "",
): FieldCondition[] {
  const conditions: FieldCondition[] = [];

  if (ifSchema.properties) {
    for (const [field, prop] of Object.entries(ifSchema.properties)) {
      const fieldPath = basePath ? `${basePath}.${field}` : field;

      if (prop.const !== undefined) {
        conditions.push({ field: fieldPath, value: prop.const });
      } else if (prop.enum && prop.enum.length === 1) {
        // Single enum value is essentially a const
        conditions.push({ field: fieldPath, value: prop.enum[0] });
      } else if (prop.properties) {
        // Recursively extract conditions from nested properties
        const nestedConditions = extractConditionsFromIf(prop, fieldPath);
        conditions.push(...nestedConditions);
      }
    }
  }

  return conditions;
}

/**
 * Extracts conditional rules from allOf/if-then-else within a property
 * @param property - The property schema to extract rules from
 * @param pathPrefix - Path prefix for nested rules (e.g., "cold_chain_requirements")
 */
function extractPropertyConditionalRules(
  property: JSONSchemaProperty,
  pathPrefix: string = "",
): ConditionalRule[] {
  const rules: ConditionalRule[] = [];

  // Helper to add path prefix to field names
  const withPrefix = (fields: string[]): string[] =>
    fields.map((f) => (pathPrefix ? `${pathPrefix}.${f}` : f));

  // Process allOf within property
  if (property.allOf) {
    for (const item of property.allOf) {
      if (isConditional(item) && item.if) {
        // Extract conditions - these are relative to this property
        const conditions = extractConditionsFromIf(item.if, pathPrefix);

        if (conditions.length > 0) {
          // For visibility: if then.properties is defined, use those
          // Otherwise, treat required fields as also controlling visibility
          const thenRequired = item.then?.required || [];
          const thenHasProperties =
            item.then?.properties &&
            Object.keys(item.then.properties).length > 0;
          const thenVisible = thenHasProperties
            ? Object.keys(item.then!.properties!)
            : thenRequired;

          const rule: ConditionalRule = {
            conditions,
            then: {
              requiredFields: withPrefix(thenRequired),
              visibleFields: withPrefix(thenVisible),
            },
          };

          if (item.else) {
            const elseRequired = item.else.required || [];
            const elseHasProperties =
              item.else.properties &&
              Object.keys(item.else.properties).length > 0;
            const elseVisible = elseHasProperties
              ? Object.keys(item.else.properties!)
              : elseRequired;

            rule.else = {
              requiredFields: withPrefix(elseRequired),
              visibleFields: withPrefix(elseVisible),
            };
          }

          rules.push(rule);
        }
      }
    }
  }

  // Process if/then/else within property
  if (property.if) {
    const conditions = extractConditionsFromIf(property.if, pathPrefix);

    if (conditions.length > 0) {
      const thenRequired = property.then?.required || [];
      const thenHasProperties =
        property.then?.properties &&
        Object.keys(property.then.properties).length > 0;
      const thenVisible = thenHasProperties
        ? Object.keys(property.then!.properties!)
        : thenRequired;

      const rule: ConditionalRule = {
        conditions,
        then: {
          requiredFields: withPrefix(thenRequired),
          visibleFields: withPrefix(thenVisible),
        },
      };

      if (property.else) {
        const elseRequired = property.else.required || [];
        const elseHasProperties =
          property.else.properties &&
          Object.keys(property.else.properties).length > 0;
        const elseVisible = elseHasProperties
          ? Object.keys(property.else.properties!)
          : elseRequired;

        rule.else = {
          requiredFields: withPrefix(elseRequired),
          visibleFields: withPrefix(elseVisible),
        };
      }

      rules.push(rule);
    }
  }

  // Recursively check nested properties for their own conditionals
  if (property.properties) {
    for (const [name, nestedProp] of Object.entries(property.properties)) {
      const nestedPath = pathPrefix ? `${pathPrefix}.${name}` : name;
      rules.push(...extractPropertyConditionalRules(nestedProp, nestedPath));
    }
  }

  return rules;
}

/**
 * Extracts conditional rules from a JSON Schema
 * Looks in allOf for if/then/else patterns at root and nested levels
 * Conditionally required fields are also treated as conditionally visible
 */
export function extractConditionalRules(
  schema: JSONSchema2020 | undefined,
): ConditionalRule[] {
  if (!schema) {
    return [];
  }

  const rules: ConditionalRule[] = [];

  // Process root-level allOf array for conditionals
  if (schema.allOf) {
    for (const item of schema.allOf) {
      if (isConditional(item) && item.if) {
        const conditions = extractConditionsFromIf(item.if);

        if (conditions.length > 0) {
          const thenRequired = item.then?.required || [];
          const thenHasProperties =
            item.then?.properties &&
            Object.keys(item.then.properties).length > 0;
          const thenVisible = thenHasProperties
            ? Object.keys(item.then!.properties!)
            : thenRequired;

          const rule: ConditionalRule = {
            conditions,
            then: {
              requiredFields: thenRequired,
              visibleFields: thenVisible,
            },
          };

          if (item.else) {
            const elseRequired = item.else.required || [];
            const elseHasProperties =
              item.else.properties &&
              Object.keys(item.else.properties).length > 0;
            const elseVisible = elseHasProperties
              ? Object.keys(item.else.properties!)
              : elseRequired;

            rule.else = {
              requiredFields: elseRequired,
              visibleFields: elseVisible,
            };
          }

          rules.push(rule);
        }
      }
    }
  }

  // Also check top-level if/then/else
  if (schema.if) {
    const conditions = extractConditionsFromIf(schema.if);

    if (conditions.length > 0) {
      const thenRequired = schema.then?.required || [];
      const thenHasProperties =
        schema.then?.properties &&
        Object.keys(schema.then.properties).length > 0;
      const thenVisible = thenHasProperties
        ? Object.keys(schema.then!.properties!)
        : thenRequired;

      const rule: ConditionalRule = {
        conditions,
        then: {
          requiredFields: thenRequired,
          visibleFields: thenVisible,
        },
      };

      if (schema.else) {
        const elseRequired = schema.else.required || [];
        const elseHasProperties =
          schema.else.properties &&
          Object.keys(schema.else.properties).length > 0;
        const elseVisible = elseHasProperties
          ? Object.keys(schema.else.properties!)
          : elseRequired;

        rule.else = {
          requiredFields: elseRequired,
          visibleFields: elseVisible,
        };
      }

      rules.push(rule);
    }
  }

  // Extract conditionals from nested properties
  if (schema.properties) {
    for (const [name, property] of Object.entries(schema.properties)) {
      rules.push(...extractPropertyConditionalRules(property, name));
    }
  }

  return rules;
}

/**
 * Result of evaluating conditional rules
 */
export interface ConditionalEvaluationResult {
  /** Fields that are conditionally required */
  requiredFields: Set<string>;
  /** Fields that are conditionally visible (hidden otherwise) */
  visibleFields: Set<string>;
  /** Fields that are controlled by conditions (for hide/show logic) */
  conditionalFields: Set<string>;
}

/**
 * Gets a value at a nested path (supports dot notation)
 * e.g., getValueAtPath(obj, "cold_chain.requires_cold_chain")
 */
function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
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
 * Evaluates conditional rules against current form values
 * Returns which fields should be required and visible
 */
export function evaluateConditionalRules(
  rules: ConditionalRule[],
  values: Record<string, unknown>,
): ConditionalEvaluationResult {
  const requiredFields = new Set<string>();
  const visibleFields = new Set<string>();
  const conditionalFields = new Set<string>();

  for (const rule of rules) {
    // Track all fields that are controlled by conditions
    for (const field of rule.then.visibleFields) {
      conditionalFields.add(field);
    }
    if (rule.else) {
      for (const field of rule.else.visibleFields) {
        conditionalFields.add(field);
      }
    }

    // Check if all conditions are met (supports nested paths)
    const conditionsMet = rule.conditions.every(
      (cond) => getValueAtPath(values, cond.field) === cond.value,
    );

    if (conditionsMet) {
      // Apply "then" effects
      for (const field of rule.then.requiredFields) {
        requiredFields.add(field);
      }
      for (const field of rule.then.visibleFields) {
        visibleFields.add(field);
      }
    } else if (rule.else) {
      // Apply "else" effects
      for (const field of rule.else.requiredFields) {
        requiredFields.add(field);
      }
      for (const field of rule.else.visibleFields) {
        visibleFields.add(field);
      }
    }
  }

  return { requiredFields, visibleFields, conditionalFields };
}

/**
 * Extracts both defaults and field metadata from a schema
 * @param schema - JSON Schema Draft 2020-12 object
 * @returns Object with defaults and fieldMetadata
 */
export function extractSchemaInfo(
  schema: JSONSchema2020 | undefined,
): ExtensionSchemaResult {
  return {
    defaults: extractDefaults(schema),
    fieldMetadata: extractFieldMetadata(schema),
    conditionalRules: extractConditionalRules(schema),
  };
}

/**
 * Checks if a value is considered "empty" for validation purposes
 */
function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === "") {
    return true;
  }
  if (typeof value === "object" && !Array.isArray(value)) {
    // For objects, check if all nested values are empty
    const obj = value as Record<string, unknown>;
    return Object.values(obj).every(isEmptyValue);
  }
  return false;
}

/**
 * Validates nested required fields within an object
 */
function validateNestedRequired(
  value: Record<string, unknown>,
  fieldMeta: ExtensionFieldMetadata,
  path: string,
  ctx: z.RefinementCtx,
): void {
  if (fieldMeta.nestedFields) {
    for (const nested of fieldMeta.nestedFields) {
      const nestedValue = value[nested.name];
      const nestedPath = `${path}.${nested.name}`;

      if (nested.required && isEmptyValue(nestedValue)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${nested.label} is required`,
          path: nestedPath.split("."),
        });
      }

      // Recursively validate nested objects
      if (
        nested.type === "object" &&
        nested.nestedFields &&
        nestedValue &&
        typeof nestedValue === "object"
      ) {
        validateNestedRequired(
          nestedValue as Record<string, unknown>,
          nested,
          nestedPath,
          ctx,
        );
      }
    }
  }
}

/**
 * Creates a Zod schema for extensions with dynamic validation
 * Validates required fields based on schema metadata and conditional rules
 */
export function createExtensionValidationSchema(
  fieldMetadata: ExtensionFieldMetadata[],
  conditionalRules: ConditionalRule[],
): z.ZodType<Record<string, unknown>> {
  return z.record(z.unknown()).superRefine((data, ctx) => {
    // Debug: uncomment to see validation running
    // console.log("[ExtensionValidation] Running validation on:", data);
    if (!data) return;

    // Evaluate conditional rules to get currently required fields
    const { requiredFields: conditionallyRequired, visibleFields } =
      evaluateConditionalRules(conditionalRules, data);

    // Validate each field
    for (const field of fieldMetadata) {
      const value = data[field.name];
      const isConditionalField = conditionalRules.some(
        (rule) =>
          rule.then.visibleFields.includes(field.name) ||
          rule.else?.visibleFields.includes(field.name),
      );

      // Skip validation for conditional fields that are not visible
      if (isConditionalField && !visibleFields.has(field.name)) {
        continue;
      }

      // Check if field is required (base required or conditionally required)
      const isRequired =
        field.required || conditionallyRequired.has(field.name);

      // For object types, validate nested fields
      if (field.type === "object" && field.nestedFields) {
        // If the object doesn't exist and is required, show error
        if (isRequired && (value === undefined || value === null)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required`,
            path: [field.name],
          });
          continue;
        }

        // If the object exists, validate nested fields
        if (value && typeof value === "object") {
          validateNestedRequired(
            value as Record<string, unknown>,
            field,
            field.name,
            ctx,
          );
        }
      } else if (field.type === "array") {
        // For array types, validate minItems/maxItems
        const arrayValue = Array.isArray(value) ? value : [];

        // Check required (minItems >= 1 or explicitly required)
        if (isRequired && arrayValue.length === 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} requires at least one item`,
            path: [field.name],
          });
        }

        // Check minItems constraint
        if (
          field.minItems !== undefined &&
          arrayValue.length < field.minItems
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} requires at least ${field.minItems} item(s)`,
            path: [field.name],
          });
        }

        // Check maxItems constraint
        if (
          field.maxItems !== undefined &&
          arrayValue.length > field.maxItems
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} cannot have more than ${field.maxItems} item(s)`,
            path: [field.name],
          });
        }
      } else {
        // For non-object/non-array types, check if required and empty
        if (isRequired && isEmptyValue(value)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${field.label} is required`,
            path: [field.name],
          });
        }
      }
    }
  });
}
