import { JSONSchema, JSONSchemaToZod } from "@dmitryrechkin/json-schema-to-zod";
import { z } from "zod";

import {
  ConditionalRule,
  ExtensionContext,
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
function extractDefaults(
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
    render_blacklist: xui?.render_blacklist,
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
function extractFieldMetadata(
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
 * Builds a ConditionalRule from a schema fragment with if/then/else.
 * Returns null if there's no `if` or no usable conditions.
 */
function buildRule(
  node: {
    if?: JSONSchemaProperty;
    then?: JSONSchemaProperty;
    else?: JSONSchemaProperty;
  },
  pathPrefix = "",
): ConditionalRule | null {
  if (!node.if) return null;

  const conditions = extractConditionsFromIf(node.if, pathPrefix);
  if (conditions.length === 0) return null;

  const withPrefix = (fields: string[]) =>
    pathPrefix ? fields.map((f) => `${pathPrefix}.${f}`) : fields;

  const effects = (branch: JSONSchemaProperty | undefined) => {
    const required = branch?.required ?? [];
    const props = branch?.properties ? Object.keys(branch.properties) : [];
    return {
      requiredFields: withPrefix(required),
      visibleFields: withPrefix(props.length > 0 ? props : required),
    };
  };

  return {
    conditions,
    then: effects(node.then),
    else: node.else ? effects(node.else) : undefined,
  };
}

/**
 * Recursively collects conditional rules from a schema:
 * its own allOf/if-then-else, plus those of every nested property.
 */
function collectRules(
  schema: JSONSchemaProperty,
  pathPrefix = "",
): ConditionalRule[] {
  const rules: ConditionalRule[] = [];

  // allOf entries that are if/then/else fragments
  for (const item of schema.allOf ?? []) {
    if (isConditional(item)) {
      const rule = buildRule(item, pathPrefix);
      if (rule) rules.push(rule);
    }
  }

  // Direct if/then/else on this node
  const direct = buildRule(schema, pathPrefix);
  if (direct) rules.push(direct);

  // Recurse into nested properties
  for (const [name, prop] of Object.entries(schema.properties ?? {})) {
    const nestedPath = pathPrefix ? `${pathPrefix}.${name}` : name;
    rules.push(...collectRules(prop, nestedPath));
  }

  return rules;
}

/**
 * Extracts conditional rules from a JSON Schema.
 * Conditionally required fields are also treated as conditionally visible.
 */
function extractConditionalRules(
  schema: JSONSchema2020 | undefined,
): ConditionalRule[] {
  return schema ? collectRules(schema) : [];
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
 * Evaluates conditional rules against current form values.
 * Returns which fields should be required and visible.
 */
export function evaluateConditionalRules(
  rules: ConditionalRule[],
  values: Record<string, unknown>,
): ConditionalEvaluationResult {
  const requiredFields = new Set<string>();
  const visibleFields = new Set<string>();
  const conditionalFields = new Set<string>();

  for (const rule of rules) {
    // Every field touched by then/else is "controlled" by this rule.
    rule.then.visibleFields.forEach((f) => conditionalFields.add(f));
    rule.else?.visibleFields.forEach((f) => conditionalFields.add(f));

    const conditionsMet = rule.conditions.every(
      (cond) => getValueAtPath(values, cond.field) === cond.value,
    );

    const branch = conditionsMet ? rule.then : rule.else;
    branch?.requiredFields.forEach((f) => requiredFields.add(f));
    branch?.visibleFields.forEach((f) => visibleFields.add(f));
  }

  return { requiredFields, visibleFields, conditionalFields };
}

/**
 * Extracts defaults, field metadata, and conditional rules from a schema.
 * If `context` is provided, the result excludes fields that opted out of
 * that context via `x-ui.render_blacklist` (const/hidden fields always pass through).
 */
export function extractSchemaInfo(
  schema: JSONSchema2020 | undefined,
  context?: ExtensionContext,
): ExtensionSchemaResult {
  const result: ExtensionSchemaResult = {
    defaults: extractDefaults(schema),
    fieldMetadata: extractFieldMetadata(schema),
    conditionalRules: extractConditionalRules(schema),
  };

  if (!context) return result;

  const fieldMetadata = filterFieldsByContext(result.fieldMetadata, context);
  const surviving = new Set(fieldMetadata.map((f) => f.name));

  return {
    fieldMetadata,
    defaults: Object.fromEntries(
      Object.entries(result.defaults).filter(([key]) => surviving.has(key)),
    ),
    conditionalRules: filterConditionalRulesByContext(
      result.conditionalRules,
      surviving,
    ),
  };
}

/** Recursively drop fields that opted out of `context`; const/hidden fields always pass. */
function filterFieldsByContext(
  fields: ExtensionFieldMetadata[],
  context: ExtensionContext,
): ExtensionFieldMetadata[] {
  return fields
    .filter(
      (field) =>
        field.isConst ||
        field.type === "hidden" ||
        !field.render_blacklist?.includes(context),
    )
    .map((field) =>
      field.nestedFields
        ? {
            ...field,
            nestedFields: filterFieldsByContext(field.nestedFields, context),
          }
        : field,
    );
}

/** Drop rules whose trigger field was filtered out; prune then/else targets to surviving fields. */
function filterConditionalRulesByContext(
  rules: ConditionalRule[],
  surviving: Set<string>,
): ConditionalRule[] {
  const isAlive = (path: string) => surviving.has(path.split(".")[0]);

  const pruneEffects = (
    effects: ConditionalRule["then"],
  ): ConditionalRule["then"] => ({
    requiredFields: effects.requiredFields.filter(isAlive),
    visibleFields: effects.visibleFields.filter(isAlive),
  });

  const hasEffects = (effects: ConditionalRule["then"]) =>
    effects.requiredFields.length > 0 || effects.visibleFields.length > 0;

  return rules.flatMap((rule) => {
    if (!rule.conditions.every((c) => isAlive(c.field))) return [];
    const then = pruneEffects(rule.then);
    const elseEffects = rule.else ? pruneEffects(rule.else) : undefined;
    if (!hasEffects(then) && !(elseEffects && hasEffects(elseEffects))) {
      return [];
    }
    return [{ conditions: rule.conditions, then, else: elseEffects }];
  });
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
