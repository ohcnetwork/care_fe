import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { TemplatePicker } from "@/components/QuestionnaireV2/form/engine/inputs/TemplatePicker";
import { getInsertableTemplates } from "@/components/QuestionnaireV2/form/engine/inputs/insertableTemplates";
import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { replaceEntryAt } from "./withEntryAt";

export function TextInput({
  question,
  disabled,
  inputId,
  errorId,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const setInputRef = (
    element: HTMLInputElement | HTMLTextAreaElement | null,
  ) => {
    inputRef.current = element;
  };
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = (entry?.type === "string" ? entry.value : undefined) ?? "";
  const templates = getInsertableTemplates(question, valueIndex);

  const handleChange = (next: string) => {
    updateResponse({
      values: replaceEntryAt(
        response?.values,
        valueIndex,
        { type: "string", value: next },
        !next,
      ),
    });
  };

  const handleInsertTemplate = (content: string, keepOpen: boolean) => {
    // A single-line input cannot hold line breaks.
    const isSingleLine = question.type === "string";
    const text = isSingleLine ? content.replace(/[\r\n]+/g, " ") : content;
    const separator = isSingleLine ? " " : "\n";
    const next = value ? `${value}${separator}${text}` : text;
    if (
      question.max_length !== undefined &&
      next.length > question.max_length
    ) {
      toast.error(
        t("maximum_characters_allowed", { count: question.max_length }),
      );
      return;
    }
    handleChange(next);
    if (!keepOpen) setTemplatesOpen(false);
  };

  const props = {
    id: inputId,
    value,
    disabled,
    "aria-required": question.required || undefined,
    "aria-describedby": errorId,
    "aria-invalid": !!errorId || undefined,
    placeholder: t(
      templates.length
        ? "enter_response_type_slash_for_templates"
        : "enter_details",
    ),
    maxLength: question.max_length,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(e.target.value),
    onKeyDown: (
      e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (e.key === "/" && !value && templates.length > 0) {
        e.preventDefault();
        setTemplatesOpen(true);
      }
    },
  };

  // With templates the input drops its own border: the box below owns it.
  const boxedClassName =
    templates.length > 0
      ? "rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 aria-invalid:ring-0"
      : undefined;

  const input =
    question.type === "text" ? (
      <Textarea
        rows={3}
        ref={setInputRef}
        className={boxedClassName}
        {...props}
      />
    ) : (
      <Input
        type={question.type === "url" ? "url" : "text"}
        ref={setInputRef}
        className={boxedClassName}
        {...props}
      />
    );

  if (templates.length === 0) return input;

  return (
    <div className="overflow-hidden rounded-md border border-input shadow-2xs has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-3 has-[input:focus-visible]:ring-ring/50 has-[textarea:focus-visible]:border-ring has-[textarea:focus-visible]:ring-3 has-[textarea:focus-visible]:ring-ring/50 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20">
      {input}
      <div className="rounded-b-[calc(var(--radius-md)-1px)] border-t border-input bg-soft-background">
        <TemplatePicker
          templates={templates}
          disabled={disabled}
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          onInsert={handleInsertTemplate}
          returnFocusTo={inputRef}
        />
      </div>
    </div>
  );
}
