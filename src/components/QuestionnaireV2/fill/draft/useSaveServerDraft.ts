import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import { isPatientBound } from "@/components/QuestionnaireV2/fill/subject";

import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import type { Question } from "@/types/questionnaire/question";
import mutate from "@/Utils/request/mutate";

interface UseSaveServerDraftArgs {
  /** Every questionnaire in the session, primary first. */
  forms: FillFormEntry[];
  getStore: (key: string) => FormStore | undefined;
  subject: FillSubject;
  /** Set when this session resumed a server draft — saving PUTs the same
   *  record instead of creating a second one. */
  continueDraftId?: string;
  /** The server copy is now authoritative: the host drops the local
   *  autosave draft, flushes pristine and leaves the page. */
  onSaved: () => void;
}

/** Does any question in the tree record a structured resource? */
function hasStructuredQuestion(questions: Question[]): boolean {
  return questions.some(
    (question) =>
      question.type === "structured" ||
      (question.type === "group" &&
        hasStructuredQuestion(question.questions ?? [])),
  );
}

/**
 * The deliberate "Save as draft" — a SERVER draft (`form_submission` with
 * status `draft`), which is what makes a half-finished form reachable from
 * another device and from the encounter overview's drafts card. It is a
 * different thing from `useFillSessionAutosave`, the crash-safety net that
 * writes localStorage only: this one is explicit, survives the browser, and
 * ends the session.
 *
 * The legacy availability rules are preserved exactly, because the dump's
 * shape is what constrains them:
 * - feature-flagged (`enableQuestionnaireDraft`);
 * - patient-bound subjects only — the record carries `patient` (and
 *   `encounter`), which a location/device fill has nothing to put in;
 * - a single form per session — `response_dump.questionnaireResponses` is
 *   ONE `{questionnaire, responses}` pair, so a multi-form session cannot
 *   be represented without silently dropping forms;
 * - no structured question anywhere in the tree — structured values
 *   conflate prefetched server rows with user input, so restoring them
 *   later could re-upsert clinical data edited elsewhere (the same reason
 *   `draftPolicy: "exclude"` exists for the local draft).
 *
 * Resuming a server draft and saving it again IS allowed: that PUTs the
 * same id, which is how a draft gets iterated across sessions.
 */
export function useSaveServerDraft({
  forms,
  getStore,
  subject,
  continueDraftId,
  onSaved,
}: UseSaveServerDraftArgs) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const patientBound = isPatientBound(subject) ? subject : undefined;
  const encounterId =
    subject.type === "encounter" ? subject.encounterId : undefined;
  const primary = forms.find((form) => form.isPrimary);

  const canSaveDraft = useMemo(() => {
    if (!careConfig.enableQuestionnaireDraft) return false;
    if (!patientBound || !primary) return false;
    if (forms.length !== 1) return false;
    return !hasStructuredQuestion(primary.questionnaire.questions);
  }, [patientBound, primary, forms.length]);

  const handleSaved = useCallback(() => {
    if (continueDraftId) {
      queryClient.invalidateQueries({
        queryKey: ["formSubmission", continueDraftId],
      });
    }
    // The encounter overview's drafts card lists these.
    queryClient.invalidateQueries({ queryKey: ["formSubmissions"] });
    toast.success(t("draft_saved_successfully"));
    onSaved();
  }, [continueDraftId, queryClient, t, onSaved]);

  const handleFailed = useCallback(() => {
    toast.error(t("draft_save_failed"));
  }, [t]);

  const { mutate: createDraft, isPending: isCreating } = useMutation({
    mutationFn: mutate(formSubmissionApi.create),
    onSuccess: handleSaved,
    onError: handleFailed,
  });

  const { mutate: updateDraft, isPending: isUpdating } = useMutation({
    mutationFn: mutate(formSubmissionApi.update, {
      pathParams: { external_id: continueDraftId ?? "" },
    }),
    onSuccess: handleSaved,
    onError: handleFailed,
  });

  const saveDraft = useCallback(() => {
    if (!canSaveDraft || !primary || !patientBound) return;
    const store = getStore(primary.key);
    if (!store) return;

    // Exactly the shape this page's own `?continue_draft=` restore parses,
    // and the one `composeBatch` finalizes on submit.
    const response_dump = {
      questionnaireResponses: {
        questionnaire: primary.questionnaire,
        responses: Object.values(store.get(responsesAtom)),
        errors: [],
      },
    };

    if (continueDraftId) {
      updateDraft({ status: "draft", response_dump });
      return;
    }
    createDraft({
      patient: patientBound.patientId,
      questionnaire: primary.questionnaire.slug,
      encounter: encounterId,
      status: "draft",
      response_dump,
    });
  }, [
    canSaveDraft,
    primary,
    patientBound,
    getStore,
    continueDraftId,
    encounterId,
    createDraft,
    updateDraft,
  ]);

  return { canSaveDraft, saveDraft, isSavingDraft: isCreating || isUpdating };
}
