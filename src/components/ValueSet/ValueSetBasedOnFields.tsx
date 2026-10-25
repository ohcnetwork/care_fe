import { useId, useRef } from "react";
import type { UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { ValueSetRead } from "@/types/valueSet/valueSet";

import { generateSlug } from "@/Utils/utils";

import type { ScopedValueSet } from "./useScopedValueSets";
import { SLUG_MAX, type ValueSetFormData } from "./valueSetFormTypes";
import { ValueSetParentPicker } from "./ValueSetParentPicker";

/**
 * Create-only lineage for a facility set. A parent makes the new set an
 * extension of it (the backend merges both compositions). A facility
 * customization shares the parent's slug; a separate set keeps its own.
 */
interface ValueSetBasedOnFieldsProps {
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
}

export function ValueSetBasedOnFields({
  facilityId,
  form,
  parent,
  parentScope,
  onParentChange,
  isSlugManuallyEdited,
  disabled,
}: ValueSetBasedOnFieldsProps) {
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
