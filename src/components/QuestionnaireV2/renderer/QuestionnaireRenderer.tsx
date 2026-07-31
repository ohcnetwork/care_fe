import { useAtom } from "jotai";
import { PanelLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { QuestionTreeNav } from "@/components/QuestionnaireV2/shared/QuestionTreeNav";
import { findTopLevelIndex } from "@/components/QuestionnaireV2/shared/questionTree";

import { QuestionField } from "@/components/QuestionnaireV2/renderer/QuestionField";
import {
  QuestionnaireRendererProvider,
  useRenderer,
} from "@/components/QuestionnaireV2/renderer/RendererContext";
import { RendererFooter } from "@/components/QuestionnaireV2/renderer/RendererFooter";
import {
  activeGroupIndexAtom,
  useHiddenQuestionIds,
  useVisibleTopLevelIndices,
} from "@/components/QuestionnaireV2/renderer/store";
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
  // Pagination operates over the enable_when-visible top-level questions
  // only — a hidden question would otherwise render as a blank page.
  const visibleIndices = useVisibleTopLevelIndices();
  // Tree-wide hidden set (any depth) for the nav, so hidden sub-questions
  // don't keep dead rows.
  const hiddenIds = useHiddenQuestionIds();
  const [navOpen, setNavOpen] = useState(true);

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

  const header = (
    <div className="space-y-1 pb-4">
      <h2 className="text-base font-semibold text-gray-900">
        {questionnaire.title}
      </h2>
      {questionnaire.description && (
        <p className="text-sm text-gray-500">{questionnaire.description}</p>
      )}
    </div>
  );

  // Every top-level question hidden by enable_when: explain the empty form
  // instead of a blank strip with dead pagination buttons.
  if (visibleIndices.length === 0) {
    return (
      <div className={cn("flex gap-6", className)}>
        <div className="min-w-0 flex-1 rounded-lg bg-white px-6 py-4 lg:px-12">
          <div className="mx-auto w-full max-w-3xl">
            {header}
            <div className="p-8 text-center text-sm text-gray-500">
              {t("no_visible_questions")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Snap to the first visible question when the stored index points at a
  // hidden (or out-of-range) one — e.g. its condition stopped matching.
  const activeIndex = visibleIndices.includes(activeGroupIndex)
    ? activeGroupIndex
    : (visibleIndices[0] ?? 0);
  const activeQuestion =
    questionnaire.questions[activeIndex] ?? questionnaire.questions[0];

  return (
    <div className={cn("flex gap-6", className)}>
      {/* A nav with a single entry has nothing to navigate between — and
          would otherwise show the active question's title a second time
          right next to its own field label. */}
      {questionnaire.questions.length > 1 &&
        (navOpen ? (
          <div className="hidden w-64 shrink-0 lg:block">
            <div className="flex items-center justify-between gap-2 px-3 py-2">
              <h3 className="min-w-0 truncate text-sm font-semibold text-gray-900">
                {questionnaire.title}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0"
                onClick={() => setNavOpen(false)}
                aria-label={t("collapse_sidebar")}
              >
                <PanelLeft className="size-5" />
              </Button>
            </div>
            <QuestionTreeNav
              questions={questionnaire.questions}
              activeId={activeQuestion.id}
              hiddenIds={hiddenIds}
              onSelect={(questionId) =>
                setActiveGroupIndex(
                  findTopLevelIndex(questionnaire.questions, questionId),
                )
              }
            />
          </div>
        ) : (
          // Collapsed rail: just the expand toggle, content re-centres.
          <div className="hidden w-10 shrink-0 lg:block">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setNavOpen(true)}
              aria-label={t("expand_sidebar")}
            >
              <PanelLeft className="size-5" />
            </Button>
          </div>
        ))}
      <div className="min-w-0 flex-1 rounded-lg bg-white px-6 py-4 lg:px-12">
        <div className="mx-auto w-full max-w-3xl">
          {header}
          <div className="pb-4">
            <QuestionField
              question={activeQuestion}
              depth={0}
              number={`${activeIndex + 1}.`}
            />
          </div>
          <RendererFooter />
        </div>
      </div>
    </div>
  );
}
