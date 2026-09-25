import { Plus, Trash2 } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetFilterFieldsProps {
  nestIndex: number;
  type: "include" | "exclude";
  disabled?: boolean;
  parentForm: UseFormReturn<ValueSetFormData>;
}

export function ValueSetFilterFields({
  nestIndex,
  type,
  disabled,
  parentForm,
}: ValueSetFilterFieldsProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });
  const hasConcepts = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
    compute: (concepts) => !!concepts?.length,
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">{t("filters")}</h4>
          <Badge variant="secondary" className="min-w-6 justify-center px-1.5">
            {fields.length}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ property: "", op: "", value: "" })}
          disabled={disabled || hasConcepts}
          className="bg-white"
        >
          <Plus className="size-4" />
          {t("add_filter")}
        </Button>
      </div>
      <div className="space-y-3">
        {hasConcepts && (
          <p className="text-sm text-gray-500">
            {t("valueset_rule_mode_hint")}
          </p>
        )}
        {fields.length === 0 && (
          <div className="flex min-h-16 items-center justify-center rounded-md border border-dashed border-gray-300 bg-white px-4 text-center text-sm text-gray-500">
            {t("valueset_no_filters")}
          </div>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end"
          >
            <FormField
              control={parentForm.control}
              name={`compose.${type}.${nestIndex}.filter.${index}.property`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("property")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("property")}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={parentForm.control}
              name={`compose.${type}.${nestIndex}.filter.${index}.op`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("operator")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("operator")}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={parentForm.control}
              name={`compose.${type}.${nestIndex}.filter.${index}.value`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("value")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("value")}
                      disabled={disabled}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={t("remove")}
              onClick={() => remove(index)}
              disabled={disabled}
              className="justify-self-end text-gray-500 hover:text-red-600 sm:justify-self-auto"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </section>
  );
}
