import { ArrowLeft, Check, CircleCheck, TriangleAlert } from "lucide-react";
import { Link } from "raviger";
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
import { ActionIssue } from "@/components/QuestionnaireV2/builder/actionValidation";
import { SaveIssue } from "@/components/QuestionnaireV2/builder/saveValidation";
import { numberQuestions } from "@/components/QuestionnaireV2/shared/questionTree";

import { Question } from "@/types/questionnaire/question";
import {
  QUESTIONNAIRE_STATUS_COLORS,
  QuestionnaireRead,
  formatRevision,
  revisionOf,
} from "@/types/questionnaire/questionnaire";

export interface StudioTopBarProps {
  questionnaire: QuestionnaireRead;
  questions: Question[];
  view: "edit" | "preview";
  onViewChange: (view: "edit" | "preview") => void;
  issues: SaveIssue[];
  onSelectIssue: (questionId: string) => void;
  /** The actions' own save blockers — listed after the question ones;
   *  selecting one opens that action in the inspector. */
  actionIssues: ActionIssue[];
  onSelectActionIssue: (index: number) => void;
  dirty: boolean;
  isSaving: boolean;
  canWrite: boolean;
  onSave: () => void;
  onDiscard: () => void;
  backPath: string;
}

function IssuesList({
  issues,
  actionIssues,
  questions,
  onSelect,
  onSelectAction,
}: {
  issues: SaveIssue[];
  actionIssues: ActionIssue[];
  questions: Question[];
  onSelect: (questionId: string) => void;
  onSelectAction: (index: number) => void;
}) {
  const { t } = useTranslation();
  // One numbering pass for the whole list — findQuestionNumber would walk
  // the tree once per issue.
  const numbers = new Map(
    numberQuestions(questions).flatMap((item) =>
      [item, ...item.children].map(({ question, number }) => [
        question.id,
        number,
      ]),
    ),
  );

  return (
    <>
      <p className="px-2.5 pb-1 pt-2 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {t("before_you_save")}
      </p>
      <div className="max-h-72 overflow-y-auto">
        {issues.map(({ question, messageKey }) => (
          <button
            key={question.id}
            type="button"
            onClick={() => onSelect(question.id)}
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
                {numbers.get(question.id)}{" "}
                {question.text || t("untitled_question")}
              </span>
            </span>
          </button>
        ))}
        {actionIssues.map(({ index, messageKey }) => (
          <button
            key={`action-${index}`}
            type="button"
            onClick={() => onSelectAction(index)}
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
                {t("action_n", { n: index + 1 })}
              </span>
            </span>
          </button>
        ))}
      </div>
    </>
  );
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
  actionIssues,
  onSelectActionIssue,
  dirty,
  isSaving,
  canWrite,
  onSave,
  onDiscard,
  backPath,
}: StudioTopBarProps) {
  const { t } = useTranslation();
  const [issuesOpen, setIssuesOpen] = useState(false);
  const issueCount = issues.length + actionIssues.length;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-white px-4 py-2.5">
      {/* A real anchor (not navigate()) so middle-click and open-in-new-tab
          work; raviger's Link still routes client-side, and
          useNavigationPrompt keeps guarding unsaved changes. basePath="/"
          opts out of the nested settings router's basePath, which Link
          would otherwise prepend to this already-absolute href. */}
      <Button asChild variant="outline" size="xs">
        <Link href={backPath} basePath="/">
          <ArrowLeft className="size-4" />
          {t("back")}
        </Link>
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
        {issueCount === 0 ? (
          <span className="hidden items-center gap-1.5 text-xs text-gray-400 lg:flex">
            <CircleCheck className="size-3.5" />
            {t("ready_to_save")}
          </span>
        ) : (
          <Popover open={issuesOpen} onOpenChange={setIssuesOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="warning" size="sm">
                <TriangleAlert className="size-4" />
                {t("issues_to_fix", { count: issueCount })}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-1.5">
              {/* A component (not inline .map) so the per-issue numbering
                  work only runs while the popover is actually mounted —
                  inline children would be built on every top-bar render. */}
              <IssuesList
                issues={issues}
                actionIssues={actionIssues}
                questions={questions}
                onSelect={(questionId) => {
                  setIssuesOpen(false);
                  onSelectIssue(questionId);
                }}
                onSelectAction={(index) => {
                  setIssuesOpen(false);
                  onSelectActionIssue(index);
                }}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* Read-only users are pinned to preview by the page — offering the
            toggle would advertise an edit surface that can never be saved. */}
        {canWrite && (
          <>
            <EditPreviewToggle view={view} onChange={onViewChange} />
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
              {/* The backend snapshots a new revision on every save — show
                  the version this save will create (reference: "Publish
                  v9"). Appended, so the accessible name still starts with
                  "Save Changes". */}
              <span className="rounded bg-white/25 px-1.5 py-0.5 font-mono text-[10px] font-bold">
                {`v${revisionOf(questionnaire) + 1}`}
              </span>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
