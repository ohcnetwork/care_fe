import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { flattenNumberedQuestions } from "@/components/QuestionnaireV2/shared/questionTree";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Question } from "@/types/questionnaire/question";

interface StudioMobileQuestionNavProps {
  questions: Question[];
  selectedId: string | null;
  onSelectQuestion: (questionId: string) => void;
  onAddQuestion: () => void;
}

/** The outline's navigation and add affordance when the sidebars are hidden. */
export function StudioMobileQuestionNav({
  questions,
  selectedId,
  onSelectQuestion,
  onAddQuestion,
}: StudioMobileQuestionNavProps) {
  const { t } = useTranslation();
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-3 py-2 md:hidden">
      <div className="min-w-0 flex-1">
        <Select
          value={selectedId ?? undefined}
          onValueChange={onSelectQuestion}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("select_question")} />
          </SelectTrigger>
          <SelectContent>
            {flattenNumberedQuestions(questions).map(({ question, number }) => (
              <SelectItem key={question.id} value={question.id}>
                {number} {question.text || t("untitled_question")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* The sidebars and canvas append zones are hidden on phones,
          so mobile authors need their own add-question button. */}
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="shrink-0"
        aria-label={t("add_new_question")}
        onClick={onAddQuestion}
      >
        <Plus className="size-4" />
      </Button>
    </div>
  );
}
