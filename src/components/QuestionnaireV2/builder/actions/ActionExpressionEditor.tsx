import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import {
  compileRef,
  lintExpression,
} from "@/components/QuestionnaireV2/shared/actionExpression";

import {
  ActionVariableSources,
  contextValueLabel,
  questionLabel,
} from "./labels";

interface ActionExpressionEditorProps {
  idPrefix: string;
  condition: string;
  sources: ActionVariableSources;
  canUseRules: boolean;
  showCustomExpressionNote: boolean;
  onChange: (condition: string) => void;
  onBackToConditions: () => void;
  onReplaceCondition: () => void;
}

/** Expression editing is independent of the row builder: it owns caret
 * insertion and asks before replacing a non-canonical expression. */
export function ActionExpressionEditor({
  idPrefix,
  condition,
  sources,
  canUseRules,
  showCustomExpressionNote,
  onChange,
  onBackToConditions,
  onReplaceCondition,
}: ActionExpressionEditorProps) {
  const { t } = useTranslation();
  const [confirmReplace, setConfirmReplace] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expressionError = lintExpression(condition);
  const expressionErrorKey =
    condition.trim() === ""
      ? "action_issue_condition_empty"
      : expressionError === "syntax"
        ? "action_issue_expression_syntax"
        : expressionError === "attribute"
          ? "action_issue_expression_attribute"
          : undefined;

  const insertAtCaret = (text: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? condition.length;
    const end = element?.selectionEnd ?? start;
    onChange(condition.slice(0, start) + text + condition.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const chips = [
    ...sources.questions
      .filter((entry) => !entry.unusable)
      .map((entry) => ({
        key: entry.question.id,
        label: questionLabel(entry.question, t),
        insert: compileRef(entry.ref),
      })),
    ...sources.contextValues.map((entry) => ({
      key: entry.ref,
      label: contextValueLabel(entry),
      insert: compileRef(entry.ref),
    })),
  ];
  return (
    <div className="space-y-2">
      <Textarea
        ref={textareaRef}
        id={`${idPrefix}-expression`}
        aria-label={t("action_expression")}
        aria-invalid={!!expressionErrorKey}
        aria-describedby={
          expressionErrorKey ? `${idPrefix}-expression-error` : undefined
        }
        className="font-mono text-xs"
        rows={3}
        value={condition}
        onChange={(e) => onChange(e.target.value)}
      />
      {expressionErrorKey && (
        <p id={`${idPrefix}-expression-error`} className="text-xs text-red-600">
          {t(expressionErrorKey)}
        </p>
      )}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => insertAtCaret(chip.insert)}
              className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 hover:border-primary-300 hover:text-primary-800"
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">{t("action_expression_help")}</p>
      {showCustomExpressionNote && (
        <p className="text-xs text-gray-500">
          {t("action_custom_expression_note")}
        </p>
      )}
      {confirmReplace ? (
        <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p>{t("action_replace_expression_confirm")}</p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setConfirmReplace(false);
                onReplaceCondition();
              }}
            >
              {t("action_replace_expression")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmReplace(false)}
            >
              {t("action_keep_expression")}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => {
            if (canUseRules) onBackToConditions();
            else setConfirmReplace(true);
          }}
        >
          {t("action_back_to_conditions")}
        </Button>
      )}
    </div>
  );
}
