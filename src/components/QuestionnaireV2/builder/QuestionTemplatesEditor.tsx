import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { useEditorRowKeys } from "@/components/QuestionnaireV2/builder/useEditorRowKeys";

import { Question, TemplateConfig } from "@/types/questionnaire/question";

interface QuestionTemplatesEditorProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

/** Reusable response snippets a user can insert into a text answer. */
export function QuestionTemplatesEditor({
  question,
  onChange,
}: QuestionTemplatesEditorProps) {
  const { t } = useTranslation();
  const templates = question.templates ?? [];
  const { rowKeys, removeRowKey } = useEditorRowKeys(
    question.id,
    templates.length,
  );
  // Only a freshly added row mounts after the editor does, so this focuses it.
  const [addedIndex, setAddedIndex] = useState<number>();

  const updateTemplate = (index: number, patch: Partial<TemplateConfig>) =>
    onChange({
      templates: templates.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });

  const addTemplate = () => {
    setAddedIndex(templates.length);
    onChange({ templates: [...templates, { name: "", content: "" }] });
  };

  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <span className="block text-xs font-medium text-gray-600">
          {t("templates")}
        </span>
        <p className="text-sm text-gray-500">{t("question_templates_hint")}</p>
      </div>

      {templates.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-soft-background">
          {templates.map((template, index) => {
            const nameId = `template-name-${question.id}-${rowKeys[index]}`;
            const contentId = `template-content-${question.id}-${rowKeys[index]}`;
            return (
              <li key={rowKeys[index]} className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    {t("template")} {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-red-600"
                    aria-label={`${t("remove")}: ${template.name || `${t("template")} ${index + 1}`}`}
                    onClick={() => {
                      removeRowKey(index);
                      onChange({
                        templates: templates.filter((_, i) => i !== index),
                      });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Label htmlFor={nameId} className="sr-only">
                  {t("template_name")}
                </Label>
                <Input
                  id={nameId}
                  className="bg-white font-medium"
                  value={template.name}
                  placeholder={t("template_name")}
                  autoFocus={index === addedIndex}
                  onChange={(event) =>
                    updateTemplate(index, { name: event.target.value })
                  }
                />
                <Label htmlFor={contentId} className="sr-only">
                  {t("content")}
                </Label>
                <Textarea
                  id={contentId}
                  value={template.content}
                  placeholder={t("template_content_placeholder")}
                  onChange={(event) =>
                    updateTemplate(index, { content: event.target.value })
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      <Button type="button" variant="outline" size="sm" onClick={addTemplate}>
        <Plus className="size-4" />
        {t("add_template")}
      </Button>
    </div>
  );
}
