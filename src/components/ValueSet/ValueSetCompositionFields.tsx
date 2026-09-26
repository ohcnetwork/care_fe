import { Layers3 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";

import type { ValueSetFormData } from "./valueSetFormTypes";
import { ValueSetRuleFields } from "./ValueSetRuleFields";

interface ValueSetCompositionFieldsProps {
  form: UseFormReturn<ValueSetFormData>;
  hasParentRules: boolean;
  disabled?: boolean;
  isReadOnly?: boolean;
  isDirty: boolean;
  openRules: { include: number | null; exclude: number | null };
  onOpenRule: (type: "include" | "exclude", index: number | null) => void;
}

export function ValueSetCompositionFields({
  form,
  hasParentRules,
  disabled,
  isReadOnly,
  isDirty,
  openRules,
  onOpenRule,
}: ValueSetCompositionFieldsProps) {
  const { t } = useTranslation();
  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers3 aria-hidden className="size-4 text-gray-500" />
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            {t("definition")}
          </h2>
        </div>
        {!isReadOnly && (
          <p role="status" className="text-sm text-gray-500">
            {t(isDirty ? "valueset_unsaved_changes" : "no_changes_to_save")}
          </p>
        )}
      </div>
      {hasParentRules && (
        <FormField
          control={form.control}
          name="disable_composition"
          render={({ field }) => (
            <FormItem className="flex items-start justify-between gap-4 rounded-lg border border-gray-200 p-4">
              <div className="space-y-1">
                <FormLabel>{t("valueset_use_parent_rules")}</FormLabel>
                <FormDescription>
                  {t(
                    field.value
                      ? "valueset_own_rules_hint"
                      : "valueset_parent_rules_hint",
                  )}
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  ref={field.ref}
                  name={field.name}
                  onBlur={field.onBlur}
                  checked={!field.value}
                  onCheckedChange={(checked) => field.onChange(!checked)}
                  disabled={disabled}
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
      <div className="grid items-start gap-7">
        <ValueSetRuleFields
          type="include"
          form={form}
          disabled={disabled}
          openIndex={openRules.include}
          onOpenIndexChange={(include) => onOpenRule("include", include)}
        />
        <ValueSetRuleFields
          type="exclude"
          form={form}
          disabled={disabled}
          openIndex={openRules.exclude}
          onOpenIndexChange={(exclude) => onOpenRule("exclude", exclude)}
        />
      </div>
    </section>
  );
}
