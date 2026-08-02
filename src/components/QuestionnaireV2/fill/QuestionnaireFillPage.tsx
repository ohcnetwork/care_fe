import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, X } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { FIXED_QUESTIONNAIRES } from "@/components/Questionnaire/data/StructuredFormData";

import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import useAuthUser from "@/hooks/useAuthUser";

import query from "@/Utils/request/query";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import type { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { DraftRestoreBar } from "./DraftRestoreBar";
import { FillCanvas } from "./FillCanvas";
import { FillHeader } from "./FillHeader";
import { FillOutline } from "./FillOutline";
import { ServerErrorsPanel } from "./ServerErrorsPanel";
import { sweepExpiredFillDrafts } from "./draft/fillDraftCache";
import type { FillDraftScope, LoadedFillDraft } from "./draft/fillDraftStore";
import { loadFillDraft, reviveDraftResponses } from "./draft/fillDraftStore";
import { useFillAutosave } from "./draft/useFillAutosave";
import { useSubmitQuestionnaire } from "./submit/useSubmitQuestionnaire";

interface FillPageProps {
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  questionnaireId?: string;
  subjectType?: string;
}

function exitTargetFor({
  facilityId,
  patientId,
  encounterId,
}: FillPageProps): string {
  if (encounterId && facilityId) {
    return `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/updates`;
  }
  if (facilityId) {
    return `/facility/${facilityId}/patient/${patientId}/updates`;
  }
  return `/patient/${patientId}/updates`;
}

/**
 * The v2 fill experience — the encounter/patient questionnaire data-entry
 * page (successor to EncounterQuestionnaire + the legacy
 * QuestionnaireForm). Two tabs per the reference: the questionnaire
 * canvas (with local autosave) and the patient's clinical history. The
 * host owns the form provider so submit and autosave share the one
 * instance store.
 */
export default function QuestionnaireFillPage(props: FillPageProps) {
  const { t } = useTranslation();
  const { facilityId, patientId, encounterId, questionnaireId, subjectType } =
    props;
  const [{ continue_draft: continueDraftId }] = useQueryParams();
  const user = useAuthUser();

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

  const { data: encounter, isLoading: isEncounterLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId ?? "" },
      queryParams: { facility: facilityId ?? "" },
    }),
    enabled: !!encounterId,
  });

  // Patient-subject fills have no encounter to borrow the patient from.
  const { data: fetchedPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: query(patientApi.get, { pathParams: { id: patientId } }),
    enabled: !encounterId,
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

  const scope: FillDraftScope | undefined =
    questionnaire && user
      ? {
          userId: user.id,
          subjectKey: encounterId ?? patientId,
          questionnaireId: questionnaire.id,
          questionnaireVersion: String(questionnaire.version),
        }
      : undefined;

  // Loaded once per (user, subject, questionnaire@version) — reruns of this
  // memo after autosave writes don't happen because the deps are stable.
  const scopeKey = scope
    ? `${scope.userId}--${scope.subjectKey}--${scope.questionnaireId}--${scope.questionnaireVersion}`
    : undefined;
  const localDraft = useMemo<LoadedFillDraft | undefined>(
    () =>
      scopeKey && scope && !continueDraftId ? loadFillDraft(scope) : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scopeKey, continueDraftId],
  );

  const exitTarget = exitTargetFor(props);

  if (!questionnaireId) {
    return (
      <FillShell onClose={() => navigate(exitTarget)}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            {t("select_questionnaire_to_fill")}
          </h2>
          <QuestionnaireSearch subjectType={subjectType} />
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
    <QuestionnaireFormProvider
      questionnaire={questionnaire}
      mode="fill"
      subject={{ patientId, encounterId, facilityId }}
      initialResponses={
        serverDraftState && !serverDraftState.mismatch
          ? serverDraftState.responses
          : undefined
      }
    >
      <FillPageBody
        questionnaire={questionnaire}
        patient={patient}
        encounter={encounter}
        facilityId={facilityId}
        patientId={patientId}
        encounterId={encounterId}
        scope={scope}
        localDraft={localDraft}
        continueDraftId={continueDraftId}
        exitTarget={exitTarget}
      />
    </QuestionnaireFormProvider>
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
  facilityId?: string;
  patientId: string;
  encounterId?: string;
  scope: FillDraftScope | undefined;
  localDraft: LoadedFillDraft | undefined;
  continueDraftId?: string;
  exitTarget: string;
}

function FillPageBody({
  questionnaire,
  patient,
  encounter,
  facilityId,
  patientId,
  encounterId,
  scope,
  localDraft,
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

  // Local autosave stands down while resuming a SERVER draft — the server
  // copy is authoritative there and keeps its own lifecycle.
  const autosave = useFillAutosave({
    scope: continueDraftId ? undefined : scope,
    restoredDraft: localDraft,
  });

  const { submit, isPending, serverErrors } = useSubmitQuestionnaire({
    questionnaire,
    subject: { patientId, encounterId, facilityId },
    continueDraftId,
    onSuccess: () => {
      // Order matters: finishDraft flushes the pristine state before the
      // redirect so useNavigationPrompt doesn't block it.
      autosave.finishDraft();
      navigate(exitTarget);
    },
  });

  useNavigationPrompt(
    autosave.dirty && !import.meta.env.DEV,
    t("unsaved_changes"),
  );

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
            />
            <div className="flex min-h-0 flex-1">
              <aside className="hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 p-3 lg:block">
                <FillOutline />
              </aside>
              <section
                aria-label={t("form_canvas")}
                className="min-w-0 flex-1 overflow-y-auto px-4 py-5 md:px-8"
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
                <FillCanvas />
              </section>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="history"
          forceMount={historyMounted || undefined}
          className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-6 data-[state=inactive]:hidden md:px-6"
        >
          {historyMounted && (
            <ClinicalHistoryTab patientId={patientId} facilityId={facilityId} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
