import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  CircleDotDashed,
  CircleMinus,
  CirclePlus,
  Layers3,
  Plus,
  Trash2,
  Undo2,
} from "lucide-react";
import { useNavigationPrompt } from "raviger";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  useFieldArray,
  useForm,
  useWatch,
  type FieldErrors,
  type FieldPath,
  type UseFormReturn,
} from "react-hook-form";
import { useTranslation } from "react-i18next";
import * as z from "zod";

import { cn } from "@/lib/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Form,
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
import { Textarea } from "@/components/ui/textarea";

import {
  TERMINOLOGY_SYSTEMS,
  ValueSetBase,
  ValueSetInclude,
  ValueSetRead,
  ValueSetScope,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { generateSlug, goBack, valuesOf } from "@/Utils/utils";
import { CodingField } from "./CodingField";
import { ScopedValueSet } from "./useScopedValueSets";
import { ValueSetParentPicker } from "./ValueSetParentPicker";
import { ValueSetPreview } from "./ValueSetPreview";

/** What the form hands back: the editable fields plus the create-only
 *  lineage (`parent` / `inherited`), which the backend ignores on update. */
export interface ValueSetFormSubmit extends ValueSetBase {
  parent?: string;
  inherited: boolean;
}

export interface ValueSetFormState {
  isDirty: boolean;
  isSubmitting: boolean;
}

interface ValueSetFormProps {
  scope: ValueSetScope;
  initialData?: ValueSetRead;
  /** Pre-selected parent for a new set (the list's Customize action). */
  initialParent?: ValueSetRead;
  onSubmit: (data: ValueSetFormSubmit) => void;
  onCancel?: () => void;
  onStateChange?: (state: ValueSetFormState) => void;
  isSubmitting?: boolean;
  isReadOnly?: boolean;
  /** Facility access is saved independently by its own field. Keeping it in
   *  this slot lets the editor present one coherent workspace without
   *  coupling access mutations to the value-set payload. */
  accessControl?: React.ReactNode;
}

interface ValueSetFormInclude extends Omit<ValueSetInclude, "version"> {
  version: string;
}

export interface ValueSetFormData extends Omit<ValueSetBase, "compose"> {
  compose: {
    exclude: ValueSetFormInclude[];
    include: ValueSetFormInclude[];
  };
  parent?: string;
  inherited: boolean;
}

const SLUG_MIN = 5;
const SLUG_MAX = 25;

interface FormIssue {
  name: FieldPath<ValueSetFormData>;
  message: string;
}

function collectFormIssues(errors: unknown, path = ""): FormIssue[] {
  if (!errors || typeof errors !== "object") return [];
  if ("message" in errors && typeof errors.message === "string") {
    return [
      { name: path as FieldPath<ValueSetFormData>, message: errors.message },
    ];
  }
  return Object.entries(errors)
    .filter(([key]) => !["ref", "type", "types"].includes(key))
    .flatMap(([key, value]) =>
      collectFormIssues(value, path ? `${path}.${key}` : key),
    );
}

function ConceptFields({
  nestIndex,
  type,
  parentForm,
  disabled,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  parentForm: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });
  const system = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.system`,
  });
  const filters = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });
  const hasFilters = !!filters?.length;

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

function FilterFields({
  nestIndex,
  type,
  disabled,
  parentForm,
}: {
  nestIndex: number;
  type: "include" | "exclude";
  disabled?: boolean;
  parentForm: UseFormReturn<ValueSetFormData>;
}) {
  const { t } = useTranslation();
  const { fields, append, remove } = useFieldArray({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.filter`,
  });
  const concepts = useWatch({
    control: parentForm.control,
    name: `compose.${type}.${nestIndex}.concept`,
  });
  const hasConcepts = !!concepts?.length;

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

function RuleFields({
  type,
  form,
  disabled,
  openIndex,
  onOpenIndexChange,
}: {
  type: "include" | "exclude";
  form: UseFormReturn<ValueSetFormData>;
  disabled?: boolean;
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
}) {
  const { t } = useTranslation();
  const { fields, append, remove, insert } = useFieldArray({
    control: form.control,
    name: `compose.${type}`,
  });
  const rules = useWatch({
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

        {fields.map((field, index) => {
          const rule = rules?.[index];
          const systemLabel =
            Object.entries(TERMINOLOGY_SYSTEMS).find(
              ([, value]) => value === rule?.system,
            )?.[0] ?? t("system");
          const conceptCount = rule?.concept?.length ?? 0;
          const filterCount = rule?.filter?.length ?? 0;
          const subtitle = `${systemLabel} · ${t("valueset_concept_count", { count: conceptCount })} · ${t("valueset_filter_count", { count: filterCount })}`;
          const ruleTitle = t(
            isInclude ? "valueset_include_rule" : "valueset_exclude_rule",
            { number: index + 1 },
          );
          const hasErrors = !!form.formState.errors.compose?.[type]?.[index];

          return (
            <Collapsible
              key={field.id}
              open={openIndex === index}
              onOpenChange={(open) => onOpenIndexChange(open ? index : null)}
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
                        openIndex === index && "rotate-180",
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
                  onClick={() => removeRule(index)}
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
                                form.getValues(
                                  `compose.${type}.${index}.concept`,
                                ) ?? [];
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
                  <ConceptFields
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
                      <FilterFields
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
        })}
      </div>
    </section>
  );
}

/**
 * Create-only lineage for a facility set. A parent makes the new set an
 * extension of it (the backend merges both compositions). A facility
 * customization shares the parent's slug; a separate set keeps its own.
 */
function BasedOnFields({
  facilityId,
  form,
  parent,
  parentScope,
  onParentChange,
  isSlugManuallyEdited,
  disabled,
}: {
  facilityId: string;
  form: UseFormReturn<ValueSetFormData>;
  parent?: ValueSetRead;
  parentScope: ScopedValueSet["authContext"];
  onParentChange: (
    parent: ValueSetRead | undefined,
    scope: ScopedValueSet["authContext"],
  ) => void;
  isSlugManuallyEdited: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const parentLabelId = useId();
  const modeId = useId();
  const authoredSlug = () => generateSlug(form.getValues("name"), SLUG_MAX);
  const standaloneSlug = useRef<string | undefined>(
    form.getValues("inherited") ? undefined : form.getValues("slug"),
  );
  const restoreStandaloneSlug = () =>
    isSlugManuallyEdited ? (standaloneSlug.current ?? "") : authoredSlug();

  // Replacing means taking the parent's slug, which inside one facility
  // would collide with a facility parent under the backend's per-facility
  // slug constraint. Only an instance parent can be replaced.
  const canReplace = !!parent && parentScope === "instance";

  const handleParentChange = (
    option: ScopedValueSet | undefined,
    scope = option?.authContext ?? "instance",
  ) => {
    const next = option?.valueset;
    const wasInherited = form.getValues("inherited");
    onParentChange(next, scope);
    form.setValue("parent", next?.id, { shouldDirty: true });
    const keepsInherited = !!next && scope === "instance" && wasInherited;
    form.setValue("inherited", keepsInherited, { shouldDirty: true });
    if (keepsInherited || wasInherited) {
      form.setValue(
        "slug",
        keepsInherited ? next.slug : restoreStandaloneSlug(),
        { shouldDirty: true, shouldValidate: true },
      );
    }
  };

  const handleInheritedChange = (checked: boolean) => {
    if (checked && !canReplace) return;
    if (checked && !form.getValues("inherited")) {
      standaloneSlug.current = form.getValues("slug");
    }
    form.setValue("inherited", checked, { shouldDirty: true });
    form.setValue(
      "slug",
      checked && parent ? parent.slug : restoreStandaloneSlug(),
      { shouldDirty: true, shouldValidate: true },
    );
  };

  return (
    <section className="space-y-4 border-b border-gray-200 pb-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-gray-900">
          {t("valueset_starting_point")}
        </h2>
        <p className="text-sm text-gray-600">
          {t("valueset_starting_point_hint")}
        </p>
      </div>
      <div className="space-y-2">
        <Label id={parentLabelId}>
          {t("parent_value_set")}{" "}
          <span className="font-normal text-gray-500">({t("optional")})</span>
        </Label>
        <ValueSetParentPicker
          facilityId={facilityId}
          value={parent}
          onChange={handleParentChange}
          disabled={disabled}
          aria-labelledby={parentLabelId}
        />
      </div>
      <FormField
        control={form.control}
        name="inherited"
        render={({ field }) => (
          <FormItem className="space-y-2">
            <FormLabel id={`${modeId}-label`}>
              {t("valueset_usage_mode")}
            </FormLabel>
            <FormControl>
              <RadioGroup
                aria-labelledby={`${modeId}-label`}
                value={field.value ? "customize" : "separate"}
                onValueChange={(value) =>
                  handleInheritedChange(value === "customize")
                }
                disabled={disabled}
                className="grid gap-3 sm:grid-cols-2"
              >
                <Label
                  htmlFor={`${modeId}-separate`}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4",
                    !field.value
                      ? "border-primary-600 bg-primary-50/40"
                      : "border-gray-200",
                    disabled && "cursor-not-allowed opacity-60",
                  )}
                >
                  <RadioGroupItem
                    id={`${modeId}-separate`}
                    value="separate"
                    className="mt-0.5"
                    aria-label={t("valueset_separate")}
                    aria-describedby={`${modeId}-separate-hint`}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-gray-950">
                      {t("valueset_separate")}
                    </span>
                    <span
                      id={`${modeId}-separate-hint`}
                      className="block text-sm leading-5 font-normal text-gray-600"
                    >
                      {t("valueset_separate_hint")}
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor={`${modeId}-customize`}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border bg-white p-4",
                    field.value
                      ? "border-primary-600 bg-primary-50/40"
                      : "border-gray-200",
                    disabled || !canReplace
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                  )}
                >
                  <RadioGroupItem
                    id={`${modeId}-customize`}
                    value="customize"
                    disabled={!canReplace}
                    className="mt-0.5"
                    aria-label={t("valueset_facility_customization")}
                    aria-describedby={`${modeId}-customize-hint`}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-medium text-gray-950">
                      {t("valueset_facility_customization")}
                    </span>
                    <span
                      id={`${modeId}-customize-hint`}
                      className="block text-sm leading-5 font-normal text-gray-600"
                    >
                      {t(
                        canReplace
                          ? "valueset_facility_customization_hint"
                          : "valueset_choose_shared_parent",
                      )}
                    </span>
                  </span>
                </Label>
              </RadioGroup>
            </FormControl>
            {parent && (
              <p className="text-sm leading-5 text-gray-600">
                {t("valueset_parent_rules_hint")}
              </p>
            )}
            {field.value && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-5 text-amber-950">
                {t("valueset_customization_resolution_hint")}
              </p>
            )}
          </FormItem>
        )}
      />
    </section>
  );
}

export function ValueSetForm({
  scope,
  initialData,
  initialParent,
  onSubmit,
  onCancel,
  onStateChange,
  isSubmitting,
  isReadOnly,
  accessControl,
}: ValueSetFormProps) {
  const { t } = useTranslation();
  const formRef = useRef<HTMLFormElement>(null);
  const [parent, setParent] = useState<ValueSetRead | undefined>(initialParent);
  // Mode changes also dirty the slug. Only direct edits should stop name-based
  // generation; otherwise switching out of Customize can strand an empty slug.
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);
  const [openRules, setOpenRules] = useState<{
    include: number | null;
    exclude: number | null;
  }>({
    include: initialData?.compose.include.length ? 0 : null,
    exclude: initialData?.compose.exclude.length ? 0 : null,
  });
  // The seeded parent always comes from the list's Shared catalogue, which is
  // the only place Customize is offered.
  const [parentScope, setParentScope] =
    useState<ScopedValueSet["authContext"]>("instance");
  // Lineage is create-only, and only a facility can extend another set.
  const showBasedOn = !initialData && scope.authContext === "facility";
  const {
    data: sharedCatalogue,
    isSuccess: isSharedCatalogueSuccess,
    isFetching: isSharedCatalogueFetching,
    isError: isSharedCatalogueError,
    refetch: refetchSharedCatalogue,
  } = useQuery({
    queryKey: ["valuesets", "shared-slug-identifiers"],
    queryFn: query.paginated(valueSetApi.list, {
      // Resolution includes all statuses. Fetch every page so a separate
      // facility set cannot accidentally shadow an unseen shared identifier.
      queryParams: { auth_context: "instance" },
      pageSize: 100,
      silent: true,
    }),
    enabled: showBasedOn,
  });
  const sharedSlugs = useMemo(
    () => new Set(sharedCatalogue?.results.map((valueSet) => valueSet.slug)),
    [sharedCatalogue],
  );
  const isSharedCatalogueReady =
    isSharedCatalogueSuccess && !isSharedCatalogueFetching;
  const showSharedCatalogueError =
    isSharedCatalogueError && !isSharedCatalogueFetching;

  const conceptSchema = z.object({
    code: z.string().min(1, t("field_required")),
    display: z.string().min(1, t("valueset_verify_before_saving")),
  });
  const filterSchema = z.object({
    property: z.string().min(1, t("field_required")),
    op: z.string().min(1, t("field_required")),
    value: z.string().min(1, t("field_required")),
  });
  const ruleSchema = z
    .object({
      system: z.string(),
      version: z.string(),
      concept: z.array(conceptSchema).optional(),
      filter: z.array(filterSchema).optional(),
    })
    .superRefine((rule, ctx) => {
      if (rule.concept?.length && rule.filter?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["filter", 0, "property"],
          message: t("valueset_rule_mode_hint"),
        });
      }
    });
  const valuesetFormSchema = z
    .object({
      name: z.string().trim().min(1, t("field_required")),
      slug: z.string().trim(),
      description: z.string(),
      status: z.enum([
        ValueSetStatus.ACTIVE,
        ValueSetStatus.DRAFT,
        ValueSetStatus.RETIRED,
        ValueSetStatus.UNKNOWN,
      ]),
      is_system_defined: z.boolean(),
      compose: z.object({
        include: z.array(ruleSchema),
        exclude: z.array(ruleSchema),
      }),
      parent: z.string().optional(),
      inherited: z.boolean(),
    })
    .superRefine((data, ctx) => {
      // These are authoring rules for a NEW slug. They do not apply to a
      // slug the server assigned: an inherited set takes its parent's
      // verbatim, and an existing set keeps its own — several system slugs
      // are longer than SLUG_MAX, and re-validating them here would make
      // those sets impossible to save.
      if (data.inherited || data.slug === initialData?.slug) return;
      if (data.slug.length < SLUG_MIN || data.slug.length > SLUG_MAX) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("character_count_validation", {
            min: SLUG_MIN,
            max: SLUG_MAX,
          }),
        });
      } else if (!/^[-\w]+$/.test(data.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("slug_format_message"),
        });
      } else if (showBasedOn && sharedSlugs.has(data.slug)) {
        ctx.addIssue({
          code: "custom",
          path: ["slug"],
          message: t("valueset_slug_shared_conflict"),
        });
      }
    });

  const form = useForm<ValueSetFormData>({
    resolver: zodResolver(valuesetFormSchema),
    shouldFocusError: false,
    defaultValues: {
      name: initialData?.name || "",
      slug: initialData?.slug || initialParent?.slug || "",
      description: initialData?.description || "",
      status: initialData?.status || ValueSetStatus.ACTIVE,
      is_system_defined: initialData?.is_system_defined || false,
      compose: {
        include:
          initialData?.compose?.include.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
          })) || [],
        exclude:
          initialData?.compose?.exclude.map((rule) => ({
            ...rule,
            version: rule.version ?? "",
          })) || [],
      },
      parent: initialParent?.id,
      // Customize shares the parent's identifier. A separate extension
      // can instead be created with its own identifier.
      inherited: !!initialParent,
    },
  });

  // All fields have complete defaults above; react-hook-form's broad
  // DeepPartial return type does not reflect that runtime guarantee.
  const values = useWatch({ control: form.control }) as ValueSetFormData;
  const inherited = values.inherited;
  const isSharedSlugCheckBlocked =
    showBasedOn && !inherited && !isSharedCatalogueReady;
  useEffect(() => {
    // A name or slug may be entered before all catalogue pages arrive.
    // Revalidate it against the completed snapshot without another keystroke.
    if (showBasedOn && form.getValues("slug")) {
      void form.trigger("slug");
    }
  }, [form, sharedSlugs, showBasedOn]);
  const pageTitle = initialData
    ? initialData.is_system_defined
      ? t("preview_value_set")
      : t("edit_value_set")
    : t("create_valueset");
  const issues = collectFormIssues(form.formState.errors);
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    onStateChange?.({ isDirty, isSubmitting: !!isSubmitting });
  }, [isDirty, isSubmitting, onStateChange]);
  useNavigationPrompt(
    isDirty && !isSubmitting && !isReadOnly,
    t("unsaved_changes_warning"),
  );

  const focusIssue = (issue: FormIssue) => {
    const parts = issue.name.split(".");
    if (
      parts[0] === "compose" &&
      (parts[1] === "include" || parts[1] === "exclude")
    ) {
      setOpenRules((current) => ({ ...current, [parts[1]]: Number(parts[2]) }));
    }
    requestAnimationFrame(() => {
      const target = issue.name.endsWith(".display")
        ? (issue.name.replace(
            /\.display$/,
            ".code",
          ) as FieldPath<ValueSetFormData>)
        : issue.name;
      // Advanced filters can be collapsed independently of their rule.
      // Reveal every disclosure containing the field before focusing it.
      const control = formRef.current?.querySelector<HTMLElement>(
        `[name="${target}"]`,
      );
      let disclosure = control?.closest("details");
      while (disclosure) {
        disclosure.open = true;
        disclosure = disclosure.parentElement?.closest("details") ?? null;
      }
      form.setFocus(target);
      // Bring the focused control into view after opening its rule.
      document.activeElement?.scrollIntoView({
        block: "center",
        behavior: "auto",
      });
    });
  };
  const issueLabel = (issue: FormIssue) => {
    const parts = issue.name.split(".");
    if (parts[0] !== "compose") return t(parts[0]);
    const rule = t(
      parts[1] === "include"
        ? "valueset_include_rule"
        : "valueset_exclude_rule",
      { number: Number(parts[2]) + 1 },
    );
    if (parts[3] === "concept" || parts[3] === "filter") {
      const location = t("valueset_issue_location", {
        rule,
        item: t(
          parts[3] === "concept"
            ? "valueset_concept_number"
            : "valueset_filter_number",
          { number: Number(parts[4]) + 1 },
        ),
      });
      const fieldLabel = t(
        parts[5] === "op"
          ? "operator"
          : parts[5] === "display"
            ? "display_name"
            : parts[5],
      );
      return `${location} · ${fieldLabel}`;
    }
    return rule;
  };
  const handleInvalid = (errors: FieldErrors<ValueSetFormData>) => {
    const firstIssue = collectFormIssues(errors)[0];
    if (firstIssue) focusIssue(firstIssue);
  };
  const saveButton = (
    <Button
      variant="primary"
      type="submit"
      aria-label={isSubmitting ? t("saving") : t("save_valueset")}
      disabled={isSubmitting || !isDirty || isSharedSlugCheckBlocked}
      className="h-11 shadow-none lg:h-9"
    >
      {isSubmitting ? t("saving") : t("save")}
    </Button>
  );

  return (
    <Form {...form}>
      <form
        ref={formRef}
        onSubmit={(event) => {
          void form.handleSubmit((data) => {
            // Disabled buttons do not cover keyboard or programmatic submit.
            // Explicit customizations and existing edits need no collision check.
            if (showBasedOn && !data.inherited && !isSharedCatalogueReady) {
              return;
            }
            if (!isReadOnly && !isSubmitting) onSubmit(data);
          }, handleInvalid)(event);
        }}
        className="space-y-6"
      >
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 text-gray-500"
              disabled={isSubmitting}
              onClick={onCancel ?? (() => goBack(scope.basePath))}
              aria-label={onCancel ? t("cancel") : t("valueset_back_to_list")}
            >
              <ArrowLeft aria-hidden className="size-4" />
            </Button>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h1 className="text-xl leading-7 font-semibold tracking-tight text-gray-900">
                {pageTitle}
              </h1>
              {isReadOnly && (
                <Badge variant="secondary">{t("read_only")}</Badge>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <ValueSetPreview
              valueset={values}
              definitionNotice={
                parent ? t("valueset_parent_preview_hint") : undefined
              }
              trigger={
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={t("valueset_preview")}
                  className="px-3 text-gray-600"
                >
                  {t("preview")}
                </Button>
              }
            />
            {!isReadOnly && <div className="hidden lg:block">{saveButton}</div>}
          </div>
        </header>

        {form.formState.submitCount > 0 && issues.length > 0 && (
          <Alert variant="destructive" className="border-red-200">
            <AlertCircle />
            <AlertTitle>{t("valueset_fix_errors")}</AlertTitle>
            <AlertDescription>
              <ul className="space-y-1">
                {issues.map((issue) => (
                  <li key={issue.name}>
                    <button
                      type="button"
                      className="cursor-pointer text-left underline underline-offset-2"
                      onClick={() => focusIssue(issue)}
                    >
                      {issueLabel(issue)}: {issue.message}
                    </button>
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-7">
          <div className="min-w-0 space-y-7">
            {showBasedOn && (
              <BasedOnFields
                facilityId={scope.facilityId}
                form={form}
                parent={parent}
                parentScope={parentScope}
                isSlugManuallyEdited={isSlugManuallyEdited}
                onParentChange={(next, nextScope) => {
                  setParent(next);
                  setParentScope(nextScope);
                }}
                disabled={isReadOnly || isSubmitting}
              />
            )}

            <section className="space-y-4 border-b border-gray-200 pb-6">
              <h2 className="text-base font-semibold tracking-tight text-gray-900">
                {t("basic_information")}
              </h2>
              <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_180px]">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("name")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                          className="h-12 md:h-10"
                          placeholder={t("valueset_name_placeholder")}
                          onChange={(event) => {
                            field.onChange(event);
                            if (
                              initialData ||
                              form.getValues("inherited") ||
                              isSlugManuallyEdited
                            ) {
                              return;
                            }
                            form.setValue(
                              "slug",
                              generateSlug(event.target.value, SLUG_MAX),
                              {
                                shouldValidate: true,
                                shouldDirty: false,
                              },
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("slug")}</FormLabel>
                      <FormControl>
                        {/* Locked on the element, not the Controller: a
                            disabled Controller drops its value from submitted
                            data, but existing and inherited slugs must still
                            reach the backend. */}
                        <Input
                          {...field}
                          disabled={
                            isReadOnly ||
                            !!initialData ||
                            inherited ||
                            isSubmitting
                          }
                          className="h-12 font-mono text-sm md:h-10"
                          onChange={(event) => {
                            const sanitizedValue = event.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9_-]/g, "");
                            setIsSlugManuallyEdited(true);
                            form.setValue("slug", sanitizedValue, {
                              shouldValidate: true,
                              shouldDirty: true,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                      <FormDescription>
                        {initialData
                          ? t("valueset_slug_locked")
                          : inherited
                            ? t("replace_parent_slug_locked")
                            : t("slug_format_message")}
                        {isSharedSlugCheckBlocked && (
                          <span
                            className="mt-2 block"
                            role={showSharedCatalogueError ? "alert" : "status"}
                          >
                            {t(
                              showSharedCatalogueError
                                ? "valueset_slug_check_failed"
                                : "valueset_slug_checking",
                            )}
                            {showSharedCatalogueError && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="mt-2 block"
                                onClick={() => void refetchSharedCatalogue()}
                              >
                                {t("try_again")}
                              </Button>
                            )}
                          </span>
                        )}
                      </FormDescription>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel aria-required>{t("status")}</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isReadOnly || isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger
                            ref={field.ref}
                            className="w-full data-[size=default]:h-12 md:data-[size=default]:h-10"
                          >
                            <SelectValue placeholder={t("select_status")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {valuesOf(ValueSetStatus).map((status) => (
                            <SelectItem key={status} value={status}>
                              {t(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 lg:col-span-3">
                      <FormLabel>
                        {t("description")}{" "}
                        <span className="font-normal text-gray-500">
                          ({t("optional")})
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          disabled={isReadOnly || isSubmitting}
                          className="min-h-16 resize-y py-2"
                          rows={2}
                          placeholder={t("valueset_description_placeholder")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {accessControl && (
              <Card className="shadow-none">
                <CardContent className="p-4 sm:p-5">
                  {accessControl}
                </CardContent>
              </Card>
            )}

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
                    {t(
                      isDirty
                        ? "valueset_unsaved_changes"
                        : "no_changes_to_save",
                    )}
                  </p>
                )}
              </div>
              <div className="grid items-start gap-7">
                <RuleFields
                  type="include"
                  form={form}
                  disabled={isReadOnly || isSubmitting}
                  openIndex={openRules.include}
                  onOpenIndexChange={(include) =>
                    setOpenRules((current) => ({ ...current, include }))
                  }
                />
                <RuleFields
                  type="exclude"
                  form={form}
                  disabled={isReadOnly || isSubmitting}
                  openIndex={openRules.exclude}
                  onOpenIndexChange={(exclude) =>
                    setOpenRules((current) => ({ ...current, exclude }))
                  }
                />
              </div>
            </section>
          </div>

          {isReadOnly && (
            <div className="rounded-lg border border-gray-200 bg-gray-100 p-3 text-sm text-gray-700">
              {t(
                initialData?.is_system_defined
                  ? "saving_is_disabled_for_system_valuesets"
                  : "no_permission_to_edit_valueset",
              )}
            </div>
          )}
        </div>
        {!isReadOnly && (
          <div className="sticky bottom-0 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:-mx-6 sm:px-6 lg:hidden">
            <p role="status" className="text-sm text-gray-500">
              {t(isDirty ? "valueset_unsaved_changes" : "no_changes_to_save")}
            </p>
            {saveButton}
          </div>
        )}
      </form>
    </Form>
  );
}
