import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  errorsAtom,
  responsesAtom,
  structuredRenderFailedAtom,
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

import {
  MissingEncounterError,
  StructuredBuildError,
  composeBatch,
} from "./composeBatch";
import type { ServerValidationError } from "./mapBatchErrors";
import { mapBatchErrors } from "./mapBatchErrors";
import { collectStructuredErrors } from "./validateStructured";

/**
 * The backend's `/api/v1/batch_requests/` endpoint hard-caps the number of
 * sub-requests per call (`MAX_REQUESTS_PER_BATCH_REQUEST` in the care
 * backend settings) and 400s the WHOLE batch past it — a generic error the
 * clinician would only see after filling in every question. Checked here so
 * the abort is specific and costs no network round trip.
 */
const MAX_BATCH_REQUESTS = 20;

interface UseSubmitFillSessionArgs {
  /** Every questionnaire in the session, primary first. */
  forms: FillFormEntry[];
  getStore: (key: string) => FormStore | undefined;
  subject: FillSubject;
  continueDraftId?: string;
  /** Titles of drafted forms the session is currently carrying WITHOUT a
   *  live store — a resume whose re-fetch of an added questionnaire
   *  failed and is still retained in the draft (see
   *  `QuestionnaireFillPage`'s `retainedSnapshots`). Submitting anyway
   *  would clear the draft in `onSuccess` and take those answers with it,
   *  having never been in the batch. */
  blockedFormLabels: string[];
  onSuccess: () => void;
}

/**
 * Reveal the first failing question after its error has rendered. Focus moves
 * to the input or block as well as scrolling, so keyboard and screen-reader
 * users land on the error context rather than staying on Save.
 */
function scrollToQuestion(questionId: string) {
  setTimeout(() => {
    const block = document.querySelector<HTMLElement>(
      `[data-question-id="${questionId}"]`,
    );
    if (!block) return;
    block.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
    const input = document.getElementById(`question-input-${questionId}`);
    if (input) {
      input.focus({ preventScroll: true });
      return;
    }
    block.setAttribute("tabindex", "-1");
    block.focus({ preventScroll: true });
  });
}

/** `error.cause` off the wire is untyped — accept it as a batch failure
 *  payload only when it structurally carries a `results` array. */
function hasBatchResults(
  cause: unknown,
): cause is { results: Parameters<typeof mapBatchErrors>[0] } {
  return (
    typeof cause === "object" &&
    cause !== null &&
    Array.isArray((cause as { results?: unknown }).results)
  );
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
 * The fill host's submit action. It lives outside the form providers and
 * reaches each form's instance store through the host registry, so one
 * click submits the whole session.
 *
 * Flow: client validation runs per form, writes failures into that form's
 * `errorsAtom` and aborts with a scroll to the first one; otherwise every
 * form composes its requests into one batch, and failures map back by
 * reference_id into the owning form's `errorsAtom` plus the page panel.
 */
export function useSubmitFillSession({
  forms,
  getStore,
  subject,
  continueDraftId,
  blockedFormLabels,
  onSuccess,
}: UseSubmitFillSessionArgs) {
  const { t } = useTranslation();
  const [serverErrors, setServerErrors] = useState<ServerValidationError[]>([]);

  const { mutate: submitBatch, isPending } = useMutation({
    // Silent: batch failures are handled here (panel + per-question), not
    // by the global error toast.
    // TODO: migrate to useBatchRequest once it can take pre-built batch
    // entries (these requests carry raw urls) and can opt out of the
    // global error toast.
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    mutationFn: mutate(batchApi.batchRequest, { silent: true }),
    onSuccess: () => {
      setServerErrors([]);
      toast.success(t("questionnaire_submitted_successfully"));
      onSuccess();
    },
    onError: (error) => {
      if (hasBatchResults(error.cause)) {
        const mapped = mapBatchErrors(
          error.cause.results,
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

  const runSubmit = useCallback(async () => {
    // 0) Every session form must have a live store to read responses from,
    //    and nothing may be sitting in the draft as a retained-but-
    //    unmounted snapshot (`blockedFormLabels` — a resume whose re-fetch
    //    of an added questionnaire failed). Either condition means this
    //    batch would silently omit that form's answers — the validation
    //    loop and compose below just `continue`/skip a missing store with
    //    no signal — and a successful submit's `onSuccess` clears the
    //    WHOLE draft, retained snapshots included, even though they were
    //    never in the batch. Abort before validation even runs.
    const missingStoreForms = forms.filter((form) => !getStore(form.key));
    if (missingStoreForms.length > 0 || blockedFormLabels.length > 0) {
      const names = [
        ...missingStoreForms.map((form) => form.questionnaire.title),
        ...blockedFormLabels,
      ];
      toast.error(
        t("questionnaire_submit_missing_forms", { forms: names.join(", ") }),
      );
      return;
    }

    // 1) Validate every form against its own store; the first failure
    //    anywhere in the session decides where we scroll. The renderer's
    //    flat subject view and the form's render-failed set go in so the
    //    required check can tell a structured question that HAS an input
    //    from one showing a notice (see form/validation.ts).
    const rendererSubject = rendererSubjectOf(subject);
    let firstError: { formKey: string; questionId: string } | undefined;
    for (const form of forms) {
      const store = getStore(form.key);
      if (!store) continue;
      const responses = store.get(responsesAtom);
      const renderFailed = store.get(structuredRenderFailedAtom);
      const clientErrors: QuestionValidationError[] = [
        ...collectRequiredErrors(form.questionnaire.questions, responses, t, {
          questionnaire: form.questionnaire,
          subject: rendererSubject,
          renderFailed,
        }),
        ...collectStructuredErrors(
          form.questionnaire,
          responses,
          rendererSubject,
          renderFailed,
          t,
        ),
      ];
      store.set(errorsAtom, clientErrors);
      if (clientErrors.length > 0 && !firstError) {
        // "First" in the clinician's reading order, not in validator
        // order — the array concatenates every required failure before
        // any structured one, so its head can sit far below an earlier
        // failing question on screen.
        const failing = new Set(clientErrors.map((error) => error.question_id));
        const inTreeOrder = (questions: Question[]): string | undefined => {
          for (const question of questions) {
            if (failing.has(question.id)) return question.id;
            const found = inTreeOrder(question.questions ?? []);
            if (found) return found;
          }
          return undefined;
        };
        firstError = {
          formKey: form.key,
          questionId:
            inTreeOrder(form.questionnaire.questions) ??
            clientErrors[0].question_id,
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
              renderFailed: store.get(structuredRenderFailedAtom),
              continueDraftId: form.isPrimary ? continueDraftId : undefined,
            });
          }),
        )
      ).flat();
    } catch (error) {
      // An encounter-subject questionnaire is being filled from the patient
      // route — a mount the fill page admits, but one the backend's submit
      // endpoint cannot serve (it demands an encounter). Blocked here, with
      // the questionnaire named, so the clinician can reopen it from the
      // encounter instead of discovering it through an atomic rollback.
      if (error instanceof MissingEncounterError) {
        toast.error(
          t("questionnaire_submit_requires_encounter", {
            title: error.questionnaireTitle,
          }),
        );
        return;
      }
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
    // The backend rejects the whole batch past this — see
    // `MAX_BATCH_REQUESTS`. Caught here, before any network call, so the
    // clinician learns exactly what to trim instead of reading a generic
    // 400 after everything was already typed in.
    if (requests.length > MAX_BATCH_REQUESTS) {
      toast.error(
        t("questionnaire_batch_too_large", {
          count: requests.length,
          max: MAX_BATCH_REQUESTS,
        }),
      );
      return;
    }
    submitBatch({ requests });
  }, [
    forms,
    getStore,
    subject,
    continueDraftId,
    blockedFormLabels,
    submitBatch,
    t,
  ]);

  // Compose runs BEFORE the mutation starts, and structured
  // `buildRequests` are async — during that window the mutation's
  // isPending is still false, so a second click would validate and
  // compose a second identical batch. The ref closes the window
  // synchronously (state alone leaves the same-tick gap); the state twin
  // keeps the button disabled for the same span.
  const composingRef = useRef(false);
  const [isComposing, setIsComposing] = useState(false);

  /**
   * The one entry point, and the outermost containment boundary. The page
   * fires this as `onSubmit={() => void submit()}`, so ANY escaping
   * rejection — a plugin component's getter, a malformed store record, a
   * future call added inside `runSubmit` — would become an unhandled
   * promise rejection and turn Save Changes into a silent no-op. Failing
   * loudly is the floor: the clinician always learns the submission did
   * not happen, and the original error still reaches the console for the
   * developer.
   */
  const submit = useCallback(async () => {
    if (composingRef.current || isPending) return;
    composingRef.current = true;
    setIsComposing(true);
    try {
      await runSubmit();
    } catch (error) {
      console.error("Questionnaire submission failed unexpectedly", error);
      toast.error(t("questionnaire_submission_failed"));
    } finally {
      composingRef.current = false;
      setIsComposing(false);
    }
  }, [runSubmit, isPending, t]);

  return {
    submit,
    isPending: isPending || isComposing,
    // Exposed separately (rather than only folded into `isPending` above)
    // so a consumer that needs the tri-state distinction — composing the
    // batch vs. the request actually in flight — can derive it without
    // reaching into this hook's internals. Nothing here changes: the
    // combined `isPending` a caller was already reading is untouched.
    isComposing,
    serverErrors,
  };
}
