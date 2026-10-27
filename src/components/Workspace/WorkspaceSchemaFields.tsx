import { useEffect, useId, useRef } from "react";
import { FormProvider, useForm, type Path } from "react-hook-form";
import { useTranslation } from "react-i18next";
import type { z } from "zod";

import { SchemaField } from "@/components/Extensions/SchemaField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { ExtensionFieldMetadata } from "@/Utils/schema/types";

interface ConfigFormValues {
  config: Record<string, unknown>;
}

interface WorkspaceSchemaFieldsProps {
  config: Record<string, unknown>;
  fields: ExtensionFieldMetadata[];
  issues: z.core.$ZodIssue[];
  disabled: boolean;
  onChange: (config: Record<string, unknown>) => void;
}

function valueAtPath(value: unknown, path: string[]): unknown {
  for (const key of path) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

function setAtPath(
  config: Record<string, unknown>,
  path: string[],
  value: unknown,
) {
  let target = config;
  for (let index = 0; index < path.length - 1; index++) {
    const key = path[index];
    if (target[key] === null || typeof target[key] !== "object") {
      if (value === undefined) return;
      target[key] = /^\d+$/.test(path[index + 1]) ? [] : {};
    }
    target = target[key] as Record<string, unknown>;
  }
  const key = path[path.length - 1];
  if (value === undefined) delete target[key];
  else target[key] = value;
}

export function WorkspaceSchemaFields({
  config,
  fields,
  issues,
  disabled,
  onChange,
}: WorkspaceSchemaFieldsProps) {
  const { t } = useTranslation();
  const form = useForm<ConfigFormValues>({ defaultValues: { config } });
  const serialized = JSON.stringify(config);
  const lastValue = useRef(serialized);
  const syncing = useRef(false);

  useEffect(() => {
    if (lastValue.current === serialized) return;
    lastValue.current = serialized;
    syncing.current = true;
    form.reset({ config });
    syncing.current = false;
  }, [config, form, serialized]);

  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (disabled || syncing.current || !name?.startsWith("config.")) return;
      const path = name.slice("config.".length).split(".");
      let value = valueAtPath(values.config, path);
      const field =
        path.length === 1
          ? fields.find((field) => field.name === path[0])
          : undefined;
      if (field && !field.required && field.minLength && value === "")
        value = undefined;
      const nextConfig = JSON.parse(lastValue.current) as Record<
        string,
        unknown
      >;
      // RHF registers omitted arrays as []. Registration is not a config edit.
      if (
        valueAtPath(nextConfig, path) === undefined &&
        (value === undefined || (Array.isArray(value) && !value.length))
      )
        return;
      // Merge only the changed path so registering another optional object or
      // array never materializes it when an unrelated option is edited.
      setAtPath(nextConfig, path, value);
      const next = JSON.stringify(nextConfig);
      if (lastValue.current === next) return;
      lastValue.current = next;
      onChange(JSON.parse(next) as Record<string, unknown>);
    });
    return () => subscription.unsubscribe();
  }, [disabled, fields, form, onChange]);

  useEffect(() => {
    form.clearErrors();
    for (const issue of issues) {
      if (!issue.path.length) continue;
      form.setError(
        `config.${issue.path.join(".")}` as Path<ConfigFormValues>,
        {
          type: "schema",
          message: issue.message,
        },
      );
    }
  }, [form, issues]);

  return (
    <FormProvider {...form}>
      <fieldset disabled={disabled} className="min-w-0 space-y-4">
        {fields.map((field) => (
          <div key={field.name} className="min-w-0 space-y-1">
            {field.type === "array" && field.itemMetadata?.options?.length ? (
              <EnumArrayField
                field={field}
                options={field.itemMetadata.options}
                value={
                  Array.isArray(config[field.name])
                    ? (config[field.name] as unknown[])
                    : []
                }
                disabled={disabled || field.readOnly}
                onChange={(next) =>
                  form.setValue(
                    `config.${field.name}`,
                    next.length ? next : undefined,
                  )
                }
              />
            ) : (
              <SchemaField
                metadata={{ ...field, readOnly: disabled || field.readOnly }}
                control={form.control}
                basePath="config"
              />
            )}
            {!field.required && !field.isConst && !field.readOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-0 text-xs text-soft-foreground"
                disabled={disabled || config[field.name] === undefined}
                onClick={() => {
                  if (disabled) return;
                  form.setValue(`config.${field.name}`, undefined);
                }}
              >
                {t("workspace_config_clear", { field: field.label })}
              </Button>
            )}
          </div>
        ))}
      </fieldset>
    </FormProvider>
  );
}

/** A fixed set of choices reads better as checkboxes than as an add/remove list. */
function EnumArrayField({
  field,
  options,
  value,
  disabled,
  onChange,
}: {
  field: ExtensionFieldMetadata;
  options: NonNullable<ExtensionFieldMetadata["options"]>;
  value: unknown[];
  disabled: boolean;
  onChange: (value: unknown[]) => void;
}) {
  const id = useId();
  const selected = new Set(value);
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="text-sm font-medium">{field.label}</legend>
      <div className="space-y-2 rounded-lg border border-border p-3">
        {options.map((option, index) => {
          const key = String(option.value);
          const checked = selected.has(option.value);
          return (
            <div key={key} className="flex items-center gap-2.5">
              <Checkbox
                id={`${id}-${index}`}
                checked={checked}
                disabled={disabled}
                onCheckedChange={(state) =>
                  onChange(
                    state
                      ? // Keep the schema's option order rather than click order.
                        options
                          .map((item) => item.value)
                          .filter(
                            (item) =>
                              item === option.value || selected.has(item),
                          )
                      : value.filter((item) => item !== option.value),
                  )
                }
              />
              <Label
                htmlFor={`${id}-${index}`}
                className="text-sm leading-5 font-normal"
              >
                {option.label}
              </Label>
            </div>
          );
        })}
      </div>
      {field.description && (
        <p className="text-xs leading-5 text-soft-foreground">
          {field.description}
        </p>
      )}
    </fieldset>
  );
}
