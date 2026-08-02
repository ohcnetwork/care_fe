import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, X } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

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
import { ServerErrorsPanel } from "./ServerErrorsPanel";
import type { FormStore } from "./StoreRegistrar";
import { sweepExpiredFillDrafts } from "./draft/fillDraftCache";
import type {
  DraftFormSnapshot,
  FillDraftScope,
  LoadedFillDraft,
} from "./draft/fillDraftStore";
import {
  loadFillDraft,
  mergeDraftIntoSeed,
  reviveDraftResponses,
} from "./draft/fillDraftStore";
import { useFillSessionAutosave } from "./draft/useFillAutosave";
import { useSaveServerDraft } from "./draft/useSaveServerDraft";
import type { FillFormEntry } from "./formSession";
import type { FillSubject } from "./subject";
import {
  exitTargetOf,
  isPatientBound,
  rendererSubjectOf,
  subjectKeyOf,
} from "./subject";
import { useSubmitFillSession } from "./submit/useSubmitQuestionnaire";
import { useFillActions } from "./useFillActions";

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
  const { data: encounter, isLoading: isEncounterLoading } = useQuery({
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
  const { data: fetchedPatient } = useQuery({
    queryKey: ["patient", patientBound?.patientId],
    queryFn: query(patientApi.get, {
      pathParams: { id: patientBound?.patientId ?? "" },
    }),
    enabled: subject.type === "patient",
  });

  const { data: serverDraft, isFetching: isServerDraftLoading } = useQuery({
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
              route for every subject. */}
          <QuestionnaireSearch subjectType={pickerSubjectType} />
        </div>
      </FillShell>
    );
  }

  if (
    isQuestionnaireLoading ||
    (encounterId && isEncounterLoading) ||
    (continueDraftId && isServerDraftLoading)
  ) {
    return <FormSkeleton rows={10} />;
  }

  if (isQuestionnaireError || !questionnaire) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("no_data_found")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(exitTarget)}>
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  if (serverDraftState?.mismatch) {
    return (
      <div className="space-y-4 p-6">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("draft_not_recoverable")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(exitTarget)}>
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
      </div>
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
      <div className="flex shrink-0 items-center justify-between gap-2 px-4 pt-3 md:px-6">
        {tabs ?? <div />}
        <Button
          type="button"
          variant="outline"
          size="icon"
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
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"questionnaire" | "history">("questionnaire");
  // History mounts on first activation and stays mounted after (hidden) —
  // eager mounting would fire its queries and leak its text into the DOM
  // for sessions that never open it, while unmount-on-switch would blank
  // adapted structured widgets that keep local state.
  const [historyMounted, setHistoryMounted] = useState(false);

  // The session: the route-mounted questionnaire plus anything added to
  // the same submission. Each entry owns one provider and one store.
  const [forms, setForms] = useState<FillFormEntry[]>(() => [
    {
      key: questionnaire.id,
      questionnaire,
      isPrimary: true,
      initialResponses: serverDraftResponses,
    },
  ]);
  const storesRef = useRef(new Map<string, FormStore>());
  const [storesVersion, setStoresVersion] = useState(0);
  const handleStore = useCallback((key: string, store: FormStore | null) => {
    if (store) storesRef.current.set(key, store);
    else storesRef.current.delete(key);
    setStoresVersion((version) => version + 1);
  }, []);
  const getStore = useCallback((key: string) => storesRef.current.get(key), []);

  const addQuestionnaire = useCallback(
    (
      added: QuestionnaireRead,
      initialResponses?: Record<string, QuestionnaireResponse>,
    ) => {
      setForms((previous) =>
        previous.some((form) => form.key === added.id)
          ? previous
          : [
              ...previous,
              {
                key: added.id,
                questionnaire: added,
                isPrimary: false,
                initialResponses,
              },
            ],
      );
    },
    [],
  );
  const removeForm = useCallback((key: string) => {
    setForms((previous) =>
      previous.filter((form) => form.key !== key || form.isPrimary),
    );
  }, []);

  /** Resume for the non-primary snapshots: re-fetch each questionnaire,
   *  drop the ones whose version moved on (their answers can no longer be
   *  trusted onto the new tree), and seed the rest. */
  const onResumeAddedForms = useCallback(
    (snapshots: DraftFormSnapshot[]) => {
      void (async () => {
        for (const snapshot of snapshots) {
          try {
            const fetched = await queryClient.fetchQuery({
              queryKey: questionnaireKeys.detail(snapshot.questionnaireId),
              queryFn: query(questionnaireApi.get, {
                pathParams: { id: snapshot.questionnaireId },
              }),
            });
            if (String(fetched.version) !== snapshot.questionnaireVersion) {
              toast.warning(
                t("fill_draft_form_dropped", { title: fetched.title }),
              );
              continue;
            }
            addQuestionnaire(
              fetched,
              mergeDraftIntoSeed(fetched.questions, snapshot.responses),
            );
          } catch {
            toast.warning(
              t("fill_draft_form_dropped", { title: snapshot.questionnaireId }),
            );
          }
        }
      })();
    },
    [queryClient, addQuestionnaire, t],
  );

  // The outline lives in one shared aside; each form portals its own
  // section into it (it must render inside that form's provider).
  const [outlineHost, setOutlineHost] = useState<HTMLElement | null>(null);

  // The renderer's flat subject view. Memoized on its PRIMITIVES: the
  // union arrives as a fresh object literal from the route element on
  // every render, so keying on the object itself would never hit.
  const { patientId, encounterId, facilityId, resourceId } =
    rendererSubjectOf(subject);
  const rendererSubject = useMemo(
    () => ({ patientId, encounterId, facilityId, resourceId }),
    [patientId, encounterId, facilityId, resourceId],
  );

  // Local autosave stands down while resuming a SERVER draft — the server
  // copy is authoritative there and keeps its own lifecycle.
  const autosave = useFillSessionAutosave({
    scope: continueDraftId ? undefined : scope,
    forms,
    getStore,
    storesVersion,
    restoredDraft: localDraft,
    onResumeAddedForms,
  });

  const { submit, isPending, serverErrors } = useSubmitFillSession({
    forms,
    getStore,
    subject,
    continueDraftId,
    onSuccess: () => {
      // Order matters: finishDraft flushes the pristine state before the
      // redirect so useNavigationPrompt doesn't block it.
      autosave.finishDraft();
      navigate(exitTarget);
    },
  });

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
              same slot, draft badge included. */}
          {patientId ? (
            <TabsList>
              <TabsTrigger value="questionnaire">
                {t("questionnaire_one")}
                {autosave.dirty && (
                  <Badge className="ml-2 bg-indigo-100 text-indigo-900">
                    {t("draft")}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="history">
                {t("patient_clinical_history")}
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="flex items-center gap-2 py-1.5 text-sm font-medium text-gray-900">
              {t("questionnaire_one")}
              {autosave.dirty && (
                <Badge className="bg-indigo-100 text-indigo-900">
                  {t("draft")}
                </Badge>
              )}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            size="icon"
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
            <div className="flex min-h-0 flex-1">
              <aside
                ref={setOutlineHost}
                className="hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 p-3 lg:block"
              />
              <section
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
                    outlineLabel={
                      forms.length > 1 ? form.questionnaire.title : undefined
                    }
                    onStore={handleStore}
                    onRemove={forms.length > 1 ? removeForm : undefined}
                  />
                ))}
                {/* A resumed SERVER draft is one questionnaire's
                    submission by construction — no adding to it. */}
                {!continueDraftId && (
                  <div className="mx-auto flex w-full max-w-3xl justify-center">
                    <QuestionnaireSearch
                      subjectType={pickerSubjectType}
                      onSelect={(selected) => addQuestionnaire(selected)}
                      // The default trigger is a `role="combobox"` button,
                      // and combobox takes no name from its contents — it
                      // would reach screen readers unnamed. This one is a
                      // plain button, so its label IS its name.
                      trigger={
                        <Button
                          type="button"
                          variant="outline"
                          className="border-primary-600 text-primary-800"
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
