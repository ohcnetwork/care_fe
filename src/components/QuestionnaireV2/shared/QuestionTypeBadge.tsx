import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { cn } from "@/lib/utils";

import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { QuestionType } from "@/types/questionnaire/question";

const TYPE_CLASSES: Partial<Record<QuestionType, string>> = {
  group: "bg-purple-100 text-purple-800",
  string: "bg-sky-100 text-sky-800",
  text: "bg-pink-100 text-pink-800",
  choice: "bg-yellow-100 text-yellow-800",
  dateTime: "bg-orange-100 text-orange-800",
  date: "bg-amber-100 text-amber-800",
  boolean: "bg-teal-100 text-teal-800",
  decimal: "bg-lime-100 text-lime-800",
  integer: "bg-lime-100 text-lime-800",
  structured: "bg-indigo-100 text-indigo-800",
};

export function QuestionTypeBadge({
  type,
  structuredType,
}: {
  type: QuestionType;
  /** Names the concrete structured type ("Medication Request") instead of
   *  the generic "Structured" when the question carries one. */
  structuredType?: StructuredQuestionType;
}) {
  const { t } = useTranslation();
  return (
    <Badge
      variant="secondary"
      className={cn(
        "font-normal",
        TYPE_CLASSES[type] ?? "bg-gray-100 text-gray-700",
      )}
    >
      {type === "structured" && structuredType
        ? t(`structured_type__${structuredType}`)
        : t(`question_type__${type}`)}
    </Badge>
  );
}
