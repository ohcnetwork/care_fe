import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import careConfig from "@careConfig";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import { formSubmissionKeys } from "@/components/QuestionnaireV2/queryKeys";
import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import { resolveStructuredType } from "@/components/QuestionnaireV2/structured/registry";

import { unsupportedDraftStructuredTypes } from "@/components/QuestionnaireV2/fill/draft/unsupportedDraftStructuredTypes";
import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";

import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
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
 * Explicit Save as draft creates or updates a server `form_submission` draft,
 * making a half-finished encounter form available from other devices and the
 * encounter overview. It is available only when feature-enabled, encounter-
 * bound, single-form, and free of structured types that cannot be dumped
 * faithfully; saving a resumed server draft updates the same record.
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

  // `unsupportedDraftStructuredTypes` calls `resolveStructuredType`, whose
  // answer for a plugin-authored question changes when that plugin's
  // remote registers or unregisters its type — subscribing (same pattern
  // as `QuestionTypePicker.tsx` over this same registry) recomputes
  // `canSaveDraft` when that happens, instead of caching a stale answer
  // for the lifetime of this hook.
  const structuredTypesVersion = useSyncExternalStore(
    subscribeToStructuredTypes,
    getStructuredTypesVersion,
    getStructuredTypesVersion,
  );

  const canSaveDraft = useMemo(() => {
    if (!careConfig.enableQuestionnaireDraft) return false;
    if (!encounterBound || !primary) return false;
    if (forms.length !== 1) return false;
    // The MOUNT being an encounter is not enough: a patient-subject
    // questionnaire filled from an encounter route submits without an
    // `encounter` (see `composeBatch`'s submit target), while the draft
    // record was created with one — the backend then looks the record up
    // with `encounter__isnull=True`, 404s, and rolls the whole batch back.
    // Offering Save as draft there would build a record that can never be
    // completed.
    if (primary.questionnaire.subject_type !== "encounter") return false;
    return (
      unsupportedDraftStructuredTypes(
        primary.questionnaire.questions,
        resolveStructuredType,
      ).length === 0
    );
  }, [encounterBound, primary, forms.length, structuredTypesVersion]);

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
        queryClient.setQueryData(
          formSubmissionKeys.detail(continueDraftId),
          saved,
        );
      }
      // The encounter overview's drafts card lists these. Only the LIST
      // subtree is invalidated — the detail key above must stay out of it,
      // per the trap described there — and that card doesn't navigate away
      // when it refetches (discarding a draft keeps the overview mounted),
      // so its own refetch is never cancelled.
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
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
        responses: Object.values(store.get(responsesAtom)),
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
