import { useAtom } from "jotai";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  findTopLevelIndex,
  QuestionTreeNav,
} from "@/components/QuestionnaireV2/shared/QuestionTreeNav";

import { QuestionField } from "@/components/QuestionnaireV2/renderer/QuestionField";
import {
  QuestionnaireRendererProvider,
  useRenderer,
} from "@/components/QuestionnaireV2/renderer/RendererContext";
import { RendererFooter } from "@/components/QuestionnaireV2/renderer/RendererFooter";
import { activeGroupIndexAtom } from "@/components/QuestionnaireV2/renderer/store";
import type {
  RendererMode,
  RendererSubject,
} from "@/components/QuestionnaireV2/renderer/types";

import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

interface QuestionnaireRendererProps {
  questionnaire: QuestionnaireRead;
  mode: RendererMode;
  subject?: RendererSubject;
  className?: string;
}

export function QuestionnaireRenderer(props: QuestionnaireRendererProps) {
  return (
    <QuestionnaireRendererProvider {...props}>
      <RendererBody className={props.className} />
    </QuestionnaireRendererProvider>
  );
}

function RendererBody({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { questionnaire } = useRenderer();
  const [activeGroupIndex, setActiveGroupIndex] = useAtom(activeGroupIndexAtom);

  if (questionnaire.questions.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg bg-white p-8 text-center text-sm text-gray-500",
          className,
        )}
      >
        {t("no_questions_added_yet")}
      </div>
    );
  }

  const activeQuestion =
    questionnaire.questions[activeGroupIndex] ?? questionnaire.questions[0];

  return (
    <div className={cn("flex gap-6", className)}>
      {/* A nav with a single entry has nothing to navigate between — and
          would otherwise show the active question's title a second time
          right next to its own field label. */}
      {questionnaire.questions.length > 1 && (
        <div className="hidden w-64 shrink-0 lg:block">
          <QuestionTreeNav
            title={questionnaire.title}
            questions={questionnaire.questions}
            activeId={activeQuestion.id}
            onSelect={(questionId) =>
              setActiveGroupIndex(
                findTopLevelIndex(questionnaire.questions, questionId),
              )
            }
          />
        </div>
      )}
      <div className="min-w-0 flex-1 rounded-lg bg-white">
        <div className="space-y-1 border-b border-gray-100 p-4">
          <h2 className="text-base font-semibold text-gray-900">
            {questionnaire.title}
          </h2>
          {questionnaire.description && (
            <p className="text-sm text-gray-500">{questionnaire.description}</p>
          )}
        </div>
        <div className="p-4">
          <QuestionField question={activeQuestion} depth={0} />
        </div>
        <RendererFooter />
      </div>
    </div>
  );
}
