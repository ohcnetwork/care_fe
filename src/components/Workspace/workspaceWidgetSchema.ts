import type { TFunction } from "i18next";
import { z } from "zod";

import {
  extractSchemaInfo,
  getTitledEnumOptions,
} from "@/Utils/schema/extensionSchema";
import type { JSONSchema2020, JSONSchemaProperty } from "@/Utils/schema/types";

import { localizeWidgetSchemaFields } from "./workspaceWidgetSchemaI18n";

// More complex schemas remain editable as JSON instead of presenting misleading
// controls for fields the shared renderer cannot represent.
function canRender(schema: JSONSchemaProperty): boolean {
  const titledOptions = getTitledEnumOptions(schema);
  if (
    schema.$ref ||
    (schema.oneOf && !titledOptions) ||
    schema.anyOf ||
    schema.allOf ||
    schema.if ||
    schema.then ||
    schema.else ||
    Array.isArray(schema.type) ||
    ["date", "date-time", "time"].includes(schema.format ?? "") ||
    ["date", "datetime", "computed"].includes(schema["x-ui"]?.control ?? "")
  )
    return false;
  if (schema.enum?.some((value) => value !== null && typeof value === "object"))
    return false;
  if (schema.type === "object") {
    return Object.entries(schema.properties ?? {}).every(
      ([key, property]) =>
        !/[.[\]]/.test(key) &&
        !/^\d+$/.test(key) &&
        !["__proto__", "prototype", "constructor"].includes(key) &&
        canRender(property),
    );
  }
  if (schema.type === "array") return !!schema.items && canRender(schema.items);
  return (
    !!titledOptions ||
    ["string", "number", "integer", "boolean"].includes(schema.type ?? "")
  );
}

// Defaults describe runtime behavior; inspecting a widget must not materialize
// them or make a missing required property pass validation.
function withoutDefaults(schema: JSONSchemaProperty): JSONSchemaProperty {
  const result = { ...schema };
  delete result.default;
  if (result.properties)
    result.properties = Object.fromEntries(
      Object.entries(result.properties).map(([key, property]) => [
        key,
        withoutDefaults(property),
      ]),
    );
  if (result.items) result.items = withoutDefaults(result.items);
  if (typeof result.additionalProperties === "object")
    result.additionalProperties = withoutDefaults(result.additionalProperties);
  return result;
}

export function prepareWidgetConfigSchema(
  schema: JSONSchema2020,
  t: TFunction,
) {
  try {
    if (schema.type !== "object" || !canRender(schema)) return undefined;
    const validator = z.fromJSONSchema(
      withoutDefaults(schema) as Parameters<typeof z.fromJSONSchema>[0],
    );
    const { fieldMetadata } = extractSchemaInfo(schema);
    return {
      validator,
      fieldMetadata: localizeWidgetSchemaFields(fieldMetadata, t),
    };
  } catch {
    // An unavailable or unsupported plugin schema must not lose saved options.
    return undefined;
  }
}
