import { Question } from "@/types/questionnaire/question";

export const removeQuestionsFromSource = (
  questions: Question[],
  selectedQuestionIds: Set<string>,
): Question[] => {
  const newQuestions: Question[] = [];
  for (const question of questions) {
    if (selectedQuestionIds.has(question.id)) {
      selectedQuestionIds.delete(question.id);
    } else {
      newQuestions.push(question);
    }
    if (selectedQuestionIds.size > 0 && question.questions?.length) {
      question.questions = removeQuestionsFromSource(
        question.questions,
        selectedQuestionIds,
      );
    }
  }
  return newQuestions;
};

export const addQuestionsToDestination = (
  questions: Question[],
  destId: string,
  questionsToAdd: Question[],
): Question[] => {
  for (const question of questions) {
    if (question.id === destId) {
      question.questions = [...(question.questions || []), ...questionsToAdd];
      return questions;
    }
    if (question.questions?.length) {
      addQuestionsToDestination(question.questions, destId, questionsToAdd);
    }
  }
  return questions;
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
