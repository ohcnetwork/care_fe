import { Question } from "@/types/questionnaire/question";

export const removeQuestionsFromSource = (
  questions: Question[],
  selectedQuestionIds: Set<string>,
): Question[] => {
  return questions.map((q) => ({
    ...q,
    questions: q.questions
      ? q.questions
          .filter((subQ) => !selectedQuestionIds.has(subQ.id))
          .map((subQ) => ({
            ...subQ,
            questions: subQ.questions
              ? removeQuestionsFromSource(subQ.questions, selectedQuestionIds)
              : subQ.questions,
          }))
      : q.questions,
  }));
};

export const addQuestionsToDestination = (
  questions: Question[],
  destId: string,
  questionsToAdd: Question[],
): Question[] => {
  return questions.map((q) => {
    if (q.id === destId) {
      return {
        ...q,
        questions: [...(q.questions || []), ...questionsToAdd],
      };
    }

    if (q.questions && q.questions.length > 0) {
      return {
        ...q,
        questions: addQuestionsToDestination(
          q.questions,
          destId,
          questionsToAdd,
        ),
      };
    }
    return q;
  });
};

export const extractGroupQuestions = (questions: Question[]): Question[] => {
  return questions
    .filter((question) => question.type === "group")
    .map((question) => ({
      ...question,
      questions: question.questions
        ? extractGroupQuestions(question.questions)
        : [],
    }));
};

export const extractQuestionsByIds = (
  ids: Set<string>,
  questions: Question[],
) => {
  const result: Question[] = [];
  for (const question of questions) {
    if (ids.has(question.id)) {
      result.push(question);
    }
    if (question.questions) {
      result.push(...extractQuestionsByIds(ids, question.questions));
    }
  }
  return result;
};

export const scrollToQuestion = (linkId: string) => {
  const element = document.getElementById(`question-${linkId}`);
  if (element) {
    element.scrollIntoView();
  }
};

export const copyQuestionWithNewIds = (question: Question): Question => {
  const newQuestion = {
    ...question,
    id: crypto.randomUUID(),
    link_id: `${question.link_id}-copy-${Date.now().toString().slice(-6)}`,
    questions: question.questions
      ? question.questions.map((subQ) => copyQuestionWithNewIds(subQ))
      : [],
  };
  return newQuestion;
};
