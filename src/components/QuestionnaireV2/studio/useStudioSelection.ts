import { Dispatch, useCallback, useState } from "react";

import {
  BuilderAction,
  BuilderState,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import {
  findQuestionNumber,
  findTopLevelIndex,
} from "@/components/QuestionnaireV2/shared/questionTree";

/** Inspector and reveal state, kept separate from the persisted draft. The
 * outline owns its keyboard/multi-selection behavior and calls these actions. */
export function useStudioSelection(
  state: BuilderState,
  dispatch: Dispatch<BuilderAction>,
) {
  const [inspectorTarget, setInspectorTarget] = useState<"form" | "question">(
    "question",
  );
  const [scrollRequest, setScrollRequest] = useState<{
    id: string;
    nonce: number;
  } | null>(null);
  // Creating or importing questions selects them in the reducer — the
  // inspector must follow, or it would stay on Form settings showing
  // nothing about the question that just appeared.
  const studioDispatch = useCallback<typeof dispatch>(
    (action) => {
      if (
        action.type === "addQuestion" ||
        action.type === "duplicateQuestion" ||
        action.type === "replaceAll"
      ) {
        setInspectorTarget("question");
      }
      dispatch(action);
    },
    [dispatch],
  );

  const selectQuestion = useCallback(
    (questionId: string) => {
      dispatch({ type: "select", id: questionId });
      setInspectorTarget("question");
    },
    [dispatch],
  );

  const revealQuestion = useCallback(
    (questionId: string) => {
      selectQuestion(questionId);
      setScrollRequest((previous) => ({
        id: questionId,
        nonce: (previous?.nonce ?? 0) + 1,
      }));
    },
    [selectQuestion],
  );

  const selectedQuestion = state.selectedId
    ? findQuestion(state.questions, state.selectedId)
    : undefined;
  // Form settings stands in whenever no question is selected.
  const formSelected = inspectorTarget === "form" || !selectedQuestion;
  const topLevelIndex = state.selectedId
    ? findTopLevelIndex(state.questions, state.selectedId)
    : 0;
  // The selected question's own dotted number (e.g. "3.1." for a nested
  // child) — falls back to the top-level ancestor's ordinal for questions
  // nested deeper than `findQuestionNumber` numbers (grandchildren+).
  const selectedNumber =
    (state.selectedId &&
      findQuestionNumber(state.questions, state.selectedId)) ||
    `${topLevelIndex + 1}.`;
  return {
    studioDispatch,
    setInspectorTarget,
    scrollRequest,
    selectQuestion,
    revealQuestion,
    selectedQuestion,
    selectedNumber,
    formSelected,
  };
}
