import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, X } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { FIXED_QUESTIONNAIRES } from "@/components/Questionnaire/data/StructuredFormData";

import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import useAuthUser from "@/hooks/useAuthUser";

import { PLUGIN_Component } from "@/PluginEngine";
import query from "@/Utils/request/query";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import type { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import type {
  QuestionnaireRead,
  SubjectType,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { DraftRestoreBar } from "./DraftRestoreBar";
import { FillFormSection } from "./FillFormSection";
import { FillHeader } from "./FillHeader";
import {
  FillOutlineNavProvider,
  FillOutlineOverlay,
} from "./FillOutlineOverlay";
import { ServerErrorsPanel } from "./ServerErrorsPanel";
import type { FormStore } from "./StoreRegistrar";
import { sweepExpiredFillDrafts } from "./draft/fillDraftCache";
import type { FillDraftScope, LoadedFillDraft } from "./draft/fillDraftStore";
import { loadFillDraft, reviveDraftResponses } from "./draft/fillDraftStore";
import { useFillSessionAutosave } from "./draft/useFillAutosave";
import { useSaveServerDraft } from "./draft/useSaveServerDraft";
import type { FillSubject } from "./subject";
import {
  exitTargetOf,
  isPatientBound,
  rendererSubjectOf,
  subjectKeyOf,
} from "./subject";
import { useSubmitFillSession } from "./submit/useSubmitQuestionnaire";
import { useFillActions } from "./useFillActions";
import { useFillSessionForms } from "./useFillSessionForms";

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
 * The v2 fill experience — the questionnaire data-entry page (successor to
 * EncounterQuestionnaire + the legacy QuestionnaireForm). Patient-bound
 * subjects get two tabs per the reference: the questionnaire canvas (with
 * local autosave) and the patient's clinical history; resource subjects
 * (location/device/facility) get the canvas alone, since none of the
 * clinical context exists for them.
 *
 * A session may hold SEVERAL questionnaires (the legacy "add another form
 * to this submission" capability): each gets its own provider and store,
 * the host keeps the registry, and autosave/submit operate on the list.
 */
export default function QuestionnaireFillPage({
  subject,
  questionnaireId,
  pickerSubjectType = subject.type,
}: FillPageProps) {
  const { t } = useTranslation();
  const [{ continue_draft: continueDraftParam }] = useQueryParams();
  const user = useAuthUser();

  const patientBound = isPatientBound(subject) ? subject : undefined;
  // Server drafts are patient/encounter records — a resource subject can
  // only have local drafts, so the query param is ignored there.
  const continueDraftId = patientBound ? continueDraftParam : undefined;

  useEffect(() => {
    sweepExpiredFillDrafts();
  }, []);

  const fixedQuestionnaire = questionnaireId
    ? FIXED_QUESTIONNAIRES[questionnaireId]
    : undefined;

  const {
    data: fetchedQuestionnaire,
    isLoading: isQuestionnaireLoading,
    isError: isQuestionnaireError,
  } = useQuery({
    queryKey: questionnaireKeys.detail(questionnaireId ?? ""),
    queryFn: query(questionnaireApi.get, {
      pathParams: { id: questionnaireId ?? "" },
    }),
    enabled: !!questionnaireId && !fixedQuestionnaire,
  });

  const encounterId =
    subject.type === "encounter" ? subject.encounterId : undefined;
  const {
    data: encounter,
    isLoading: isEncounterLoading,
    isError: isEncounterError,
  } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId ?? "" },
      queryParams: {
        facility: subject.type === "encounter" ? subject.facilityId : "",
      },
    }),
    enabled: !!encounterId,
  });

  // Patient-subject fills have no encounter to borrow the patient from;
  // resource subjects have no patient at all.
  const { data: fetchedPatient, isError: isPatientError } = useQuery({
    queryKey: ["patient", patientBound?.patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientBound?.patientId ?? "" },
    }),
    enabled: subject.type === "patient",
  });

  const {
    data: serverDraft,
    // isLoading, NOT isFetching: a background refetch (window focus, cache
    // invalidation) flips isFetching while data is still present, and the
    // skeleton branch below would unmount the whole session — every form
    // store and every answer typed since resume — mid-edit.
    isLoading: isServerDraftLoading,
    isError: isServerDraftError,
  } = useQuery({
    queryKey: ["formSubmission", continueDraftId],
    queryFn: query(formSubmissionApi.get, {
      pathParams: { external_id: continueDraftId ?? "" },
    }),
    enabled: !!continueDraftId,
  });

  const questionnaire = fixedQuestionnaire ?? fetchedQuestionnaire;
  const patient = encounter?.patient ?? fetchedPatient;

  // Server draft (continue_draft) supersedes any local draft. The embedded
  // questionnaire id must match the live one — the legacy recoverability
  // guard.
  const serverDraftState = useMemo(() => {
    if (!continueDraftId || !serverDraft || !questionnaire) return undefined;
    // Only an open draft resumes. A record already submitted (or marked
    // entered-in-error) re-opening as editable would let one submission
    // file twice — the overview's drafts card filters these out, but the
    // URL is shareable and outlives that filter.
    if (serverDraft.status !== "draft") {
      return { mismatch: true as const };
    }
    const dump = serverDraft.response_dump as
      | {
          questionnaireResponses?: {
            questionnaire?: { id?: string };
            responses?: QuestionnaireResponse[];
          };
        }
      | undefined;
    const form = dump?.questionnaireResponses;
    if (!form?.responses || form.questionnaire?.id !== questionnaire.id) {
      return { mismatch: true as const };
    }
    const record: Record<string, QuestionnaireResponse> = {};
    for (const response of form.responses) {
      record[response.question_id] = response;
    }
    return {
      mismatch: false as const,
      responses: reviveDraftResponses(record),
    };
  }, [continueDraftId, serverDraft, questionnaire]);

  const scope: FillDraftScope | undefined = questionnaire
    ? {
        userId: user.id,
        subjectKey: subjectKeyOf(subject),
        entryQuestionnaireId: questionnaire.id,
      }
    : undefined;

  // Loaded once per (user, subject, entry questionnaire) — reruns of this
  // memo after autosave writes don't happen because the deps are stable.
  // The primary form's version gates the whole session draft.
  const scopeKey = scope
    ? `${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`
    : undefined;
  const localDraft = useMemo<LoadedFillDraft | undefined>(
    () =>
      scopeKey && scope && questionnaire && !continueDraftId
        ? loadFillDraft(scope, String(questionnaire.version))
        : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, continueDraftId],
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
  // from an encounter route and vice versa, same as the legacy
  // pre-encounter "consultation" route proves by mounting an
  // encounter-subject fixed questionnaire on a patient subject — so only
  // resource mounts (location/device/facility) require an exact match.
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
  // becomes an un-submittable dead end. Legacy showed an error page here.
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
    <FillPageBody
      questionnaire={questionnaire}
      patient={patient}
      encounter={encounter}
      subject={subject}
      pickerSubjectType={pickerSubjectType}
      scope={scope}
      localDraft={localDraft}
      serverDraftResponses={
        serverDraftState && !serverDraftState.mismatch
          ? serverDraftState.responses
          : undefined
      }
      continueDraftId={continueDraftId}
      exitTarget={exitTarget}
    />
  );
}

/** The canvas title and its unsaved-work badge. One fragment shared by the
 *  two header branches (tab strip where a patient gives us a clinical
 *  history tab, plain label otherwise) so the chip can never drift out of
 *  one of them. */
function QuestionnaireTitleWithDraftBadge({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {t("questionnaire_one")}
      {dirty && (
        <Badge className="ml-2 bg-indigo-100 text-indigo-900">
          {t("draft")}
        </Badge>
      )}
    </>
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

/** The fullscreen frame (the fill routes opt out of the app sidebar):
 *  fixed viewport shell, z-40 under portals at z-50. */
function FillShell({
  children,
  onClose,
  tabs,
}: {
  children: React.ReactNode;
  onClose: () => void;
  tabs?: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-gray-100">
      {/* min-w-0 + overflow on the strip: a long questionnaire title (or
          the two tabs) scrolls within its own row on narrow screens
          instead of pushing the close button off-viewport. */}
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 md:px-6">
        <div className="min-w-0 flex-1 overflow-x-auto">{tabs ?? <div />}</div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label={t("close")}
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>
      {children}
    </div>
  );
}

interface FillPageBodyProps {
  questionnaire: QuestionnaireRead;
  patient?: PatientRead;
  encounter?: EncounterRead;
  subject: FillSubject;
  pickerSubjectType: SubjectType;
  scope: FillDraftScope | undefined;
  localDraft: LoadedFillDraft | undefined;
  /** Resumed server draft, seeded into the primary form at creation. */
  serverDraftResponses?: Record<string, QuestionnaireResponse>;
  continueDraftId?: string;
  exitTarget: string;
}

function FillPageBody({
  questionnaire,
  patient,
  encounter,
  subject,
  pickerSubjectType,
  scope,
  localDraft,
  serverDraftResponses,
  continueDraftId,
  exitTarget,
}: FillPageBodyProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"questionnaire" | "history">("questionnaire");
  // History mounts on first activation and stays mounted after (hidden) —
  // eager mounting would fire its queries and leak its text into the DOM
  // for sessions that never open it, while unmount-on-switch would blank
  // adapted structured widgets that keep local state.
  const [historyMounted, setHistoryMounted] = useState(false);

  const storesRef = useRef(new Map<string, FormStore>());
  const [storesVersion, setStoresVersion] = useState(0);
  const handleStore = useCallback((key: string, store: FormStore | null) => {
    if (store) storesRef.current.set(key, store);
    else storesRef.current.delete(key);
    setStoresVersion((version) => version + 1);
  }, []);
  const getStore = useCallback((key: string) => storesRef.current.get(key), []);

  // The session: the route-mounted questionnaire plus anything added to
  // the same submission (add/remove, retained-draft-snapshot bookkeeping,
  // the async resume-added-forms path) — see useFillSessionForms.ts.
  const {
    forms,
    removeForm,
    retainedSnapshots,
    onResumeAddedForms,
    addQuestionnaireFromPicker,
  } = useFillSessionForms({
    questionnaire,
    serverDraftResponses,
    getStore,
  });

  // The outline lives in one shared overlay (panel rows + rail ticks);
  // each form portals its own pieces into the two hosts (they must render
  // inside that form's provider). The scroll container feeds the
  // overlay's scroll-spy.
  const [outlineHost, setOutlineHost] = useState<HTMLElement | null>(null);
  const [railHost, setRailHost] = useState<HTMLElement | null>(null);
  const [scrollHost, setScrollHost] = useState<HTMLElement | null>(null);

  // The renderer's flat subject view. Memoized on its PRIMITIVES: the
  // union arrives as a fresh object literal from the route element on
  // every render, so keying on the object itself would never hit.
  const { patientId, encounterId, facilityId, resourceId } =
    rendererSubjectOf(subject);
  const rendererSubject = useMemo(
    () => ({ patientId, encounterId, facilityId, resourceId }),
    [patientId, encounterId, facilityId, resourceId],
  );

  // Local autosave PERSISTENCE stands down while resuming a SERVER draft —
  // the server copy is authoritative there and keeps its own lifecycle.
  // The scope still goes in: dirty tracking guards navigation either way,
  // and a successful submit must clear any sibling local draft filed under
  // the same key by an earlier plain session.
  const autosave = useFillSessionAutosave({
    scope,
    persistLocally: !continueDraftId,
    forms,
    getStore,
    storesVersion,
    restoredDraft: localDraft,
    retainedSnapshots,
    onResumeAddedForms,
  });

  // Titles of forms the draft is still carrying that never made it back
  // into a live store — a resume whose re-fetch failed, still sitting in
  // `retainedSnapshots` (see the state above). Passed to the submit hook
  // so it can refuse to submit (and clear the draft) out from under them.
  const blockedFormLabels = useMemo(
    () =>
      retainedSnapshots.map(
        (snapshot) => snapshot.title ?? snapshot.questionnaireId,
      ),
    [retainedSnapshots],
  );

  const { submit, isPending, isComposing, serverErrors } = useSubmitFillSession(
    {
      forms,
      getStore,
      subject,
      continueDraftId,
      blockedFormLabels,
      onSuccess: () => {
        // Order matters: finishDraft flushes the pristine state before the
        // redirect so useNavigationPrompt doesn't block it.
        autosave.finishDraft();
        navigate(exitTarget);
      },
    },
  );

  // P1-4: the fill session stays fully editable during an in-flight
  // submit unless every input-bearing surface reads this. "composing"
  // covers the click-to-mutate gap (client validation + batch compose,
  // both synchronous-ish but real work) and "submitting" the request
  // itself; either one means an edit typed right now would diverge from
  // the payload already built/sent. `isPending` here is the hook's own
  // OR of the two (see useSubmitQuestionnaire.ts), so `frozen` is exactly
  // the old submit-in-flight condition — this is a naming/clarity change,
  // not new behavior. Releases the moment the mutation settles (success
  // navigates away; an error just flips isPending back to false), so a
  // failed submit leaves the form editable again for a retry.
  const sessionPhase: "editing" | "composing" | "submitting" = isComposing
    ? "composing"
    : isPending
      ? "submitting"
      : "editing";
  const frozen = sessionPhase !== "editing";

  // The deliberate server draft (feature-flagged). Same exit as a
  // submission: the server copy supersedes the local autosave one, so
  // finishDraft drops it and flushes the page pristine before we navigate.
  const serverDraftSave = useSaveServerDraft({
    forms,
    getStore,
    subject,
    continueDraftId,
    onSaved: () => {
      autosave.finishDraft();
      navigate(exitTarget);
    },
  });

  useNavigationPrompt(
    autosave.dirty && !import.meta.env.DEV,
    t("unsaved_changes"),
  );

  // What a federated agent (Scribe) may do to this session, and the one
  // validated path for doing it. Nothing is registered for a session with
  // no patient in scope, so those mounts hand the plugin an empty list.
  const { descriptors, invoke } = useFillActions({ subject, forms, getStore });

  return (
    <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-gray-100">
      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === "history") setHistoryMounted(true);
          setTab(value as typeof tab);
        }}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 md:px-6">
          {/* The clinical history tab exists only where there IS a patient
              — a location/device/facility fill gets the plain title in the
              same slot, draft badge included. min-w-0 + overflow keeps the
              strip scrolling within its row on narrow screens instead of
              pushing the close button off-viewport. */}
          <div className="min-w-0 flex-1 overflow-x-auto">
            {patientId ? (
              <TabsList>
                <TabsTrigger value="questionnaire">
                  <QuestionnaireTitleWithDraftBadge dirty={autosave.dirty} />
                </TabsTrigger>
                <TabsTrigger value="history">
                  {t("patient_clinical_history")}
                </TabsTrigger>
              </TabsList>
            ) : (
              <div className="flex items-center py-1.5 text-sm font-medium text-gray-900">
                <QuestionnaireTitleWithDraftBadge dirty={autosave.dirty} />
              </div>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            aria-label={t("close")}
            onClick={() => navigate(exitTarget)}
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* The form panel stays mounted across switches (forceMount +
            hidden): some adapted structured widgets keep local state they
            never rehydrate from the response — an unmount would blank
            them. */}
        <TabsContent
          value="questionnaire"
          forceMount
          className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <div className="mx-2 flex min-h-0 flex-1 flex-col rounded-t-xl border border-gray-200 bg-white md:mx-4">
            <FillHeader
              patient={patient}
              encounter={encounter}
              facilityId={facilityId}
              onCancel={() => navigate(exitTarget)}
              onSubmit={() => void submit()}
              isSubmitting={isPending}
              canSubmit
              onSaveDraft={
                serverDraftSave.canSaveDraft
                  ? serverDraftSave.saveDraft
                  : undefined
              }
              isSavingDraft={serverDraftSave.isSavingDraft}
            />
            <FillOutlineNavProvider scrollContainer={scrollHost}>
              <div className="relative flex min-h-0 flex-1">
                <FillOutlineOverlay
                  onPanelHost={setOutlineHost}
                  onRailHost={setRailHost}
                />
                <section
                  ref={setScrollHost}
                  aria-label={t("form_canvas")}
                  className="min-w-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-8"
                >
                  {autosave.restoredDraft && (
                    <DraftRestoreBar
                      draft={autosave.restoredDraft}
                      onResume={autosave.resumeRestoredDraft}
                      onDiscard={autosave.discardRestoredDraft}
                      onDismiss={autosave.dismissRestoreBar}
                    />
                  )}
                  <ServerErrorsPanel errors={serverErrors} />
                  {forms.map((form) => (
                    <FillFormSection
                      key={form.key}
                      form={form}
                      subject={rendererSubject}
                      outlineHost={outlineHost}
                      railHost={railHost}
                      outlineLabel={
                        forms.length > 1 ? form.questionnaire.title : undefined
                      }
                      onStore={handleStore}
                      onRemove={forms.length > 1 ? removeForm : undefined}
                      frozen={frozen}
                    />
                  ))}
                  {/* A resumed SERVER draft is one questionnaire's
                    submission by construction — no adding to it. */}
                  {!continueDraftId && (
                    <div className="mx-auto flex w-full max-w-3xl justify-center">
                      <QuestionnaireSearch
                        subjectType={pickerSubjectType}
                        onSelect={addQuestionnaireFromPicker}
                        // The default trigger is a `role="combobox"` button,
                        // and combobox takes no name from its contents — it
                        // would reach screen readers unnamed. This one is a
                        // plain button, so its label IS its name.
                        trigger={
                          <Button
                            type="button"
                            variant="outline"
                            className="border-primary-600 text-primary-800"
                            disabled={frozen}
                          >
                            <Plus className="size-4" />
                            {t("add_questionnaire")}
                          </Button>
                        }
                      />
                    </div>
                  )}
                  {/* Renders nothing unless a plugin provides Scribe. */}
                  <PLUGIN_Component
                    __name="Scribe"
                    actions={descriptors}
                    invoke={invoke}
                  />
                </section>
              </div>
            </FillOutlineNavProvider>
          </div>
        </TabsContent>

        {patientId && (
          <TabsContent
            value="history"
            forceMount={historyMounted || undefined}
            className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-6 data-[state=inactive]:hidden md:px-6"
          >
            {historyMounted && (
              <ClinicalHistoryTab
                patientId={patientId}
                facilityId={facilityId}
              />
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
