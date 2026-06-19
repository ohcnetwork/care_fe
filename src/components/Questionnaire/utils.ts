import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

/**
 * Initializes default responses for a group of questions.
 * Used by both QuestionnaireForm (for top-level init) and
 * RepeatableGroupRenderer (for adding new instances).
 */
export function initializeGroupResponses(
  questions: Question[],
): QuestionnaireResponse[] {
  const responses: QuestionnaireResponse[] = [];
  for (const q of questions) {
    if (q.type === "group" && q.questions) {
      if (q.repeats) {
        responses.push({
          question_id: q.id,
          link_id: q.link_id,
          values: [],
          structured_type: null,
          sub_results: [initializeGroupResponses(q.questions)],
        });
      } else {
        responses.push(...initializeGroupResponses(q.questions));
      }
    } else {
      let defaultValues: ResponseValue[] = [];
      if (q.answer_option && q.answer_option.length > 0) {
        const defaultOptions = q.answer_option.filter(
          (o) => o.initial_selected === true,
        );
        if (defaultOptions.length > 0) {
          defaultValues = defaultOptions.map((opt) => ({
            type: "string",
            value: opt.value,
            coding: opt.code ?? undefined,
          }));
        }
      }
      responses.push({
        question_id: q.id,
        link_id: q.link_id,
        values: defaultValues,
        structured_type: q.structured_type ?? null,
      });
    }
  }
  return responses;
}

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

/**
 * Recursively checks if any question in the tree has type "structured".
 * Traverses into "group" type questions to check nested questions.
 */
export function hasStructuredQuestion(questions?: Question[]): boolean {
  if (!questions) return false;
  return questions.some(
    (q) =>
      q.type === "structured" ||
      (q.type === "group" && hasStructuredQuestion(q.questions)),
  );
}
