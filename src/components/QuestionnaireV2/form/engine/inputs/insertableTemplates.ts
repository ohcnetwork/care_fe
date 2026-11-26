import type { Question, TemplateConfig } from "@/types/questionnaire/question";

/** Complete templates a text answer can insert; urls and extra repeats get none. */
export function getInsertableTemplates(
  question: Question,
  valueIndex?: number,
): TemplateConfig[] {
  if (question.type === "url" || valueIndex) return [];
  return (question.templates ?? []).filter(
    (template) => template.name.trim() && template.content.trim(),
  );
}
