import { useCallback, useState } from "react";

export function useActiveQuestion() {
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [activeSubQuestionId, setActiveSubQuestionId] = useState<string | null>(
    null,
  );

  const focusQuestion = useCallback((questionId: string) => {
    setActiveQuestionId(questionId);
    setActiveSubQuestionId(null);
  }, []);

  const focusSubQuestion = useCallback((subQuestionId: string) => {
    setActiveSubQuestionId(subQuestionId);
    setActiveQuestionId(null);
  }, []);

  return {
    activeQuestionId,
    activeSubQuestionId,
    focusQuestion,
    focusSubQuestion,
  };
}
