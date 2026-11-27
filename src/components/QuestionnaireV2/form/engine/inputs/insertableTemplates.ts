import type { Question, TemplateConfig } from "@/types/questionnaire/question";

/** Complete templates a text answer can insert; urls get none. */
export function getInsertableTemplates(question: Question): TemplateConfig[] {
  if (question.type === "url") return [];
  return (question.templates ?? []).filter(
    (template) => template.name.trim() && template.content.trim(),
  );
}
