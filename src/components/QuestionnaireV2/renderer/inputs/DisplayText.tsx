import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";

export function DisplayText({ question }: RendererInputProps) {
  return <p className="text-sm text-gray-500">{question.text}</p>;
}
