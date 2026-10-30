import { Variable, X } from "lucide-react";
import { Fragment, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import {
  compileMessageTemplate,
  compileTemplate,
  messageToken,
  parseMessageTemplate,
  parseTemplate,
} from "@/components/QuestionnaireV2/shared/actionExpression";

import { questionOfRef } from "@/components/QuestionnaireV2/builder/actionVariables";

import {
  ActionVariableSources,
  contextValueLabel,
  numberedQuestionLabel,
  questionLabel,
} from "./labels";

interface ParamValueInputProps {
  id: string;
  kind: "string" | "number";
  value: unknown;
  onChange: (value: unknown) => void;
  sources: ActionVariableSources;
  "aria-label": string;
}

/** The "Insert an answer…" menu: every usable answer, every context value,
 *  and the custom-expression escape hatch. `onPick` receives the ref. */
function VariableSourceMenu({
  sources,
  onPick,
  onCustomExpression,
}: {
  sources: ActionVariableSources;
  onPick: (ref: string) => void;
  onCustomExpression: () => void;
}) {
  const { t } = useTranslation();
  const questions = sources.questions.filter((entry) => !entry.unusable);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={t("action_param_insert_value")}
        >
          <Variable className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-64 overflow-y-auto"
      >
        {questions.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {t("action_field_group_answers")}
            </DropdownMenuLabel>
            {questions.map((entry) => (
              <DropdownMenuItem
                key={entry.question.id}
                onSelect={() => onPick(entry.ref)}
              >
                <span className="truncate">
                  {numberedQuestionLabel(entry.question, sources.numbers, t)}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        {sources.contextValues.length > 0 && (
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {t("action_field_group_context")}
            </DropdownMenuLabel>
            {sources.contextValues.map((entry) => (
              <DropdownMenuItem
                key={entry.ref}
                onSelect={() => onPick(entry.ref)}
              >
                {contextValueLabel(entry)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        {(questions.length > 0 || sources.contextValues.length > 0) && (
          <DropdownMenuSeparator />
        )}
        <DropdownMenuItem onSelect={onCustomExpression}>
          {t("action_param_custom_expression")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Number entry that commits only what parses — a controlled number input
 *  fed straight from the stored value would rewrite "0." to "0"
 *  mid-keystroke (see `NumericAnswerInput` in VisibilityConditionsCard). */
function NumberLiteralInput({
  id,
  value,
  onChange,
  ...rest
}: {
  id: string;
  value: unknown;
  onChange: (value: number | undefined) => void;
  "aria-label": string;
}) {
  const [buffer, setBuffer] = useState<string | null>(null);
  return (
    <Input
      id={id}
      type="number"
      value={buffer ?? (typeof value === "number" ? String(value) : "")}
      onChange={(e) => {
        setBuffer(e.target.value);
        if (e.target.value === "") onChange(undefined);
        else if (!Number.isNaN(e.target.valueAsNumber)) {
          onChange(e.target.valueAsNumber);
        }
      }}
      onBlur={() => setBuffer(null)}
      {...rest}
    />
  );
}

/** A raw `{{ … }}` expression — for whatever the token editor can't show. */
function ExpressionInput({
  id,
  expression,
  onChange,
  onClear,
  "aria-label": ariaLabel,
}: {
  id: string;
  expression: string;
  onChange: (expression: string) => void;
  onClear: () => void;
  "aria-label": string;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          id={id}
          aria-label={ariaLabel}
          className="font-mono text-xs"
          value={expression}
          placeholder={t("action_expression_placeholder")}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={t("action_param_clear_source")}
          onClick={onClear}
        >
          <X className="size-4" />
        </Button>
      </div>
      <p className="text-xs text-gray-500">{t("action_expression_help")}</p>
    </div>
  );
}

/** The message with each token shown as the thing it stands for —
 *  "Fever, temp [Temperature]". */
function MessagePreview({
  text,
  sources,
}: {
  text: string;
  sources: ActionVariableSources;
}) {
  const { t } = useTranslation();
  const parts = text.split(
    /(\{[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*\})/g,
  );
  if (parts.length < 3) return null;
  return (
    <p className="text-xs text-gray-500">
      {t("action_param_preview")}{" "}
      {parts.map((part, index) => {
        if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
        const ref = part.slice(1, -1);
        const question = questionOfRef(ref, sources.questions);
        const contextValue = sources.contextValues.find((v) => v.ref === ref);
        return (
          <span
            key={index}
            className="rounded bg-primary-50 px-1 font-medium text-primary-800"
          >
            {question
              ? questionLabel(question.question, t)
              : contextValue
                ? contextValueLabel(contextValue)
                : ref}
          </span>
        );
      })}
    </p>
  );
}

/**
 * One string/number instruction param.
 *
 * Strings are edited as text with `{answer}` tokens spliced in at the
 * caret — stored verbatim when there are none, as a whole-value f-string
 * template when there are (`compileMessageTemplate`). Numbers are a fixed
 * value or one whole-value reference. Anything the backend accepts that
 * these cannot show is edited as a raw expression, one click away.
 */
export function ParamValueInput({
  id,
  kind,
  value,
  onChange,
  sources,
  "aria-label": ariaLabel,
}: ParamValueInputProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  if (kind === "number") {
    const template = parseTemplate(value);
    if (template?.kind === "expression") {
      return (
        <ExpressionInput
          id={id}
          expression={template.expression}
          onChange={(expression) => onChange(`{{ ${expression} }}`)}
          onClear={() => onChange(undefined)}
          aria-label={ariaLabel}
        />
      );
    }
    if (template?.kind === "ref") {
      const question = questionOfRef(template.ref, sources.questions);
      const contextValue = sources.contextValues.find(
        (entry) => entry.ref === template.ref,
      );
      const label = question
        ? t("action_param_answer_of", {
            question: questionLabel(question.question, t),
          })
        : contextValue
          ? contextValueLabel(contextValue)
          : template.ref;
      return (
        <div className="flex items-center gap-2">
          <div
            id={id}
            className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-dashed border-primary-300 bg-primary-50 px-2.5 text-sm text-primary-900"
          >
            <Variable aria-hidden className="size-4 shrink-0" />
            <span className="truncate">{label}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-label={t("action_param_clear_source")}
            onClick={() => onChange(undefined)}
          >
            <X className="size-4" />
          </Button>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <NumberLiteralInput
          id={id}
          value={value}
          onChange={onChange}
          aria-label={ariaLabel}
        />
        <VariableSourceMenu
          sources={sources}
          onPick={(ref) => onChange(compileTemplate(ref))}
          onCustomExpression={() => onChange("{{  }}")}
        />
      </div>
    );
  }

  const parsed = parseMessageTemplate(value);
  if (parsed.kind === "expression") {
    return (
      <ExpressionInput
        id={id}
        expression={parsed.expression}
        onChange={(expression) => onChange(`{{ ${expression} }}`)}
        onClear={() => onChange("")}
        aria-label={ariaLabel}
      />
    );
  }

  const text = parsed.text;
  const insertToken = (ref: string) => {
    const element = inputRef.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? start;
    const token = messageToken(ref);
    onChange(
      compileMessageTemplate(text.slice(0, start) + token + text.slice(end)),
    );
    // The menu took focus; put the caret back after the token once the
    // controlled value has rendered.
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + token.length, start + token.length);
    });
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          id={id}
          aria-label={ariaLabel}
          value={text}
          onChange={(e) => onChange(compileMessageTemplate(e.target.value))}
        />
        <VariableSourceMenu
          sources={sources}
          onPick={insertToken}
          onCustomExpression={() =>
            onChange(text ? `{{ ${JSON.stringify(text)} }}` : "{{  }}")
          }
        />
      </div>
      <MessagePreview text={text} sources={sources} />
    </div>
  );
}
