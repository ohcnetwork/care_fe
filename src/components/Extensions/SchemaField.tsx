import { Control, FieldValues, Path } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { ConditionalRule, ExtensionFieldMetadata } from "@/Utils/schema/types";

import { ArrayField } from "./ArrayField";
import { AutocompleteField } from "./AutocompleteField";

interface SchemaFieldProps<TFieldValues extends FieldValues> {
  /** Field metadata from JSON Schema */
  metadata: ExtensionFieldMetadata;
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** Base path for nested fields (e.g., "extensions") */
  basePath?: string;
  /** Additional class name for the form item */
  className?: string;
  /** Conditional rules for nested field visibility */
  conditionalRules?: ConditionalRule[];
  /** Function to check if a nested field is visible (full path) */
  isFieldVisible?: (fieldPath: string) => boolean;
  /** Function to check if a nested field is required (full path) */
  isFieldRequired?: (fieldPath: string) => boolean;
}

/** Radix uses string values; option indices preserve the schema's original types. */
function getSelectedOption(metadata: ExtensionFieldMetadata, value: unknown) {
  const index = metadata.options?.findIndex(
    (option) => JSON.stringify(option.value) === JSON.stringify(value),
  );
  return index !== undefined && index >= 0 ? String(index) : "";
}

/**
 * Schema-driven field renderer that creates appropriate UI components
 * based on JSON Schema field metadata and x-ui control hints
 */
export function SchemaField<TFieldValues extends FieldValues>({
  metadata,
  control,
  basePath,
  className,
  conditionalRules = [],
  isFieldVisible,
  isFieldRequired,
}: SchemaFieldProps<TFieldValues>) {
  const { t } = useTranslation();
  const fieldPath = basePath
    ? (`${basePath}.${metadata.name}` as Path<TFieldValues>)
    : (metadata.name as Path<TFieldValues>);

  // Hidden fields for const values - render as hidden input
  if (metadata.type === "hidden" || metadata.isConst) {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <input type="hidden" {...field} value={String(field.value ?? "")} />
        )}
      />
    );
  }

  // x-ui control: section - render as a section with nested fields
  if (metadata.uiControl === "section" && metadata.nestedFields) {
    // Filter nested fields based on visibility
    const visibleNestedFields = metadata.nestedFields.filter((nestedMeta) => {
      if (!isFieldVisible) return true;
      const nestedPath = `${fieldPath}.${nestedMeta.name}`;
      return isFieldVisible(nestedPath);
    });

    return (
      <div
        className={cn("space-y-4 p-4 border rounded-lg bg-gray-50", className)}
      >
        <div>
          <h4 className="text-sm font-medium">{metadata.label}</h4>
          {metadata.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.description}
            </p>
          )}
        </div>
        <div className="space-y-4">
          {visibleNestedFields.map((nestedMeta) => {
            // Check if field is conditionally required
            const nestedPath = `${fieldPath}.${nestedMeta.name}`;
            const isRequired =
              nestedMeta.required ||
              (isFieldRequired ? isFieldRequired(nestedPath) : false);

            return (
              <SchemaField
                key={nestedMeta.name}
                metadata={{
                  ...nestedMeta,
                  required: isRequired,
                  readOnly: metadata.readOnly || nestedMeta.readOnly,
                }}
                control={control}
                basePath={fieldPath as string}
                conditionalRules={conditionalRules}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // x-ui control: grid - render nested fields in a grid layout
  if (metadata.uiControl === "grid" && metadata.nestedFields) {
    // Filter nested fields based on visibility
    const visibleNestedFields = metadata.nestedFields.filter((nestedMeta) => {
      if (!isFieldVisible) return true;
      const nestedPath = `${fieldPath}.${nestedMeta.name}`;
      return isFieldVisible(nestedPath);
    });

    return (
      <div className={cn("space-y-2", className)}>
        <FormLabel>
          {metadata.label}
          {metadata.required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        {metadata.description && (
          <p className="text-sm text-muted-foreground">
            {metadata.description}
          </p>
        )}
        <div className="grid grid-cols-2 gap-4">
          {visibleNestedFields.map((nestedMeta) => {
            const nestedPath = `${fieldPath}.${nestedMeta.name}`;
            const isRequired =
              nestedMeta.required ||
              (isFieldRequired ? isFieldRequired(nestedPath) : false);

            return (
              <SchemaField
                key={nestedMeta.name}
                metadata={{
                  ...nestedMeta,
                  required: isRequired,
                  readOnly: metadata.readOnly || nestedMeta.readOnly,
                }}
                control={control}
                basePath={fieldPath as string}
                conditionalRules={conditionalRules}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // x-ui control: autocomplete - render as searchable select with API fetching
  if (metadata.uiControl === "autocomplete" && metadata.uiMetadata) {
    return (
      <AutocompleteField
        metadata={metadata}
        control={control}
        fieldPath={fieldPath}
        className={className}
      />
    );
  }

  // x-ui control: switch - render as toggle switch
  if (metadata.uiControl === "switch") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem
            className={cn(
              "flex flex-row items-center justify-between rounded-lg border p-3",
              className,
            )}
          >
            <div className="space-y-0.5">
              <FormLabel>{metadata.label}</FormLabel>
              {metadata.description && (
                <FormDescription>{metadata.description}</FormDescription>
              )}
            </div>
            <FormControl>
              <Switch
                checked={field.value === true}
                onCheckedChange={(value) => {
                  if (!metadata.readOnly && !field.disabled)
                    field.onChange(value);
                }}
                disabled={metadata.readOnly || field.disabled}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // x-ui control: radio - render as radio group
  if (metadata.uiControl === "radio" && metadata.options) {
    const isInline = metadata.uiVariant === "inline";
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={(value) => {
                  if (!metadata.readOnly && !field.disabled) {
                    field.onChange(metadata.options?.[Number(value)]?.value);
                  }
                }}
                value={getSelectedOption(metadata, field.value)}
                disabled={metadata.readOnly || field.disabled}
                className={cn(
                  isInline ? "flex flex-row gap-4" : "flex flex-col gap-2",
                )}
              >
                {metadata.options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem
                      value={String(index)}
                      disabled={metadata.readOnly || field.disabled}
                      id={`${fieldPath}-${index}`}
                    />
                    <Label htmlFor={`${fieldPath}-${index}`}>
                      {option.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // x-ui control: textarea - render as multi-line text area
  if (metadata.uiControl === "textarea") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Textarea
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
                className={
                  metadata.uiVariant === "compact"
                    ? "min-h-[80px]"
                    : "min-h-[120px]"
                }
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // x-ui control: checkbox - render as checkbox group (for booleans or single checkboxes)
  if (metadata.uiControl === "checkbox") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem
            className={cn(
              "flex flex-row items-start space-x-3 space-y-0",
              className,
            )}
          >
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(value) => {
                  if (!metadata.readOnly && !field.disabled)
                    field.onChange(value);
                }}
                disabled={metadata.readOnly || field.disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{metadata.label}</FormLabel>
              {metadata.description && (
                <FormDescription>{metadata.description}</FormDescription>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // x-ui control: date - render date picker
  if (metadata.uiControl === "date") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                onChange={(date) => {
                  if (!metadata.readOnly && !field.disabled) {
                    field.onChange(
                      date ? new Date(date).toISOString() : undefined,
                    );
                  }
                }}
                disablePicker={metadata.readOnly || field.disabled}
                dateFormat="dd-MM-yyyy"
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // x-ui control: datetime - render datetime input
  if (metadata.uiControl === "datetime") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Boolean fields - render as checkbox (default for boolean without x-ui)
  if (metadata.type === "boolean") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem
            className={cn(
              "flex flex-row items-start space-x-3 space-y-0",
              className,
            )}
          >
            <FormControl>
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(value) => {
                  if (!metadata.readOnly && !field.disabled)
                    field.onChange(value);
                }}
                disabled={metadata.readOnly || field.disabled}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>{metadata.label}</FormLabel>
              {metadata.description && (
                <FormDescription>{metadata.description}</FormDescription>
              )}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Select fields - render as dropdown (or radio if x-ui specified)
  if (metadata.type === "select" && metadata.options) {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <Select
              onValueChange={(value) => {
                if (!metadata.readOnly && !field.disabled) {
                  field.onChange(metadata.options?.[Number(value)]?.value);
                }
              }}
              value={getSelectedOption(metadata, field.value)}
              disabled={metadata.readOnly || field.disabled}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("schema_select_placeholder", {
                      label: metadata.label,
                    })}
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {metadata.options?.map((option, index) => (
                  <SelectItem
                    key={index}
                    value={String(index)}
                    disabled={metadata.readOnly || field.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Number/Integer fields
  if (metadata.type === "number" || metadata.type === "integer") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode={metadata.type === "integer" ? "numeric" : "decimal"}
                step={metadata.type === "integer" ? 1 : "any"}
                min={metadata.minimum}
                max={metadata.maximum}
                {...field}
                disabled={metadata.readOnly || field.disabled}
                onChange={(e) => {
                  if (metadata.readOnly || field.disabled) return;
                  const value = e.target.value;
                  if (value === "") {
                    // Incomplete numbers (e.g. "1e") must remain invalid drafts,
                    // not become an omitted optional field.
                    field.onChange(e.target.validity.badInput ? "" : undefined);
                  } else {
                    const number = Number(value);
                    field.onChange(Number.isFinite(number) ? number : value);
                  }
                }}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Date fields (format: date)
  if (metadata.type === "date") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <DatePicker
                date={field.value ? new Date(field.value) : undefined}
                onChange={(date) => {
                  if (!metadata.readOnly && !field.disabled) {
                    field.onChange(
                      date ? new Date(date).toISOString() : undefined,
                    );
                  }
                }}
                disablePicker={metadata.readOnly || field.disabled}
                dateFormat="dd-MM-yyyy"
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Datetime fields (format: date-time)
  if (metadata.type === "datetime") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Time fields (format: time)
  if (metadata.type === "time") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="time"
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Email fields (format: email)
  if (metadata.type === "email") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="email"
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // URI fields (format: uri)
  if (metadata.type === "uri") {
    return (
      <FormField
        control={control}
        name={fieldPath}
        render={({ field }) => (
          <FormItem className={className}>
            <FormLabel>
              {metadata.label}
              {metadata.required && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </FormLabel>
            <FormControl>
              <Input
                type="url"
                {...field}
                disabled={metadata.readOnly || field.disabled}
                value={field.value ?? ""}
              />
            </FormControl>
            {metadata.description && (
              <FormDescription>{metadata.description}</FormDescription>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  }

  // Array fields - render with table or list layout
  if (metadata.type === "array" && metadata.itemMetadata) {
    return (
      <ArrayField
        metadata={metadata}
        control={control}
        basePath={basePath}
        className={className}
      />
    );
  }

  // Nested object fields
  if (metadata.type === "object" && metadata.nestedFields) {
    // Filter nested fields based on visibility
    const visibleNestedFields = metadata.nestedFields.filter((nestedMeta) => {
      if (!isFieldVisible) return true;
      const nestedPath = `${fieldPath}.${nestedMeta.name}`;
      return isFieldVisible(nestedPath);
    });

    return (
      <div className={cn("space-y-3", className)}>
        <div>
          <FormLabel>
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          {metadata.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {metadata.description}
            </p>
          )}
        </div>
        <div className="pl-4 border-l-2 border-gray-200 space-y-3">
          {visibleNestedFields.map((nestedMeta) => {
            const nestedPath = `${fieldPath}.${nestedMeta.name}`;
            const isRequired =
              nestedMeta.required ||
              (isFieldRequired ? isFieldRequired(nestedPath) : false);

            return (
              <SchemaField
                key={nestedMeta.name}
                metadata={{
                  ...nestedMeta,
                  required: isRequired,
                  readOnly: metadata.readOnly || nestedMeta.readOnly,
                }}
                control={control}
                basePath={fieldPath as string}
                conditionalRules={conditionalRules}
                isFieldVisible={isFieldVisible}
                isFieldRequired={isFieldRequired}
              />
            );
          })}
        </div>
      </div>
    );
  }

  // Default: String fields
  return (
    <FormField
      control={control}
      name={fieldPath}
      render={({ field }) => (
        <FormItem className={className}>
          <FormLabel>
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <FormControl>
            <Input
              type="text"
              minLength={metadata.minLength}
              maxLength={metadata.maxLength}
              pattern={metadata.pattern}
              {...field}
              disabled={metadata.readOnly || field.disabled}
              value={field.value ?? ""}
            />
          </FormControl>
          {metadata.description && (
            <FormDescription>{metadata.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
