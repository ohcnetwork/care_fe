import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import { isV2Definition } from "@/components/QuestionnaireV2/structured/contract";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import { draftResponseForStorage } from "@/components/QuestionnaireV2/fill/draft/fillDraftStore";
import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";

import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
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

/**
 * The structured questions in this tree that a SERVER draft cannot
 * faithfully carry, by `structured_type`.
 *
 * Contract v1 conflates prefetched server rows with user input in
 * `values[0].value`, so a dump restores stale clinical rows and can
 * re-upsert data edited elsewhere — the same reason `draftPolicy:
 * "exclude"` exists for the local draft, and the reason the original gate
 * refused ANY structured question. Contract v2 dumps the EDIT LOG, which
 * is user intent alone and re-projects onto a freshly fetched baseline, so
 * it lifts that refusal — except where the values cannot round-trip at all
 * (`draftPolicy: "exclude"` — `files`), and except for a type this
 * deployment cannot resolve, whose contract is simply unknown.
 */
function unsupportedDraftStructuredTypes(questions: Question[]): string[] {
  const blocking: string[] = [];
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      if (question.type !== "structured" || !question.structured_type) {
        continue;
      }
      const resolved = resolveStructuredType(question.structured_type);
      if (
        !resolved ||
        !isV2Definition(resolved) ||
        resolved.draftPolicy === "exclude"
      ) {
        blocking.push(question.structured_type);
      }
    }
  };
  walk(questions);
  return blocking;
}

/**
 * The deliberate "Save as draft" — a SERVER draft (`form_submission` with
 * status `draft`), which is what makes a half-finished form reachable from
 * another device and from the encounter overview's drafts card. It is a
 * different thing from `useFillSessionAutosave`, the crash-safety net that
 * writes localStorage only: this one is explicit, survives the browser, and
 * ends the session.
 *
 * The availability rules follow from the dump's shape and from the way
 * drafts are FOUND again:
 * - feature-flagged (`enableQuestionnaireDraft`);
 * - encounter subjects only. This one is a DELIBERATE NARROWING of legacy,
 *   not a port of it: legacy offered "Save as draft" on its patient mount
 *   too, and those saves produced orphaned records. The sole listing of
 *   server drafts is the encounter overview's card, which filters
 *   `form_submission` by `encounter`; a patient-mount draft POSTs without
 *   one, so nothing can ever surface it — and saving also drops the local
 *   autosave copy, making that draft unreachable rather than merely
 *   inconvenient. Widening this back needs a listing surface first;
 * - a single form per session — `response_dump.questionnaireResponses` is
 *   ONE `{questionnaire, responses}` pair, so a multi-form session cannot
 *   be represented without silently dropping forms;
 * - no structured question this deployment cannot dump faithfully
 *   (`unsupportedDraftStructuredTypes`): a contract-v1 type conflates
 *   prefetched server rows with user input, so restoring its dump later
 *   could re-upsert clinical data edited elsewhere (the same reason
 *   `draftPolicy: "exclude"` exists for the local draft) — contract v2
 *   dumps the edit log alone and re-projects onto a fresh baseline, so it
 *   lifts that restriction, except for `files` (`draftPolicy: "exclude"`
 *   under both contracts) and a type this deployment cannot resolve.
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

  const encounterBound = subject.type === "encounter" ? subject : undefined;
  const primary = forms.find((form) => form.isPrimary);

  const canSaveDraft = useMemo(() => {
    if (!careConfig.enableQuestionnaireDraft) return false;
    if (!encounterBound || !primary) return false;
    if (forms.length !== 1) return false;
    return (
      unsupportedDraftStructuredTypes(primary.questionnaire.questions)
        .length === 0
    );
  }, [encounterBound, primary, forms.length]);

  const handleSaved = useCallback(
    (saved: FormSubmissionRead) => {
      if (continueDraftId) {
        // Write the PUT's response straight into the cache instead of
        // invalidating and hoping a refetch lands: `saved` is a
        // `FormSubmissionRead`, the exact shape `formSubmissionApi.get`
        // caches at this same key, so this is provably a fresh, correctly
        // shaped replacement — not a guess.
        //
        // The cancel-with-revert trap this avoids: `query()` forwards the
        // query's AbortSignal to `fetch` (Utils/request/query.ts), and
        // `onSaved` below navigates away in this same tick. If we instead
        // called `invalidateQueries`, the resulting refetch would still be
        // in flight when this component's observer unmounts on navigate —
        // React Query v5 cancels that fetch and REVERTS the cache to
        // whatever was there before (the pre-PUT dump), not the fresh
        // record, and not even a "stale" marker that would force a real
        // refetch next time. A later re-resume of this draft gates on
        // `isLoading` (present in cache => not loading) and seeds the form
        // ONCE from that stale cache, so the just-saved edits would
        // silently vanish on re-entry. Replacing the cache entry directly
        // sidesteps the refetch entirely.
        queryClient.setQueryData(["formSubmission", continueDraftId], saved);
      }
      // The encounter overview's drafts card lists these. This is a
      // DIFFERENT query key (`["formSubmissions", encounterId]`, a list) —
      // it isn't affected by the trap above because that card doesn't
      // navigate away when it invalidates itself (discarding a draft keeps
      // the overview mounted), so its own refetch is never cancelled.
      queryClient.invalidateQueries({ queryKey: ["formSubmissions"] });
      toast.success(t("draft_saved_successfully"));
      onSaved();
    },
    [continueDraftId, queryClient, t, onSaved],
  );

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
    if (!canSaveDraft || !primary || !encounterBound) return;
    const store = getStore(primary.key);
    if (!store) return;

    // Exactly the shape this page's own `?continue_draft=` restore parses,
    // and the one `composeBatch` finalizes on submit.
    const response_dump = {
      questionnaireResponses: {
        questionnaire: primary.questionnaire,
        responses: Object.values(store.get(responsesAtom)).map(
          draftResponseForStorage,
        ),
        errors: [],
      },
    };

    if (continueDraftId) {
      updateDraft({ status: "draft", response_dump });
      return;
    }
    createDraft({
      patient: encounterBound.patientId,
      questionnaire: primary.questionnaire.slug,
      encounter: encounterBound.encounterId,
      status: "draft",
      response_dump,
    });
  }, [
    canSaveDraft,
    primary,
    encounterBound,
    getStore,
    continueDraftId,
    createDraft,
    updateDraft,
  ]);

  return { canSaveDraft, saveDraft, isSavingDraft: isCreating || isUpdating };
}
