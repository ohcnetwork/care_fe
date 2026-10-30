import {
  CircleDotDashed,
  CircleMinus,
  CirclePlus,
  Plus,
  Undo2,
} from "lucide-react";
import { useState } from "react";
import { useFieldArray, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TERMINOLOGY_SYSTEMS } from "@/types/valueSet/valueSet";

import { ValueSetRuleCard } from "./ValueSetRuleCard";
import type {
  ValueSetFormData,
  ValueSetFormInclude,
} from "./valueSetFormTypes";

interface ValueSetRuleFieldsProps {
  type: "include" | "exclude";
  form: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
}

export function ValueSetRuleFields({
  type,
  form,
  disabled,
  openIndex,
  onOpenIndexChange,
}: ValueSetRuleFieldsProps) {
  const { t } = useTranslation();
  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: `compose.${type}`,
  });
  const [removedRule, setRemovedRule] = useState<{
    index: number;
    rule: ValueSetFormInclude;
  } | null>(null);
  const isInclude = type === "include";
  const title = isInclude ? t("include_rules") : t("exclude_rules");
  const HeaderIcon = isInclude ? CirclePlus : CircleMinus;

  const addRule = () => {
    const nextIndex = fields.length;
    append({
      system: Object.values(TERMINOLOGY_SYSTEMS)[0],
      version: "",
      concept: [],
      filter: [],
    });
    onOpenIndexChange(nextIndex);
  };

  const removeRule = (index: number) => {
    setRemovedRule({
      index,
      rule: structuredClone(form.getValues(`compose.${type}.${index}`)),
    });
    remove(index);
    onOpenIndexChange(
      fields.length <= 1
        ? null
        : openIndex === index
          ? Math.max(0, index - 1)
          : openIndex !== null && openIndex > index
            ? openIndex - 1
            : openIndex,
    );
  };

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              isInclude
                ? "bg-primary-100 text-primary-800"
                : "bg-gray-100 text-gray-700",
            )}
          >
            <HeaderIcon aria-hidden className="size-4.5" />
          </span>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-gray-950">{title}</h3>
            <Badge
              variant={isInclude ? "primary" : "secondary"}
              className="min-w-6 justify-center px-1.5"
            >
              {fields.length}
            </Badge>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          disabled={disabled}
          className="h-10 bg-white sm:h-9"
        >
          <Plus className="size-4" />
          {t("add_rule")}
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-gray-600">
          {t(isInclude ? "valueset_include_hint" : "valueset_exclude_hint")}
        </p>
        {removedRule && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-gray-100 px-3 py-2">
            <p role="status" className="text-sm text-gray-700">
              {t("valueset_rule_removed")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => {
                const index = Math.min(removedRule.index, fields.length);
                insert(index, removedRule.rule);
                onOpenIndexChange(index);
                setRemovedRule(null);
              }}
            >
              <Undo2 className="size-4" />
              {t("valueset_undo")}
            </Button>
          </div>
        )}
        {fields.length === 0 && (
          <div className="flex min-h-28 flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white px-5 py-5 text-center">
            <CircleDotDashed
              aria-hidden
              className="mb-2 size-5 text-gray-400"
            />
            <p className="text-sm font-medium text-gray-700">
              {t(
                isInclude ? "valueset_include_empty" : "valueset_exclude_empty",
              )}
            </p>
          </div>
        )}

        {fields.map((field, index) => (
          <ValueSetRuleCard
            key={field.id}
            type={type}
            index={index}
            form={form}
            disabled={disabled}
            open={openIndex === index}
            onOpenChange={(open) => onOpenIndexChange(open ? index : null)}
            onRemove={() => removeRule(index)}
          />
        ))}
      </div>
    </section>
  );
}
