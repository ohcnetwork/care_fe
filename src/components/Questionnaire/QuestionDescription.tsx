import type { Question } from "@/types/questionnaire/question";

export function QuestionDescription({
  question: { description },
}: {
  question: Question;
}) {
  if (!description) {
    return null;
  }

  return (
    <p className="text-sm text-gray-500 whitespace-pre-wrap">{description}</p>
  );
}
