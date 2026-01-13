/**
 * JSON Schema Draft 2020-12 TypeScript types
 * Used for schema-driven form extensions
 */

/**
 * JSON Schema property types
 */
export type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

/**
 * x-ui control types for custom UI rendering
 */
export type XUILayoutControl = "page" | "section" | "grid" | "table" | "list";

export type XUIInputControl =
  | "textbox"
  | "textarea"
  | "dropdown"
  | "radio"
  | "checkbox"
  | "switch"
  | "date"
  | "datetime"
  | "autocomplete";

export type XUIControl = XUILayoutControl | XUIInputControl;

/**
 * x-ui extension for custom UI hints
 */
export interface XUI {
  /** The UI control to use for rendering */
  control?: XUIControl;
  /** Variant/style modifier for the control */
  variant?: string;
  /** Generic metadata for dynamic/complex controls (e.g., autocomplete config, API endpoints) */
  metadata?: Record<string, unknown>;
}

/**
 * JSON Schema conditional (if/then/else) definition
 */
export interface JSONSchemaConditional {
  if?: JSONSchemaProperty;
  then?: JSONSchemaProperty;
  else?: JSONSchemaProperty;
}

/**
 * JSON Schema property definition
 */
export interface JSONSchemaProperty {
  type?: JSONSchemaType | JSONSchemaType[];
  title?: string;
  description?: string;
  default?: unknown;
  const?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  format?: string;
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaProperty;
  $ref?: string;
  oneOf?: JSONSchemaProperty[];
  anyOf?: JSONSchemaProperty[];
  allOf?: (JSONSchemaProperty | JSONSchemaConditional)[];
  // Conditional keywords
  if?: JSONSchemaProperty;
  then?: JSONSchemaProperty;
  else?: JSONSchemaProperty;
  // x-ui extension for custom UI hints
  "x-ui"?: XUI;
}

/**
 * JSON Schema Draft 2020-12 root schema
 */
export interface JSONSchema2020 {
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: JSONSchemaType | JSONSchemaType[];
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean | JSONSchemaProperty;
  default?: unknown;
  const?: unknown;
  enum?: unknown[];
  definitions?: Record<string, JSONSchemaProperty>;
  $defs?: Record<string, JSONSchemaProperty>;
  // Conditional keywords
  allOf?: (JSONSchemaProperty | JSONSchemaConditional)[];
  if?: JSONSchemaProperty;
  then?: JSONSchemaProperty;
  else?: JSONSchemaProperty;
  // x-ui extension for custom UI hints
  "x-ui"?: XUI;
}

/**
 * UI field types for rendering (base types derived from JSON Schema)
 */
export type UIFieldType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "select"
  | "date"
  | "datetime"
  | "time"
  | "email"
  | "uri"
  | "object"
  | "array"
  | "autocomplete"
  | "hidden";

/**
 * Field metadata extracted from JSON Schema for UI rendering
 */
export interface ExtensionFieldMetadata {
  /** Field name/key */
  name: string;
  /** Display label (from title or derived from name) */
  label: string;
  /** Help text (from description) */
  description?: string;
  /** Field type for rendering (derived from JSON Schema type) */
  type: UIFieldType;
  /** JSON Schema format (date, date-time, email, uri, etc.) */
  format?: string;
  /** Whether field is read-only */
  readOnly: boolean;
  /** Whether field has a fixed value (const) */
  isConst: boolean;
  /** Fixed value if const */
  constValue?: unknown;
  /** Default value */
  defaultValue?: unknown;
  /** Enum options for select/radio/dropdown fields */
  options?: { value: unknown; label: string }[];
  /** Minimum value for numbers */
  minimum?: number;
  /** Maximum value for numbers */
  maximum?: number;
  /** Minimum length for strings */
  minLength?: number;
  /** Maximum length for strings */
  maxLength?: number;
  /** Minimum items for arrays */
  minItems?: number;
  /** Maximum items for arrays */
  maxItems?: number;
  /** Regex pattern for strings */
  pattern?: string;
  /** Whether field is required */
  required: boolean;
  /** Nested fields for object type */
  nestedFields?: ExtensionFieldMetadata[];
  /** Item metadata for array types */
  itemMetadata?: ExtensionFieldMetadata;
  /** x-ui control hint from schema */
  uiControl?: XUIControl;
  /** x-ui variant hint from schema */
  uiVariant?: string;
  /** Generic metadata from x-ui for dynamic controls (e.g., autocomplete, custom widgets) */
  uiMetadata?: Record<string, unknown>;
}

/**
 * A condition that checks if a field has a specific value
 */
export interface FieldCondition {
  /** The field name to check */
  field: string;
  /** The value the field must equal for the condition to be true */
  value: unknown;
}

/**
 * Effects to apply when a condition is met
 */
export interface ConditionalEffects {
  /** Fields that become required when condition is true */
  requiredFields: string[];
  /** Fields that become visible when condition is true */
  visibleFields: string[];
}

/**
 * A conditional rule extracted from if/then/else
 */
export interface ConditionalRule {
  /** Conditions that must be met (all must be true - AND logic) */
  conditions: FieldCondition[];
  /** Effects to apply when conditions are met */
  then: ConditionalEffects;
  /** Effects to apply when conditions are NOT met */
  else?: ConditionalEffects;
}

/**
 * Result of extracting defaults and metadata from a schema
 */
export interface ExtensionSchemaResult {
  /** Default values for form initialization */
  defaults: Record<string, unknown>;
  /** Field metadata for UI rendering */
  fieldMetadata: ExtensionFieldMetadata[];
  /** Conditional rules for dynamic field behavior */
  conditionalRules: ConditionalRule[];
}
