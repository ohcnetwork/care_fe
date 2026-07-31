import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { QuestionField } from "@/components/QuestionnaireV2/renderer/QuestionField";
import { sanitizeStylingClasses } from "@/components/QuestionnaireV2/renderer/sanitizeStylingClasses";

import type { Question } from "@/types/questionnaire/question";

export function QuestionGroupCard({
  question,
  depth,
  disabled,
}: {
  question: Question;
  depth: number;
  disabled: boolean;
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

  if (depth === 0) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg bg-gray-50 p-4",
          decorationClasses,
        )}
      >
        <div className="h-4 w-1 shrink-0 rounded-full bg-indigo-500" />
        <div className="min-w-0 flex-1 space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {question.text}
            </h3>
            <Badge variant="outline">{t("group")}</Badge>
          </div>
          {question.description && (
            <p className="-mt-2 text-xs text-gray-500">
              {question.description}
            </p>
          )}
          <fieldset
            disabled={disabled}
            className={cn(
              "border-0 p-0",
              containerClasses ? cn("gap-4", containerClasses) : "space-y-4",
            )}
          >
            {children.map((child) => (
              <QuestionField
                key={child.id}
                question={child}
                depth={depth + 1}
              />
            ))}
          </fieldset>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("space-y-3 rounded-md bg-gray-100 p-4", decorationClasses)}
    >
      <h4 className="text-sm font-bold text-gray-900">{question.text}</h4>
      <fieldset
        disabled={disabled}
        className={cn(
          "gap-4 border-0 p-0",
          containerClasses ??
            cn("grid sm:grid-cols-2", leafChildCount >= 3 && "sm:grid-cols-3"),
        )}
      >
        {children.map((child) => (
          <QuestionField key={child.id} question={child} depth={depth + 1} />
        ))}
      </fieldset>
    </div>
  );
}
