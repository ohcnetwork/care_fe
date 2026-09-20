import { ArrowLeft, Plus } from "lucide-react";
import { navigate, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import type { SubjectType } from "@/types/questionnaire/questionnaire";

import { FillPageBody } from "./FillPageBody";
import { FillShell } from "./FillShell";
import type { FillSubject } from "./subject";
import { exitTargetOf, isPatientBound } from "./subject";

import { useFillPageDrafts } from "./useFillPageDrafts";
import { useFillPageQueries } from "./useFillPageQueries";

interface FillPageProps {
  /** What this fill is FOR — the union carries exactly the ids the
   *  mounting route can supply (see `fill/subject.ts`). */
  subject: FillSubject;
  questionnaireId?: string;
  /** What the questionnaire pickers filter on, when that differs from the
   *  subject's own type. Only the encounter-CREATION mount needs it: its
   *  subject is the patient (no encounter exists yet), but the forms it
   *  offers alongside are the encounter's. Defaults to `subject.type`. */
  pickerSubjectType?: SubjectType;
}

/**
 * Questionnaire data-entry page. Patient-bound subjects get the canvas and
 * clinical-history tabs; resource subjects get the canvas alone.
 *
 * A session may hold several questionnaires: each gets its own provider and
 * store, while autosave and submit operate on the session list.
 *
 * This component gates queries, draft loading and refuse-to-mount branches;
 * the loaded session itself is `FillPageBody`.
 */
export function QuestionnaireFillPage({
  subject,
  questionnaireId,
  pickerSubjectType = subject.type,
}: FillPageProps) {
  const { t } = useTranslation();
  const [
    {
      continue_draft: continueDraftParam,
      resume_local_draft: resumeLocalDraftParam,
      prescription,
      toDischarge,
    },
  ] = useQueryParams();
  const patientBound = isPatientBound(subject) ? subject : undefined;
  // Server drafts are patient/encounter records — a resource subject can
  // only have local drafts, so the query param is ignored there.
  const continueDraftId = patientBound ? continueDraftParam : undefined;
  const resumeLocalDraft = resumeLocalDraftParam === "true" && !continueDraftId;

  const {
    questionnaire,
    patient,
    encounter,
    encounterId,
    serverDraft,
    isQuestionnaireLoading,
    isQuestionnaireError,
    isEncounterLoading,
    isEncounterError,
    isPatientError,
    isServerDraftLoading,
    isServerDraftError,
    contextRefreshFailed,
    isRetryingContext,
    retryContext,
  } = useFillPageQueries({ subject, questionnaireId, continueDraftId });
  const { scope, sessionKey, localDraft, serverDraftState } = useFillPageDrafts(
    {
      subject,
      questionnaire,
      continueDraftId,
      serverDraft,
      resumeLocalDraft,
      prescription,
      toDischarge,
    },
  );

  const exitTarget = exitTargetOf(subject);

  if (!questionnaireId) {
    return (
      <FillShell onClose={() => navigate(exitTarget)}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("select_questionnaire_to_fill")}
          </h2>
          {/* Default onSelect navigates to `questionnaire/{id}` relative to
              the current path, which lands on this mount's :questionnaireId
              route for every subject. The trigger is supplied rather than
              defaulted for the same reason the in-session picker's is: a
              `role="combobox"` takes no accessible name from its contents,
              so the only control on this screen would reach screen readers
              unnamed. The role stays (this IS the picker), the name comes
              from aria-label. */}
          <QuestionnaireSearch
            subjectType={pickerSubjectType}
            facilityId={subject.facilityId}
            trigger={
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-label={t("select_questionnaire_to_fill")}
                className="w-full border border-primary-600 text-primary-800"
              >
                <Plus className="size-4" />
                {t("add_forms")}
              </Button>
            }
          />
        </div>
      </FillShell>
    );
  }

  if (
    isQuestionnaireLoading ||
    (encounterId && isEncounterLoading) ||
    (continueDraftId && isServerDraftLoading)
  ) {
    // Same fullscreen shell the loaded page uses, so the layout doesn't
    // jump shells when data lands — and the close affordance exists even
    // while loading.
    return (
      <FillShell onClose={() => navigate(exitTarget)}>
        <div className="min-h-0 flex-1 overflow-hidden px-6 py-4">
          <FormSkeleton rows={10} />
        </div>
      </FillShell>
    );
  }

  if (isQuestionnaireError || !questionnaire) {
    return (
      <FillErrorPage message={t("no_data_found")} exitTarget={exitTarget} />
    );
  }

  // The fetched questionnaire was authored for a subject family this mount
  // cannot supply (e.g. a location/device/facility questionnaire id pasted
  // into a patient route). Mounting anyway would let the clinician fill the
  // entire form before the backend rejects it at Save (400, atomic batch
  // rollback) with no clue why. Patient-bound mounts (patient + encounter
  // routes) share one family — a patient-subject questionnaire can be filled
  // from an encounter route and vice versa — so only resource mounts
  // (location/device/facility) require an exact match.
  const subjectTypeMismatch = patientBound
    ? questionnaire.subject_type !== "patient" &&
      questionnaire.subject_type !== "encounter"
    : questionnaire.subject_type !== subject.type;
  if (subjectTypeMismatch) {
    return (
      <FillErrorPage
        message={t("fill_subject_type_mismatch")}
        exitTarget={exitTarget}
      />
    );
  }

  // The clinical context could not be LOADED (the app's query default is
  // retry:false, so one blip lands here). Mounting the form anyway would
  // show a headerless page with no patient identity, blood group or
  // allergy badges — safety-relevant context — while the clinician types
  // clinical data into it.
  if ((encounterId && isEncounterError) || isPatientError) {
    return (
      <FillErrorPage
        message={t("fill_context_load_failed")}
        exitTarget={exitTarget}
      />
    );
  }

  // The draft record could not be READ (404, permissions, a network
  // hiccup — the app's query default is retry:false). Mounting the form
  // anyway would show a blank questionnaire with no explanation, invite a
  // full re-type into a page whose local autosave is deliberately off, and
  // then compose a completion PUT for a draft that was never loaded — one
  // failed sub-request rolls the whole atomic batch back, so the URL
  // becomes an un-submittable dead end.
  if (isServerDraftError) {
    return (
      <FillErrorPage message={t("draft_load_failed")} exitTarget={exitTarget} />
    );
  }

  if (serverDraftState?.mismatch) {
    return (
      <FillErrorPage
        message={t("draft_not_recoverable")}
        exitTarget={exitTarget}
      />
    );
  }

  // A selected draft may have expired or been removed in another tab.
  // Do not present an empty form as though its answers were restored.
  if (resumeLocalDraft && !localDraft) {
    return (
      <FillErrorPage message={t("draft_load_failed")} exitTarget={exitTarget} />
    );
  }

  // The route's patientId and encounterId disagree on whose encounter this
  // is (a hand-edited or stale URL) — mounting would show patient B's
  // identity banner and clinical history beside patient A's structured
  // widget context. Only checked once the encounter query has actually
  // resolved (the loading/error branches above already accounted for
  // "still loading" and "failed to load").
  if (
    subject.type === "encounter" &&
    encounter &&
    encounter.patient.id !== subject.patientId
  ) {
    return (
      <FillErrorPage
        message={t("fill_patient_encounter_mismatch")}
        exitTarget={exitTarget}
      />
    );
  }

  return (
    // Keyed by session identity: raviger re-renders this route element in
    // place, and `useFillSessionForms` deliberately captures the primary
    // questionnaire once at creation. Without the key, navigating from one
    // fill session straight into another (overview → A → back → B →
    // history-jump to A) would keep the previous session's forms mounted
    // under the NEW draft scope, and the next autosave would file one
    // questionnaire's answers under the other's draft key.
    <FillPageBody
      key={sessionKey}
      questionnaire={questionnaire}
      patient={patient}
      encounter={encounter}
      subject={subject}
      pickerSubjectType={pickerSubjectType}
      scope={scope}
      localDraft={localDraft}
      resumeLocalDraft={resumeLocalDraft}
      serverDraftResponses={
        serverDraftState && !serverDraftState.mismatch
          ? serverDraftState.responses
          : undefined
      }
      serverDraftDropped={
        serverDraftState && !serverDraftState.mismatch
          ? serverDraftState.dropped
          : undefined
      }
      continueDraftId={continueDraftId}
      exitTarget={exitTarget}
      contextRefreshFailed={contextRefreshFailed}
      isRetryingContext={isRetryingContext}
      onRetryContext={retryContext}
    />
  );
}

/** The one dead-end state of this page: an alert plus the way back. Every
 *  branch that refuses to mount a form uses it, so "we could not open this"
 *  always reads the same and always announces (the ui Alert is
 *  role="alert"). */
function FillErrorPage({
  message,
  exitTarget,
}: {
  message: string;
  exitTarget: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 p-6">
      <Alert variant="destructive">
        <AlertTitle>{t("error")}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Button variant="outline" onClick={() => navigate(exitTarget)}>
        <ArrowLeft className="size-4" />
        {t("back")}
      </Button>
    </div>
  );
}
