import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  GripVertical,
  ListChecks,
  Plus,
  SquarePen,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { QuestionTypeBadge } from "@/components/QuestionnaireV2/shared/QuestionTypeBadge";

import { Question } from "@/types/questionnaire/question";

interface QuestionOverviewListProps {
  questions: Question[];
  isSaving: boolean;
  /** When false, every mutation affordance (edit/import/reorder) is hidden. */
  canWrite: boolean;
  onReorder: (from: number, to: number) => void;
  onEditQuestions: () => void;
  onImportQuestions: () => void;
}

export function QuestionOverviewList({
  questions,
  isSaving,
  canWrite,
  onReorder,
  onEditQuestions,
  onImportQuestions,
}: QuestionOverviewListProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900">
          {t("questions")}
        </h3>
        {canWrite && (
          <Button
            // Rendered inside the detail page's <form> — without an explicit
            // type this would double as a submit button and fire a PUT.
            type="button"
            variant="outline"
            size="sm"
            onClick={onEditQuestions}
          >
            <SquarePen className="mr-2 size-4" />
            {t("edit_questions")}
          </Button>
        )}
      </div>

      {questions.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
            <ListChecks className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-900">
              {t("no_questions_added_yet")}
            </p>
            <p className="text-sm text-gray-500">
              {t("import_questions_hint")}
            </p>
          </div>
          {canWrite && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button
                type="button"
                variant="outline_primary"
                onClick={onEditQuestions}
              >
                <Plus className="size-4" />
                {t("add_first_question")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onImportQuestions}
              >
                <Upload className="size-4" />
                {t("import_questions")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => {
            const subQuestions = question.questions ?? [];
            const isExpanded = expanded.has(question.id);

            return (
              <div
                key={question.id}
                className="flex items-stretch gap-2 rounded-md bg-gray-50 p-2"
              >
                <div className="flex items-center px-1 text-gray-400">
                  <GripVertical className="size-4" />
                </div>
                <div className="flex-1 rounded-md border border-gray-200 bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-gray-500">{index + 1}.</span>
                    <span className="text-sm font-medium text-gray-900">
                      {question.text}
                    </span>
                    <QuestionTypeBadge type={question.type} />
                    {subQuestions.length > 0 && (
                      <>
                        <Badge variant="secondary">
                          {t("sub_questions_count", {
                            count: subQuestions.length,
                          })}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          onClick={() => toggleExpanded(question.id)}
                          aria-label={t("toggle_sub_questions")}
                        >
                          <ChevronsUpDown className="size-4" />
                        </Button>
                      </>
                    )}
                    {canWrite && (
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          disabled={index === 0 || isSaving}
                          onClick={() => onReorder(index, index - 1)}
                          aria-label={t("move_up")}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          disabled={index === questions.length - 1 || isSaving}
                          onClick={() => onReorder(index, index + 1)}
                          aria-label={t("move_down")}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {isExpanded && subQuestions.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-gray-100 pl-4 pt-2">
                      {subQuestions.map((child) => (
                        <p key={child.id} className="text-sm text-gray-600">
                          {child.text}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
