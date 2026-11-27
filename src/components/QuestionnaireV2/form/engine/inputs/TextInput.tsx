import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupTextarea,
} from "@/components/ui/input-group";
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
  const templates = getInsertableTemplates(question);

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
    const next =
      !value || value.endsWith("\n")
        ? `${value}${text}`
        : `${value}${separator}${text}`;
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
      if (e.key !== "/" || templates.length === 0) return;
      if (e.ctrlKey || e.metaKey || e.altKey || e.nativeEvent.isComposing) {
        return;
      }
      // A slash stays literal in text; it opens the list only on an empty
      // answer or on the fresh line after a line break.
      const { selectionStart, selectionEnd } = e.currentTarget;
      const onFreshLine =
        question.type === "text" &&
        value.endsWith("\n") &&
        selectionStart === value.length &&
        selectionEnd === value.length;
      if (value && !onFreshLine) return;
      e.preventDefault();
      setTemplatesOpen(true);
    },
  };

  if (templates.length === 0) {
    return question.type === "text" ? (
      <Textarea rows={3} ref={setInputRef} {...props} />
    ) : (
      <Input
        type={question.type === "url" ? "url" : "text"}
        ref={setInputRef}
        {...props}
      />
    );
  }

  return (
    <InputGroup>
      {question.type === "text" ? (
        <InputGroupTextarea
          rows={3}
          ref={setInputRef}
          className="resize-y flex-none"
          {...props}
        />
      ) : (
        <InputGroupInput type="text" ref={setInputRef} {...props} />
      )}
      <InputGroupAddon
        align="block-end"
        // The addon's default click-to-focus would also catch clicks that
        // bubble up from the portalled list (e.g. its search box).
        onClick={undefined}
        className="rounded-b-[calc(var(--radius-md)-1px)] border-t border-input p-0 [.border-t]:pt-0 group-has-[>input]/input-group:pb-0"
      >
        <TemplatePicker
          templates={templates}
          disabled={disabled}
          open={templatesOpen}
          onOpenChange={setTemplatesOpen}
          onInsert={handleInsertTemplate}
          returnFocusTo={inputRef}
        />
      </InputGroupAddon>
    </InputGroup>
  );
}
