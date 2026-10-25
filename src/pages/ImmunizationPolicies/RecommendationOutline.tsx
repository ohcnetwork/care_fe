import { ChevronRight, Layers2, Syringe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { ImmunizationPolicyTemplate } from "@/types/emr/immunizationPolicy/immunizationPolicy";

interface RecommendationOutlineProps {
  value: ImmunizationPolicyTemplate;
  selectedPath: number[];
  onSelect: (path: number[]) => void;
  issues: readonly { path: PropertyKey[]; message: string }[];
}

export function RecommendationOutline({
  value,
  selectedPath,
  onSelect,
  issues,
}: RecommendationOutlineProps) {
  const { t } = useTranslation();

  function renderNode(node: ImmunizationPolicyTemplate, path: number[]) {
    const selected = path.join(".") === selectedPath.join(".");
    const title =
      path.length === 0
        ? t("immunization_recommendation_template")
        : t(
            node.is_group
              ? "immunization_group_number"
              : "immunization_recommendation_number",
            { number: path.at(-1)! + 1 },
          );
    const label =
      node.series ||
      node.codes[0]?.display ||
      node.codes[0]?.code ||
      (path.length === 0 ? t("immunization_template_root") : title);
    const issuePath: PropertyKey[] = [
      "policy_template",
      ...path.flatMap((index) => ["children", index]),
    ];
    const hasError = issues.some((issue) =>
      issuePath.every((part, index) => issue.path[index] === part),
    );
    const Icon = node.is_group ? Layers2 : Syringe;

    return (
      <li key={node.id ?? path.join(".")} className="min-w-0">
        <button
          type="button"
          aria-label={t("immunization_select_node", { name: title })}
          title={label}
          aria-current={selected ? "true" : undefined}
          onClick={() => onSelect(path)}
          className={cn(
            "group flex w-full items-start gap-2.5 rounded-md px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
            selected
              ? "bg-primary-50 text-primary-900 ring-1 ring-inset ring-primary-200"
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Icon
            className={cn(
              "mt-0.5 size-4 shrink-0",
              selected ? "text-primary-700" : "text-gray-400",
            )}
            aria-hidden="true"
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium">{label}</span>
            <span className="mt-0.5 block truncate text-xs text-gray-500">
              {node.is_group
                ? t("immunization_group_items", { count: node.children.length })
                : node.dose_number
                  ? t(
                      node.series_number
                        ? "immunization_dose_in_series"
                        : "immunization_dose_label",
                      {
                        number: node.dose_number,
                        total: node.series_number,
                      },
                    )
                  : t("immunization_recommendation")}
            </span>
          </span>
          {hasError && (
            <span
              className="mt-1.5 size-2 shrink-0 rounded-full bg-red-500"
              aria-label={t("error")}
            />
          )}
          {selected && (
            <ChevronRight
              className="mt-0.5 size-3.5 shrink-0 text-primary-600"
              aria-hidden="true"
            />
          )}
        </button>
        {node.is_group && node.children.length > 0 && (
          <ul className="ml-4 mt-1 space-y-1 border-l border-gray-200 pl-2">
            {node.children.map((child, index) =>
              renderNode(child, [...path, index]),
            )}
          </ul>
        )}
      </li>
    );
  }

  return (
    <nav
      aria-label={t("immunization_policy_recommendations")}
      className="min-w-0 rounded-lg border border-gray-200 bg-gray-50/70 p-3 lg:sticky lg:top-24"
    >
      <div className="px-2 pb-3 pt-1">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {t("immunization_policy_recommendations")}
        </h2>
        <p className="mt-1 text-xs leading-5 text-gray-500">
          {t("immunization_outline_hint")}
        </p>
      </div>
      <ul className="max-h-64 space-y-1 overflow-y-auto px-0.5 pb-0.5 lg:max-h-[calc(100vh-16rem)]">
        {renderNode(value, [])}
      </ul>
    </nav>
  );
}
