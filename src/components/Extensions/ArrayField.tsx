import { Plus, Trash2 } from "lucide-react";
import { Control, FieldValues, Path, useFieldArray } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { FormLabel } from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { ExtensionFieldMetadata } from "@/Utils/schema/types";

import { SchemaField } from "./SchemaField";

interface ArrayFieldProps<TFieldValues extends FieldValues> {
  /** Field metadata from JSON Schema */
  metadata: ExtensionFieldMetadata;
  /** React Hook Form control */
  control: Control<TFieldValues>;
  /** Base path for nested fields (e.g., "extensions") */
  basePath?: string;
  /** Additional class name for the container */
  className?: string;
}

/**
 * Renders an array field with add/remove functionality
 * Supports table layout (x-ui: table) and list layout (x-ui: list)
 */
export function ArrayField<TFieldValues extends FieldValues>({
  metadata,
  control,
  basePath,
  className,
}: ArrayFieldProps<TFieldValues>) {
  const { t } = useTranslation();

  const fieldPath = basePath
    ? (`${basePath}.${metadata.name}` as Path<TFieldValues>)
    : (metadata.name as Path<TFieldValues>);

  const { fields, append, remove } = useFieldArray({
    control,
    name: fieldPath as never,
  });

  const itemMeta = metadata.itemMetadata;
  const isTableLayout = metadata.uiControl === "table";
  const nestedFields = itemMeta?.nestedFields || [];

  // Get default values for new items
  const getDefaultItem = () => {
    if (itemMeta?.type === "object" && nestedFields.length > 0) {
      const defaults: Record<string, unknown> = {};
      for (const field of nestedFields) {
        if (field.defaultValue !== undefined) {
          defaults[field.name] = field.defaultValue;
        }
      }
      return defaults;
    }
    return itemMeta?.defaultValue ?? {};
  };

  // Table layout for object arrays
  if (isTableLayout && itemMeta?.type === "object" && nestedFields.length > 0) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex justify-between items-center">
          <FormLabel>
            {metadata.label}
            {metadata.required && <span className="text-red-500 ml-1">*</span>}
          </FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append(getDefaultItem() as never)}
            disabled={
              metadata.maxItems !== undefined &&
              fields.length >= metadata.maxItems
            }
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("add")}
          </Button>
        </div>
        {metadata.description && (
          <p className="text-sm text-muted-foreground">
            {metadata.description}
          </p>
        )}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                {nestedFields
                  .filter((f) => f.type !== "hidden" && !f.isConst)
                  .map((fieldMeta) => (
                    <TableHead key={fieldMeta.name}>
                      {fieldMeta.label}
                      {fieldMeta.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </TableHead>
                  ))}
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      nestedFields.filter(
                        (f) => f.type !== "hidden" && !f.isConst,
                      ).length + 1
                    }
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("no_items_added_yet")}
                  </TableCell>
                </TableRow>
              ) : (
                fields.map((field, index) => (
                  <TableRow key={field.id}>
                    {nestedFields
                      .filter((f) => f.type !== "hidden" && !f.isConst)
                      .map((fieldMeta) => (
                        <TableCell key={fieldMeta.name} className="py-2">
                          <SchemaField
                            metadata={{
                              ...fieldMeta,
                              label: "",
                              required: false, // Required indicator shown in table header
                            }}
                            control={control}
                            basePath={`${fieldPath}.${index}`}
                          />
                        </TableCell>
                      ))}
                    <TableCell className="py-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          remove(index);
                        }}
                        disabled={
                          metadata.minItems !== undefined &&
                          fields.length < metadata.minItems
                        }
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {metadata.minItems !== undefined &&
          fields.length < metadata.minItems && (
            <p className="text-sm text-red-500">
              {t("array_min_items_required", { count: metadata.minItems })}
            </p>
          )}
      </div>
    );
  }

  // List layout (default for arrays)
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex justify-between items-center">
        <FormLabel>
          {metadata.label}
          {metadata.required && <span className="text-red-500 ml-1">*</span>}
        </FormLabel>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append(getDefaultItem() as never)}
          disabled={
            metadata.maxItems !== undefined &&
            fields.length >= metadata.maxItems
          }
        >
          <Plus className="h-4 w-4 mr-1" />
          {t("add")}
        </Button>
      </div>
      {metadata.description && (
        <p className="text-sm text-muted-foreground">{metadata.description}</p>
      )}
      {fields.length === 0 ? (
        <div className="border rounded-md p-8 text-center text-muted-foreground">
          {t("no_items_added_yet")}
        </div>
      ) : (
        <div className="space-y-3">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-md p-4 relative group"
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(index);
                }}
                disabled={
                  metadata.minItems !== undefined &&
                  fields.length <= metadata.minItems
                }
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
              {itemMeta?.type === "object" && nestedFields.length > 0 ? (
                <div className="space-y-4 pr-8">
                  {nestedFields.map((fieldMeta) => (
                    <SchemaField
                      key={fieldMeta.name}
                      metadata={fieldMeta}
                      control={control}
                      basePath={`${fieldPath}.${index}`}
                    />
                  ))}
                </div>
              ) : (
                <SchemaField
                  metadata={itemMeta || { ...metadata, name: String(index) }}
                  control={control}
                  basePath={fieldPath as string}
                />
              )}
            </div>
          ))}
        </div>
      )}
      {metadata.minItems !== undefined && fields.length < metadata.minItems && (
        <p className="text-sm text-red-500">
          {t("array_min_items_required", { count: metadata.minItems })}
        </p>
      )}
    </div>
  );
}
