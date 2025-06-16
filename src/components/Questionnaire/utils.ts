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

export const extractQuestionById = (
  ids: Set<string>,
  questions: Question[],
) => {
  const result: Question[] = [];
  for (const question of questions) {
    if (ids.has(question.id)) {
      result.push(question);
    }
    if (question.questions) {
      result.push(...extractQuestionById(ids, question.questions));
    }
  }
  return result;
};

export const scrollToQuestion = (id: string) => {
  const element = document.getElementById(`question-${id}`);
  if (element) {
    element.scrollIntoView();
  }
};
