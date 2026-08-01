import { ArrowLeft, Check, CircleCheck, TriangleAlert } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { EditPreviewToggle } from "@/components/QuestionnaireV2/builder/EditPreviewToggle";
import { SaveIssue } from "@/components/QuestionnaireV2/builder/saveValidation";
import { findQuestionNumber } from "@/components/QuestionnaireV2/shared/questionTree";

import { Question } from "@/types/questionnaire/question";
import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireRead,
  formatRevision,
} from "@/types/questionnaire/questionnaire";

export interface StudioTopBarProps {
  questionnaire: QuestionnaireRead;
  questions: Question[];
  view: "edit" | "preview";
  onViewChange: (view: "edit" | "preview") => void;
  issues: SaveIssue[];
  onSelectIssue: (questionId: string) => void;
  dirty: boolean;
  isSaving: boolean;
  canWrite: boolean;
  onSave: () => void;
  onDiscard: () => void;
  backPath: string;
}

/** The studio header strip: back, identity, save-blocking issues, the
 *  Edit/Preview toggle and the Discard / Save Changes actions. */
export function StudioTopBar({
  questionnaire,
  questions,
  view,
  onViewChange,
  issues,
  onSelectIssue,
  dirty,
  isSaving,
  canWrite,
  onSave,
  onDiscard,
  backPath,
}: StudioTopBarProps) {
  const { t } = useTranslation();
  const [issuesOpen, setIssuesOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-1 py-3">
      <Button
        type="button"
        variant="outline"
        size="xs"
        onClick={() => navigate(backPath)}
      >
        <ArrowLeft className="size-4" />
        {t("back")}
      </Button>

      <span aria-hidden className="hidden h-5 w-px bg-gray-200 sm:block" />

      <div className="flex min-w-0 items-center gap-2">
        <h1 className="min-w-0 truncate text-sm font-semibold text-gray-900">
          {questionnaire.title}
        </h1>
        <Badge variant="secondary" className="shrink-0 font-mono">
          {formatRevision(questionnaire.internal_revision)}
        </Badge>
        <Badge
          variant={QUESTIONNAIRE_STATUS_COLORS[questionnaire.status]}
          className="shrink-0"
        >
          {t(questionnaire.status)}
        </Badge>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-3">
        {issues.length === 0 ? (
          <span className="hidden items-center gap-1.5 text-xs text-gray-400 lg:flex">
            <CircleCheck className="size-3.5" />
            {t("ready_to_save")}
          </span>
        ) : (
          <Popover open={issuesOpen} onOpenChange={setIssuesOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="warning" size="sm">
                <TriangleAlert className="size-4" />
                {t("issues_to_fix", { count: issues.length })}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-1.5">
              <p className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
                {t("before_you_save")}
              </p>
              <div className="max-h-72 overflow-y-auto">
                {issues.map(({ question, messageKey }) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => {
                      setIssuesOpen(false);
                      onSelectIssue(question.id);
                    }}
                    className="flex w-full items-start gap-2 rounded-md px-2.5 py-2 text-left hover:bg-gray-50"
                  >
                    <TriangleAlert
                      aria-hidden
                      className="mt-0.5 size-3.5 shrink-0 text-amber-600"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        {t(messageKey)}
                      </span>
                      <span className="block truncate text-xs text-gray-500">
                        {findQuestionNumber(questions, question.id)}{" "}
                        {question.text || t("untitled_question")}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}

        <EditPreviewToggle view={view} onChange={onViewChange} />

        {canWrite && (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={onDiscard}
              disabled={!dirty || isSaving}
            >
              {t("discard")}
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={!dirty || isSaving}
            >
              <Check className="size-4" />
              {t("save_changes")}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
