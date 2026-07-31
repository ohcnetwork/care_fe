import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { QuestionField } from "@/components/QuestionnaireV2/renderer/QuestionField";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";
import { TopLevelCard } from "@/components/QuestionnaireV2/renderer/TopLevelCard";

import type { Question } from "@/types/questionnaire/question";

export function QuestionGroupCard({
  question,
  depth,
  disabled,
  number,
}: {
  question: Question;
  depth: number;
  disabled: boolean;
  /** Dotted ordinal matching the tree nav (e.g. "7."); children derive
   *  "7.1.", "7.2.", … from it. */
  number?: string;
}) {
  const { t } = useTranslation();
  const children = question.questions ?? [];
  const leafChildCount = children.filter(
    (child) => child.type !== "group",
  ).length;

  // styling_metadata is questionnaire-authored (it arrives via imported
  // JSON) — sanitize before splicing into className. `classes` decorates the
  // card wrapper; `containerClasses` carries the layout preset for the
  // sub-question container (the deployed contract shared with the legacy
  // editor/renderer).
  const decorationClasses = sanitizeStylingClasses(
    question.styling_metadata?.classes,
  );
  const containerClasses = sanitizeStylingClasses(
    question.styling_metadata?.containerClasses,
  );

  const childNumber = (index: number) =>
    number ? `${number}${index + 1}.` : undefined;

  if (depth === 0) {
    return (
      <TopLevelCard className={decorationClasses}>
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-900">
            {number && <span className="mr-1 tabular-nums">{number}</span>}
            {question.text}
          </h3>
          <Badge variant="outline">{t("group")}</Badge>
        </div>
        {question.description && (
          <p className="-mt-2 text-xs text-gray-500">{question.description}</p>
        )}
        <fieldset
          disabled={disabled}
          className={cn(
            "border-0 p-0",
            containerClasses ? cn("gap-4", containerClasses) : "space-y-4",
          )}
        >
          {children.map((child, index) => (
            <QuestionField
              key={child.id}
              question={child}
              depth={depth + 1}
              number={childNumber(index)}
            />
          ))}
        </fieldset>
      </TopLevelCard>
    );
  }

  // Nested group: two-tone box — the title sits in its own darker header
  // strip with a lighter inset body panel beneath it.
  return (
    <div
      className={cn(
        "overflow-hidden rounded-md border border-gray-200 bg-gray-200/60",
        decorationClasses,
      )}
    >
      <h4 className="px-3 py-1.5 text-sm font-semibold text-gray-900">
        {number && <span className="mr-1 tabular-nums">{number}</span>}
        {question.text}
      </h4>
      <fieldset
        disabled={disabled}
        className={cn(
          "m-1 gap-4 rounded border-0 bg-gray-50 p-2",
          containerClasses ??
            cn("grid sm:grid-cols-2", leafChildCount >= 3 && "sm:grid-cols-3"),
        )}
      >
        {children.map((child, index) => (
          <QuestionField
            key={child.id}
            question={child}
            depth={depth + 1}
            number={childNumber(index)}
          />
        ))}
      </fieldset>
    </div>
  );
}
