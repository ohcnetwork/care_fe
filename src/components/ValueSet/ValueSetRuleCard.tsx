import { ChevronDown, Trash2 } from "lucide-react";
import { useFormState, useWatch, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TERMINOLOGY_SYSTEMS } from "@/types/valueSet/valueSet";

import { ValueSetConceptFields } from "./ValueSetConceptFields";
import { ValueSetFilterFields } from "./ValueSetFilterFields";
import type { ValueSetFormData } from "./valueSetFormTypes";

interface ValueSetRuleCardProps {
  type: "include" | "exclude";
  index: number;
  form: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
}

export function ValueSetRuleCard({
  type,
  index,
  form,
  disabled,
  open,
  onOpenChange,
  onRemove,
}: ValueSetRuleCardProps) {
  const { t } = useTranslation();
  const ruleName = `compose.${type}.${index}` as const;
  const { system, conceptCount, filterCount } = useWatch({
    control: form.control,
    name: ruleName,
    compute: (rule) => ({
      system: rule?.system,
      conceptCount: rule?.concept?.length ?? 0,
      filterCount: rule?.filter?.length ?? 0,
    }),
  });
  const { errors } = useFormState({ control: form.control, name: ruleName });
  const isInclude = type === "include";
  const systemLabel =
    Object.entries(TERMINOLOGY_SYSTEMS).find(
      ([, value]) => value === system,
    )?.[0] ?? t("system");
  const subtitle = `${systemLabel} · ${t("valueset_concept_count", { count: conceptCount })} · ${t("valueset_filter_count", { count: filterCount })}`;
  const ruleTitle = t(
    isInclude ? "valueset_include_rule" : "valueset_exclude_rule",
    { number: index + 1 },
  );
  const hasErrors = !!errors.compose?.[type]?.[index];

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        "scroll-mt-40 rounded-xl border bg-white shadow-xs",
        hasErrors ? "border-red-300" : "border-gray-200",
      )}
    >
      <div className="flex items-center gap-2 p-3">
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            className="h-auto min-w-0 flex-1 justify-start whitespace-normal p-1.5 text-left"
            aria-label={ruleTitle}
          >
            <ChevronDown
              className={cn(
                "shrink-0 transition-transform",
                open && "rotate-180",
              )}
            />
            <span className="min-w-0 flex-1">
              <span className="block font-semibold">{ruleTitle}</span>
              <span className="mt-1 block text-sm font-normal text-gray-500">
                {subtitle}
              </span>
            </span>
            {hasErrors && (
              <Badge variant="destructive">
                {t("valueset_needs_attention")}
              </Badge>
            )}
          </Button>
        </CollapsibleTrigger>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={t("valueset_remove_rule", { rule: ruleTitle })}
          onClick={onRemove}
          disabled={disabled}
          className="text-gray-500 hover:text-red-600"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
      <CollapsibleContent
        forceMount
        className="border-t border-gray-100 p-3 data-[state=closed]:hidden sm:p-4"
      >
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,0.65fr)]">
            <FormField
              control={form.control}
              name={`compose.${type}.${index}.system`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("system")}</FormLabel>
                  <Select
                    onValueChange={(system) => {
                      field.onChange(system);
                      const concepts =
                        form.getValues(`compose.${type}.${index}.concept`) ??
                        [];
                      concepts.forEach((_, conceptIndex) => {
                        form.setValue(
                          `compose.${type}.${index}.concept.${conceptIndex}.display`,
                          "",
                          { shouldDirty: true, shouldValidate: true },
                        );
                      });
                    }}
                    value={field.value}
                    disabled={disabled}
                  >
                    <FormControl>
                      <SelectTrigger
                        ref={field.ref}
                        className="w-full data-[size=default]:h-12 md:data-[size=default]:h-10"
                      >
                        <SelectValue placeholder={t("select_system")} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TERMINOLOGY_SYSTEMS).map(
                        ([key, value]) => (
                          <SelectItem key={key} value={value}>
                            {key}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name={`compose.${type}.${index}.version`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("version")}{" "}
                    <span className="font-normal text-gray-500">
                      ({t("optional")})
                    </span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={t("version")}
                      disabled={disabled}
                      className="h-12 md:h-10"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {conceptCount === 0 && filterCount === 0 && (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
              {t(
                isInclude
                  ? "valueset_all_codes_include"
                  : "valueset_all_codes_exclude",
                { system: systemLabel },
              )}
            </p>
          )}
          <ValueSetConceptFields
            nestIndex={index}
            type={type}
            parentForm={form}
            disabled={disabled}
          />
          <details
            open={filterCount > 0}
            className="group rounded-lg border border-gray-200"
          >
            <summary className="cursor-pointer px-3 py-3 text-sm font-medium focus-visible:outline-primary-500">
              {t("valueset_advanced_filters")}
            </summary>
            <p className="px-3 pb-3 text-sm text-gray-500">
              {t("valueset_filters_hint")}
            </p>
            <div className="px-3 pb-3">
              <ValueSetFilterFields
                nestIndex={index}
                type={type}
                disabled={disabled}
                parentForm={form}
              />
            </div>
          </details>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
