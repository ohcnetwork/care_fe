import { useMutation } from "@tanstack/react-query";
import { useStore } from "jotai";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { collectRequiredErrors } from "@/components/QuestionnaireV2/form/validation";
import {
  errorsAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/renderer/store";

import mutate from "@/Utils/request/mutate";
import batchApi from "@/types/base/batch/batchApi";
import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { composeBatch } from "./composeBatch";
import type { ServerValidationError } from "./mapBatchErrors";
import { mapBatchErrors } from "./mapBatchErrors";
import { collectStructuredErrors } from "./validateStructured";

export interface SubmitSubject {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
}

interface UseSubmitQuestionnaireArgs {
  questionnaire: QuestionnaireRead;
  subject: SubmitSubject;
  continueDraftId?: string;
  onSuccess: () => void;
}

/** Scroll the first failing question into view — every block carries the
 *  `data-question-id` anchor. Deferred a tick so the error render exists
 *  before we measure (same reason legacy used setTimeout). */
function scrollToQuestion(questionId: string) {
  setTimeout(() => {
    document
      .querySelector(`[data-question-id="${questionId}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

/**
 * The fill host's submit action — the errorsAtom writer the engine
 * documented since the fill seams landed. Must be called from inside
 * `QuestionnaireFormProvider` (reads the instance store via `useStore`).
 *
 * Flow: client validation (required + structured registry validators)
 * writes failures into `errorsAtom` and aborts with a scroll to the first
 * one; otherwise the batch composes and submits silently, and failures
 * map back per reference_id into `errorsAtom` + the page-level panel.
 */
export function useSubmitQuestionnaire({
  questionnaire,
  subject,
  continueDraftId,
  onSuccess,
}: UseSubmitQuestionnaireArgs) {
  const { t } = useTranslation();
  const store = useStore();
  const [serverErrors, setServerErrors] = useState<ServerValidationError[]>([]);

  const { mutate: submitBatch, isPending } = useMutation({
    // Silent: batch failures are handled here (panel + per-question), not
    // by the global error toast.
    // TODO: migrate to useBatchRequest once it can take pre-built batch
    // entries (these requests carry raw urls) and can opt out of the
    // global error toast — same blocker the legacy form recorded.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    mutationFn: mutate(batchApi.batchRequest, { silent: true }),
    onSuccess: () => {
      setServerErrors([]);
      toast.success(t("questionnaire_submitted_successfully"));
      onSuccess();
    },
    onError: (error) => {
      const errorData = error.cause as
        | {
            results?: Parameters<typeof mapBatchErrors>[0];
          }
        | undefined;
      if (errorData?.results) {
        const mapped = mapBatchErrors(
          errorData.results,
          t("validation_failed"),
        );
        setServerErrors(mapped.serverErrors);
        if (mapped.questionErrors.length > 0) {
          store.set(errorsAtom, mapped.questionErrors);
          scrollToQuestion(mapped.questionErrors[0].question_id);
        }
      }
      toast.error(t("questionnaire_submission_failed"));
    },
  });

  const submit = useCallback(async () => {
    const responses = store.get(responsesAtom);

    const clientErrors: QuestionValidationError[] = [
      ...collectRequiredErrors(questionnaire.questions, responses, t),
      ...collectStructuredErrors(questionnaire.questions, responses),
    ];
    if (clientErrors.length > 0) {
      store.set(errorsAtom, clientErrors);
      scrollToQuestion(clientErrors[0].question_id);
      return;
    }
    store.set(errorsAtom, []);
    setServerErrors([]);

    const requests = await composeBatch({
      questionnaire,
      responses,
      subject,
      continueDraftId,
    });
    if (requests.length === 0) {
      toast.error(t("no_answers_to_submit"));
      return;
    }
    submitBatch({ requests });
  }, [store, questionnaire, subject, continueDraftId, submitBatch, t]);

  return { submit, isPending, serverErrors };
}
