import { Plus } from "lucide-react";
import { useFieldArray, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CodingField } from "./CodingField";
import type { ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetConceptFieldsProps {
  nestIndex: number;
  type: "include" | "exclude";
  parentForm: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
}

export function ValueSetConceptFields({
  nestIndex,
  type,
  parentForm,
  disabled,
}: ValueSetConceptFieldsProps) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });
  const system = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.system`,
  });
  const hasFilters = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
    compute: (filters) => !!filters?.length,
  });

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-gray-900">{t("concepts")}</h4>
          <Badge variant="secondary" className="min-w-6 justify-center px-1.5">
            {fields.length}
          </Badge>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ code: "", display: "" })}
          disabled={disabled || hasFilters}
          className="bg-white"
        >
          <Plus className="size-4" />
          {t("add_concept")}
        </Button>
      </div>
      <div className="space-y-3">
        <p className="text-sm text-gray-500">
          {t(hasFilters ? "valueset_rule_mode_hint" : "valueset_concepts_hint")}
        </p>
        {fields.length === 0 && (
          <div className="rounded-md bg-gray-50 px-3 py-4 text-sm text-gray-500">
            {t("valueset_no_concepts")}
          </div>
        )}
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="border-t border-gray-100 pt-3 first:border-0"
          >
            <CodingField
              key={`${field.id}-${system}`}
              system={system}
              name={`compose.${type}.${nestIndex}.concept.${index}`}
              form={parentForm}
              onRemove={() => remove(index)}
              removeDisabled={disabled}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
