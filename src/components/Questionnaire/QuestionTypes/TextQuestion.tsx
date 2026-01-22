import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { TemplateSelector } from "@/components/Questionnaire/QuestionTypes/TemplateSelector";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface TextQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  index: number;
}

export function TextQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  index,
}: TextQuestionProps) {
  const { t } = useTranslation();
  const [notesOpen, setNotesOpen] = useState(false);
  const [templateSelectorOpen, setTemplateSelectorOpen] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  const handleChange = useCallback(
    (value: string) => {
      clearError();
      const newValues = [...questionnaireResponse.values];
      newValues[index] = {
        type: "string",
        value,
      };

      updateQuestionnaireResponseCB(
        newValues,
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );
    },
    [
      clearError,
      questionnaireResponse.values,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
      index,
      updateQuestionnaireResponseCB,
    ],
  );

  const handleAddTemplates = useCallback(
    (contents: string[]) => {
      clearError();
      const currentValue =
        questionnaireResponse.values[0]?.value?.toString() || "";
      const appendedContent = contents.join("\n");
      const newValue = currentValue
        ? `${currentValue}\n${appendedContent}`
        : appendedContent;

      const newValues = [...questionnaireResponse.values];
      newValues[0] = {
        type: "string",
        value: newValue,
      };

      updateQuestionnaireResponseCB(
        newValues,
        questionnaireResponse.question_id,
        questionnaireResponse.note,
      );

      // Refocus the input after template insertion
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    },
    [
      clearError,
      questionnaireResponse.values,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
      updateQuestionnaireResponseCB,
    ],
  );

  const handleUpdateNote = useCallback(
    (note: string) => {
      updateQuestionnaireResponseCB(
        questionnaireResponse.values,
        questionnaireResponse.question_id,
        note,
      );
    },
    [
      questionnaireResponse.values,
      questionnaireResponse.question_id,
      updateQuestionnaireResponseCB,
    ],
  );

  const hasTemplates = index === 0 && question.templates;
  const notes = questionnaireResponse.note || "";
  const hasNotes = notes.length > 0;
  const isTextarea = question.type === "text";

  const currentValue =
    questionnaireResponse.values[index]?.value?.toString() || "";

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      // Open template selector when "/" is typed as the first character (empty input)
      if (
        e.key === "/" &&
        hasTemplates &&
        !templateSelectorOpen &&
        currentValue === ""
      ) {
        e.preventDefault();
        setTemplateSelectorOpen(true);
      }
    },
    [hasTemplates, templateSelectorOpen, currentValue],
  );

  // Unified container for all text/string questions
  return (
    <div
      className={cn(
        "flex flex-col",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Input area with notes button */}
      <div className="flex items-stretch">
        <div
          className={cn(
            "flex-1 bg-white border border-gray-300 border-r-0",
            hasTemplates ? "rounded-tl-md" : "rounded-l-md",
          )}
        >
          {isTextarea ? (
            <Textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasTemplates
                  ? t("enter_response_type_slash_for_templates")
                  : undefined
              }
              className={cn(
                "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                hasTemplates ? "rounded-tl-md" : "rounded-l-md",
              )}
              disabled={disabled}
            />
          ) : (
            <Input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={currentValue}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                hasTemplates
                  ? t("enter_response_type_slash_for_templates")
                  : undefined
              }
              className={cn(
                "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                hasTemplates ? "rounded-tl-md" : "rounded-l-md",
              )}
              disabled={disabled}
            />
          )}
        </div>
        {/* Notes button - inside the input container on the right */}
        <Popover open={notesOpen} onOpenChange={setNotesOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className={cn(
                "flex items-center justify-center w-10 border border-gray-300 bg-gray-100/20",
                hasTemplates ? "rounded-tr-md" : "rounded-r-md",
                hasNotes && "bg-orange-50",
              )}
            >
              <CareIcon
                icon={hasNotes ? "l-notes" : "l-file-medical-alt"}
                className={cn(
                  "size-4",
                  hasNotes ? "text-orange-600" : "text-gray-500",
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-72 bg-orange-50 border border-orange-200 shadow-lg p-2"
            align="end"
          >
            <Textarea
              value={notes}
              onChange={(e) => handleUpdateNote(e.target.value)}
              className="bg-white border-orange-200 focus-visible:border-orange-300 focus-visible:ring-orange-300"
              placeholder={t("add_notes")}
              disabled={disabled}
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Insert Template section - only shown when templates exist */}
      {hasTemplates && (
        <div className="bg-gray-50/10 border border-t-0 border-gray-300 rounded-bl-md rounded-br-md">
          <TemplateSelector
            templates={question.templates!}
            onAddTemplates={handleAddTemplates}
            disabled={disabled}
            open={templateSelectorOpen}
            onOpenChange={setTemplateSelectorOpen}
          />
        </div>
      )}
    </div>
  );
}
