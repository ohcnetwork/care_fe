import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { useVisibleTopLevelIndices } from "@/components/QuestionnaireV2/renderer/store";

import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { FormChrome, FormChromeProvider, useFormChrome } from "./chrome";
import { QuestionnaireFormProvider, useFormRenderer } from "./FormContext";
import { QuestionBlock } from "./QuestionBlock";
import type { FormMode, RendererSubject } from "./types";

export interface QuestionnaireFormRendererProps {
  questionnaire: QuestionnaireRead;
  mode: FormMode;
  subject?: RendererSubject;
  /** Builder edit canvas: render enable_when-hidden questions too. */
  revealHidden?: boolean;
  /** Builder edit canvas: inputs visible but non-interactive. */
  inert?: boolean;
  /** Decoration seam — see chrome.tsx. */
  chrome?: FormChrome;
  /** Replaces the default "no questions" text (the studio passes its
   *  add-first/import affordances). */
  emptyState?: React.ReactNode;
  /** Hide the questionnaire title/description header (hosts that already
   *  show them elsewhere). */
  hideHeader?: boolean;
  className?: string;
}

function countLeafQuestions(questions: Question[]): number {
  let count = 0;
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type === "group") walk(question.questions ?? []);
      else count += 1;
    }
  };
  walk(questions);
  return count;
}

/**
 * The full renderer: the whole questionnaire on one scroll — top-level
 * groups as section cards, everything live against the per-instance store.
 * This is the module the builder canvas, preview and (next phase) the fill
 * flow all mount; the old paginated renderer stays untouched until removal.
 */
export function QuestionnaireFormRenderer({
  questionnaire,
  mode,
  subject,
  revealHidden,
  inert,
  chrome = {},
  emptyState,
  hideHeader,
  className,
}: QuestionnaireFormRendererProps) {
  return (
    <QuestionnaireFormProvider
      questionnaire={questionnaire}
      mode={mode}
      subject={subject}
      revealHidden={revealHidden}
      inert={inert}
    >
      <FormChromeProvider chrome={chrome}>
        <CanvasBody
          emptyState={emptyState}
          hideHeader={hideHeader}
          className={className}
        />
      </FormChromeProvider>
    </QuestionnaireFormProvider>
  );
}

/**
 * The canvas body for hosts that mount `QuestionnaireFormProvider`
 * themselves — the studio does, so its outline and canvas share one store
 * (the outline's preview mode reads live enable_when hidden ids).
 */
export function QuestionnaireFormCanvas({
  chrome = {},
  emptyState,
  hideHeader,
  className,
}: {
  chrome?: FormChrome;
  emptyState?: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
}) {
  return (
    <FormChromeProvider chrome={chrome}>
      <CanvasBody
        emptyState={emptyState}
        hideHeader={hideHeader}
        className={className}
      />
    </FormChromeProvider>
  );
}

function CanvasBody({
  emptyState,
  hideHeader,
  className,
}: {
  emptyState?: React.ReactNode;
  hideHeader?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { questionnaire, revealHidden } = useFormRenderer();
  const { AppendZone } = useFormChrome();
  const visibleIndices = useVisibleTopLevelIndices();
  const questions = questionnaire.questions;

  const header = !hideHeader && (
    <div className="space-y-1 pb-4">
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">
        {questionnaire.title}
      </h2>
      {questionnaire.description && (
        <p className="text-sm text-gray-500">{questionnaire.description}</p>
      )}
      {questions.length > 0 && (
        <p className="text-xs text-gray-400">
          {t("n_questions", { count: countLeafQuestions(questions) })}
        </p>
      )}
    </div>
  );

  if (questions.length === 0) {
    return (
      <div className={cn("mx-auto w-full max-w-3xl", className)}>
        {header}
        {emptyState ?? (
          <div className="rounded-lg bg-white p-8 text-center text-sm text-gray-500">
            {t("no_questions_added_yet")}
          </div>
        )}
      </div>
    );
  }

  // Every top-level question hidden by enable_when: explain the empty form
  // instead of a blank canvas. The edit canvas (`revealHidden`) never hits
  // this — hidden questions render there with a logic badge.
  if (!revealHidden && visibleIndices.length === 0) {
    return (
      <div className={cn("mx-auto w-full max-w-3xl", className)}>
        {header}
        <div className="p-8 text-center text-sm text-gray-500">
          {t("no_visible_questions")}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("mx-auto w-full max-w-3xl", className)}>
      {header}
      <div className="space-y-4 pb-4">
        {questions.map((question, index) => (
          <QuestionBlock
            key={question.id}
            question={question}
            parentId={null}
            index={index}
            siblingCount={questions.length}
            depth={0}
            number={`${index + 1}.`}
          />
        ))}
        {AppendZone && <AppendZone parentId={null} />}
      </div>
    </div>
  );
}
