import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  errorsAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import { collectRequiredErrors } from "@/components/QuestionnaireV2/form/validation";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import { rendererSubjectOf } from "@/components/QuestionnaireV2/fill/subject";

import batchApi from "@/types/base/batch/batchApi";
import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { Question } from "@/types/questionnaire/question";
import mutate from "@/Utils/request/mutate";

import { StructuredBuildError, composeBatch } from "./composeBatch";
import type { ServerValidationError } from "./mapBatchErrors";
import { mapBatchErrors } from "./mapBatchErrors";
import { collectStructuredErrors } from "./validateStructured";

interface UseSubmitFillSessionArgs {
  /** Every questionnaire in the session, primary first. */
  forms: FillFormEntry[];
  getStore: (key: string) => FormStore | undefined;
  subject: FillSubject;
  continueDraftId?: string;
  onSuccess: () => void;
}

/**
 * Reveal the first failing question — every block carries the
 * `data-question-id` anchor and every input the `question-input-{id}` one.
 * Deferred a tick so the error render exists before we measure (same
 * reason legacy used setTimeout).
 *
 * Focus moves as well as the scroll: a `scrollIntoView` alone leaves a
 * keyboard or screen-reader user parked on the Save button with no way to
 * find what failed. Where the question has no focusable input of its own
 * (structured sections, unsupported types) the block itself takes focus
 * through a programmatic-only tabindex, so the error text right below it
 * is what gets read.
 */
function scrollToQuestion(questionId: string) {
  setTimeout(() => {
    const block = document.querySelector<HTMLElement>(
      `[data-question-id="${questionId}"]`,
    );
    if (!block) return;
    block.scrollIntoView({ block: "center", behavior: "smooth" });
    const input = document.getElementById(`question-input-${questionId}`);
    if (input) {
      input.focus({ preventScroll: true });
      return;
    }
    block.setAttribute("tabindex", "-1");
    block.focus({ preventScroll: true });
  });
}

/** `questionId → formKey` across the whole session, so a batch failure
 *  lands in the store of the form that owns the question. */
function buildQuestionOwnerIndex(forms: FillFormEntry[]): Map<string, string> {
  const questionToForm = new Map<string, string>();
  for (const form of forms) {
    const walk = (questions: Question[]) => {
      for (const question of questions) {
        questionToForm.set(question.id, form.key);
        if (question.questions) walk(question.questions);
      }
    };
    walk(form.questionnaire.questions);
  }
  return questionToForm;
}

/**
 * The fill host's submit action — the errorsAtom writer the engine
 * documented since the fill seams landed. Lives outside the form
 * providers and reaches each form's instance store through the host's
 * registry, so one click submits the whole session.
 *
 * Flow: client validation (required + structured registry validators)
 * runs per form, writes failures into that form's `errorsAtom` and aborts
 * with a scroll to the first one; otherwise every form composes its
 * requests into ONE batch (legacy semantics — the added questionnaires
 * ride along with the primary), and failures map back per reference_id
 * into the owning form's `errorsAtom` plus the page-level panel.
 */
export function useSubmitFillSession({
  forms,
  getStore,
  subject,
  continueDraftId,
  onSuccess,
}: UseSubmitFillSessionArgs) {
  const { t } = useTranslation();
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

        // Route each question failure to the form that owns it — the
        // batch is flat, the stores are not.
        const questionToForm = buildQuestionOwnerIndex(forms);
        const byForm = new Map<string, QuestionValidationError[]>();
        for (const questionError of mapped.questionErrors) {
          const formKey = questionToForm.get(questionError.question_id);
          if (!formKey) continue;
          byForm.set(formKey, [...(byForm.get(formKey) ?? []), questionError]);
        }
        for (const form of forms) {
          getStore(form.key)?.set(errorsAtom, byForm.get(form.key) ?? []);
        }
        if (mapped.questionErrors.length > 0) {
          scrollToQuestion(mapped.questionErrors[0].question_id);
        }
      }
      toast.error(t("questionnaire_submission_failed"));
    },
  });

  const submit = useCallback(async () => {
    // 1) Validate every form against its own store; the first failure
    //    anywhere in the session decides where we scroll. The renderer's
    //    flat subject view goes in so the required check can tell a
    //    structured question that HAS an input from one showing a
    //    placeholder (see form/validation.ts).
    const rendererSubject = rendererSubjectOf(subject);
    let firstError: { formKey: string; questionId: string } | undefined;
    for (const form of forms) {
      const store = getStore(form.key);
      if (!store) continue;
      const responses = store.get(responsesAtom);
      const clientErrors: QuestionValidationError[] = [
        ...collectRequiredErrors(form.questionnaire.questions, responses, t, {
          questionnaire: form.questionnaire,
          subject: rendererSubject,
        }),
        ...collectStructuredErrors(
          form.questionnaire,
          responses,
          rendererSubject,
          t,
        ),
      ];
      store.set(errorsAtom, clientErrors);
      if (clientErrors.length > 0 && !firstError) {
        firstError = {
          formKey: form.key,
          questionId: clientErrors[0].question_id,
        };
      }
    }
    if (firstError) {
      // The per-question messages are `role="alert"` and focus lands on
      // the first failure, but the abort itself needs saying out loud too:
      // without it a screen-reader user who pressed Save Changes gets no
      // signal that the submission was rejected at all.
      toast.error(t("validation_failed"));
      scrollToQuestion(firstError.questionId);
      return;
    }
    setServerErrors([]);

    // 2) One batch across all forms (composeBatch already orders
    //    structured requests first WITHIN a form). Only the primary form
    //    carries the resumed server draft's completion PUT.
    let requests: Awaited<ReturnType<typeof composeBatch>>;
    try {
      requests = (
        await Promise.all(
          forms.map((form) => {
            const store = getStore(form.key);
            if (!store) return Promise.resolve([]);
            return composeBatch({
              questionnaire: form.questionnaire,
              responses: store.get(responsesAtom),
              subject,
              continueDraftId: form.isPrimary ? continueDraftId : undefined,
            });
          }),
        )
      ).flat();
    } catch (error) {
      // A structured type's `buildRequests` threw. Pin it to the question
      // that produced it in that question's own store, and fail the way
      // every other submission failure fails — never as a silent no-op.
      if (!(error instanceof StructuredBuildError)) throw error;
      const formKey = buildQuestionOwnerIndex(forms).get(error.questionId);
      for (const form of forms) {
        getStore(form.key)?.set(
          errorsAtom,
          form.key === formKey
            ? [
                {
                  question_id: error.questionId,
                  error: t("structured_question_submit_failed"),
                },
              ]
            : [],
        );
      }
      toast.error(t("questionnaire_submission_failed"));
      scrollToQuestion(error.questionId);
      return;
    }
    if (requests.length === 0) {
      toast.error(t("no_answers_to_submit"));
      return;
    }
    submitBatch({ requests });
  }, [forms, getStore, subject, continueDraftId, submitBatch, t]);

  return { submit, isPending, serverErrors };
}
