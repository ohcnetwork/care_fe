import { Dispatch } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";

import { ActionIssue } from "@/components/QuestionnaireV2/builder/actionValidation";
import { ActionListEditor } from "@/components/QuestionnaireV2/builder/actions/ActionListEditor";
import { ActionRegistry } from "@/components/QuestionnaireV2/builder/actions/useActionRegistry";
import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";

import {
  QuestionnaireAction,
  actionContextTypeFor,
} from "@/types/questionnaire/actions";
import { Question } from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";

export interface ActionsPanelProps {
  subjectType: SubjectType;
  questions: Question[];
  actions: QuestionnaireAction[];
  issues: ActionIssue[];
  /** The one expanded card; the page owns it so an issue click can open
   *  the right action. */
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
  registry: ActionRegistry;
  /** The mount's facility, handed to pickers that list facility records. */
  facilityId?: string;
  dispatch: Dispatch<BuilderAction>;
}

/**
 * The inspector's questionnaire-level automations: the shared action list
 * editor over the builder reducer. Edits flow through `setActions`; the
 * page's Save Changes PUTs them with the question tree.
 */
export function ActionsPanel({
  subjectType,
  questions,
  actions,
  issues,
  openIndex,
  onOpenIndexChange,
  registry,
  facilityId,
  dispatch,
}: ActionsPanelProps) {
  const { t } = useTranslation();
  const contextType = actionContextTypeFor(subjectType);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{t("actions")}</h2>
        <p className="text-xs text-gray-500">{t("actions_panel_hint")}</p>
      </div>

      {contextType === null && (
        <Alert>
          <AlertDescription>
            {t("actions_subject_unsupported")}
          </AlertDescription>
        </Alert>
      )}

      <ActionListEditor
        contextType={contextType}
        questions={questions}
        actions={actions}
        issues={issues}
        openIndex={openIndex}
        onOpenIndexChange={onOpenIndexChange}
        registry={registry}
        facilityId={facilityId}
        onActionsChange={(next) =>
          dispatch({ type: "setActions", actions: next })
        }
        emptyHint={t("actions_empty_hint")}
        onRenameLinkId={(id, linkId) =>
          dispatch({ type: "renameLinkId", id, linkId })
        }
        onMarkRequired={(id) =>
          dispatch({ type: "updateQuestion", id, patch: { required: true } })
        }
      />
    </div>
  );
}
