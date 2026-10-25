import { TFunction } from "i18next";
import { z } from "zod";

import { ImmunizationPolicyTemplate } from "@/types/emr/immunizationPolicy/immunizationPolicy";

export function newPolicyTemplate(isGroup = false): ImmunizationPolicyTemplate {
  return {
    codes: [],
    is_group: isGroup,
    children: [],
  };
}

export function policySchema(t: TFunction) {
  const coding = z.object({
    system: z.string().nullable().optional(),
    code: z.string(),
    display: z.string().nullable().optional(),
    version: z.string().nullable().optional(),
  });
  const offset = z.number().int(t("immunization_offset_integer")).optional();
  const template: z.ZodType<
    ImmunizationPolicyTemplate,
    ImmunizationPolicyTemplate
  > = z.lazy(() =>
    z
      .object({
        id: z.string().nullable().optional(),
        codes: z.array(coding).min(1, t("immunization_codes_required")),
        diseases: z.array(coding).optional(),
        is_group: z.boolean(),
        children: z.array(template),
        description: z.string().optional(),
        series: z.string().optional(),
        dose_number: z.string().optional(),
        series_number: z.string().optional(),
        earliest_date: offset,
        due_date: offset,
        overdue_date: offset,
      })
      .superRefine((node, context) => {
        if (!node.is_group && node.children.length > 0) {
          context.addIssue({
            code: "custom",
            path: ["is_group"],
            message: t("immunization_only_groups_have_children"),
          });
        }
        const dates = ["earliest_date", "due_date", "overdue_date"] as const;
        let previous: number | undefined;
        for (const field of dates) {
          const value = node[field];
          if (value === undefined) continue;
          if (previous !== undefined && previous >= value) {
            context.addIssue({
              code: "custom",
              path: [field],
              message: t("immunization_offsets_order"),
            });
          }
          previous = value;
        }
      }),
  );

  return z.object({
    name: z.string().trim().min(1, t("field_required")).max(255),
    description: z.string(),
    policy_template: template,
  });
}

/** Optional database fields may arrive as null; optional writes use omission. */
export function normalizePolicyTemplate(
  template: ImmunizationPolicyTemplate,
): ImmunizationPolicyTemplate {
  return {
    id: template.id,
    codes: template.codes,
    is_group: template.is_group,
    children: (template.children ?? []).map(normalizePolicyTemplate),
    diseases: template.diseases ?? [],
    description: template.description ?? "",
    series: template.series ?? "",
    dose_number: template.dose_number ?? "",
    series_number: template.series_number ?? "",
    earliest_date: template.earliest_date ?? undefined,
    due_date: template.due_date ?? undefined,
    overdue_date: template.overdue_date ?? undefined,
  };
}
