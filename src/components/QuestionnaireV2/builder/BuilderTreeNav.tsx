import { Plus } from "lucide-react";
import { Dispatch } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";
import { QuestionTreeNav } from "@/components/QuestionnaireV2/shared/QuestionTreeNav";

import { Question } from "@/types/questionnaire/question";

interface BuilderTreeNavProps {
  title?: string;
  questions: Question[];
  selectedId: string | null;
  dispatch: Dispatch<BuilderAction>;
}

/**
 * Builder-flavored wrapper around the shared `QuestionTreeNav`: adds the
 * insert-between "+" separators and the trailing "add new question" footer,
 * both of which only make sense while editing (the read-only renderer's tree
 * nav has neither).
 */
export function BuilderTreeNav({
  title,
  questions,
  selectedId,
  dispatch,
}: BuilderTreeNavProps) {
  const { t } = useTranslation();

  return (
    <QuestionTreeNav
      title={title}
      questions={questions}
      activeId={selectedId}
      onSelect={(id) => dispatch({ type: "select", id })}
      renderSeparator={(afterIndex) => (
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
      )}
      footer={
        <Button
          type="button"
          variant="link"
          className="w-full justify-start px-3 underline"
          onClick={() => dispatch({ type: "addQuestion", parentId: null })}
        >
          {t("add_new_question")}
        </Button>
      }
    />
  );
}
