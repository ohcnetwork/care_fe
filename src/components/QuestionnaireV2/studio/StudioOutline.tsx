import { Plus, Search, Settings2 } from "lucide-react";
import { Dispatch, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { cn } from "@/lib/utils";

import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import { useHiddenQuestionIds } from "@/components/QuestionnaireV2/form/FormContext";
import { QuestionTreeNav } from "@/components/QuestionnaireV2/shared/QuestionTreeNav";

import { Question } from "@/types/questionnaire/question";

import { searchHiddenIds } from "./outlineSearch";

export interface StudioOutlineProps {
  questions: Question[];
  editing: boolean;
  selectedId: string | null;
  formSelected: boolean;
  onSelectForm: () => void;
  onSelectQuestion: (id: string) => void;
  dispatch: Dispatch<BuilderAction>;
}

/**
 * The left pane: search, the Form settings row, and the question tree (the
 * page's single `role="navigation"` landmark). In preview mode the tree
 * drops enable_when-hidden questions live (same store as the canvas); in
 * edit mode every question stays reachable. Must render inside the page's
 * `QuestionnaireFormProvider`.
 */
export function StudioOutline({
  questions,
  editing,
  selectedId,
  formSelected,
  onSelectForm,
  onSelectQuestion,
  dispatch,
}: StudioOutlineProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const filtering = query.trim().length > 0;

  const logicHiddenIds = useHiddenQuestionIds();
  const queryHiddenIds = searchHiddenIds(questions, query);
  const hiddenIds = editing
    ? queryHiddenIds
    : new Set([...logicHiddenIds, ...queryHiddenIds]);

  // Judged against the query filter alone — in preview a top-level question
  // hidden by enable_when must not make a matching search read as "no
  // matches".
  const noMatches =
    filtering &&
    questions.length > 0 &&
    questions.every((question) => queryHiddenIds.has(question.id));

  return (
    <div className="flex flex-col gap-2">
      {questions.length > 0 && (
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("find_a_question")}
            className="pl-8"
          />
        </div>
      )}

      {editing && (
        <button
          type="button"
          onClick={onSelectForm}
          className={cn(
            "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium",
            formSelected
              ? "bg-gray-100 text-gray-900"
              : "text-gray-700 hover:bg-gray-50",
          )}
        >
          <Settings2 aria-hidden className="size-4 text-gray-500" />
          {t("form_settings")}
        </button>
      )}

      {noMatches && (
        <p className="px-3 py-6 text-center text-sm text-gray-500">
          {t("no_question_matches_search")}
        </p>
      )}
      {/* The nav stays mounted through a no-match search so the footer's
          add affordances remain reachable (rows are all hidden anyway). */}
      <QuestionTreeNav
        questions={questions}
        activeId={formSelected ? null : selectedId}
        onSelect={onSelectQuestion}
        hiddenIds={hiddenIds}
        renderSeparator={
          // Hidden while a search filter is active: the separator index is
          // positional in the FILTERED row list, so an insert-at-index
          // would land somewhere else in the real tree.
          editing && !filtering
            ? (afterIndex) => (
                <button
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: "addQuestion",
                      parentId: null,
                      index: afterIndex + 1,
                    })
                  }
                  aria-label={t("add_new_question")}
                  className="absolute left-1/2 top-1/2 flex size-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-400 shadow-sm hover:border-primary-300 hover:text-primary-700"
                >
                  <Plus className="size-3.5" />
                </button>
              )
            : undefined
        }
        footer={
          editing ? (
            <div className="mt-1 space-y-1 border-t border-gray-100 pt-2">
              <Button
                type="button"
                variant="link"
                className="w-full justify-start px-3 underline"
                onClick={() =>
                  dispatch({ type: "addQuestion", parentId: null })
                }
              >
                {t("add_new_question")}
              </Button>
              <Button
                type="button"
                variant="link"
                className="w-full justify-start px-3 text-gray-600 underline"
                onClick={() =>
                  dispatch({
                    type: "addQuestion",
                    parentId: null,
                    template: { type: "group" },
                  })
                }
              >
                {t("add_section")}
              </Button>
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
