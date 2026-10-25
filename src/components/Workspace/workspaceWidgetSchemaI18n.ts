import type { TFunction } from "i18next";
import type { z } from "zod";

import type { ExtensionFieldMetadata } from "@/Utils/schema/types";

export function widgetSchemaText(text: string, t: TFunction): string {
  // Plugin namespaces may use their display name, including spaces. Explicitly
  // select the separator so i18next does not treat such keys as natural text.
  return t(text, { defaultValue: text, nsSeparator: ":" });
}

/** Plugin schemas may use namespaced translation keys or literal labels. */
export function localizeWidgetSchemaFields(
  fields: ExtensionFieldMetadata[],
  t: TFunction,
): ExtensionFieldMetadata[] {
  return fields.map((field) => {
    const staticOptions = field.uiMetadata?.options;
    return {
      ...field,
      label: widgetSchemaText(field.label, t),
      description: field.description
        ? widgetSchemaText(field.description, t)
        : field.description,
      options: field.options?.map((option) => ({
        ...option,
        label: widgetSchemaText(option.label, t),
      })),
      nestedFields: field.nestedFields
        ? localizeWidgetSchemaFields(field.nestedFields, t)
        : undefined,
      itemMetadata: field.itemMetadata
        ? localizeWidgetSchemaFields([field.itemMetadata], t)[0]
        : undefined,
      ...(Array.isArray(staticOptions) && {
        uiMetadata: {
          ...field.uiMetadata,
          options: staticOptions.map((option: unknown) =>
            option &&
            typeof option === "object" &&
            "label" in option &&
            typeof option.label === "string"
              ? {
                  ...option,
                  label: widgetSchemaText(option.label, t),
                }
              : option,
          ),
        },
      }),
    };
  });
}

/** Localize only this editor's validation; leave shared Zod behavior unchanged. */
export function widgetConfigErrorMessage(
  issue: z.core.$ZodRawIssue,
  t: TFunction,
): string {
  if (issue.input === undefined) return t("field_required");
  switch (issue.code) {
    case "invalid_type":
      return issue.expected === "int"
        ? t("workspace_config_integer_error")
        : t("invalid_value");
    case "too_small":
      if (issue.origin === "string")
        return t("workspace_config_string_minimum", { minimum: issue.minimum });
      if (issue.origin === "array")
        return t("workspace_config_array_minimum", { minimum: issue.minimum });
      if (issue.origin === "number" || issue.origin === "int")
        return t(
          issue.inclusive
            ? "workspace_config_number_minimum"
            : "workspace_config_number_exclusive_minimum",
          { minimum: issue.minimum },
        );
      break;
    case "too_big":
      if (issue.origin === "string")
        return t("workspace_config_string_maximum", { maximum: issue.maximum });
      if (issue.origin === "array")
        return t("workspace_config_array_maximum", { maximum: issue.maximum });
      if (issue.origin === "number" || issue.origin === "int")
        return t(
          issue.inclusive
            ? "workspace_config_number_maximum"
            : "workspace_config_number_exclusive_maximum",
          { maximum: issue.maximum },
        );
      break;
    case "invalid_format":
      if (issue.format === "email") return t("invalid_email");
      if (issue.format === "url") return t("invalid_url");
      return t("workspace_config_format_error");
    case "invalid_value":
    case "invalid_union":
      return t("workspace_config_option_error");
    case "unrecognized_keys":
      return t("workspace_config_unknown_keys", {
        keys: issue.keys.join(", "),
      });
    case "not_multiple_of":
      return t("workspace_config_multiple_error", { divisor: issue.divisor });
  }
  return t("invalid_value");
}

export function widgetConfigIssueLabel(
  path: PropertyKey[],
  fields: ExtensionFieldMetadata[],
): string {
  let currentFields = fields;
  let current: ExtensionFieldMetadata | undefined;
  return path
    .map((part) => {
      if (typeof part === "number") {
        current = current?.itemMetadata;
        currentFields = current?.nestedFields ?? [];
        return String(part + 1);
      }
      current = currentFields.find((field) => field.name === part);
      currentFields = current?.nestedFields ?? [];
      return current?.label ?? String(part);
    })
    .join(" / ");
}
