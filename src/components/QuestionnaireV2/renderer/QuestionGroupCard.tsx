import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { QuestionField } from "@/components/QuestionnaireV2/renderer/QuestionField";

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

  if (depth === 0) {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-lg bg-gray-50 p-4",
          question.styling_metadata?.classes,
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
          <fieldset disabled={disabled} className="space-y-4 border-0 p-0">
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
      className={cn(
        "space-y-3 rounded-md bg-gray-100 p-4",
        question.styling_metadata?.classes,
      )}
    >
      <h4 className="text-sm font-bold text-gray-900">{question.text}</h4>
      <fieldset
        disabled={disabled}
        className={cn(
          "grid gap-4 border-0 p-0 sm:grid-cols-2",
          leafChildCount >= 3 && "sm:grid-cols-3",
        )}
      >
        {children.map((child) => (
          <QuestionField key={child.id} question={child} depth={depth + 1} />
        ))}
      </fieldset>
    </div>
  );
}
