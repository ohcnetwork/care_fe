import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import query from "@/Utils/request/query";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

import type { FormStore } from "./StoreRegistrar";
import type { DraftFormSnapshot } from "./draft/fillDraftStore";
import {
  mergeDraftIntoSeed,
  preserveExcludedStructured,
} from "./draft/fillDraftStore";
import type { FillFormEntry } from "./formSession";

interface UseFillSessionFormsArgs {
  /** The route-mounted questionnaire — seeds the session's one PRIMARY
   *  form. Only read once (the initial `useState` seed); later identity
   *  changes have no effect. */
  questionnaire: QuestionnaireRead;
  /** Resumed server draft responses, seeded into the primary form at
   *  creation only. */
  serverDraftResponses?: Record<string, QuestionnaireResponse>;
  getStore: (key: string) => FormStore | undefined;
}

/**
 * The fill session's form list plus everything that mutates it: adding a
 * questionnaire (by hand or via a drafted resume), removing one, and the
 * retained-snapshot bookkeeping for forms the draft is still carrying
 * without a live store (a resume whose re-fetch failed).
 */
export function useFillSessionForms({
  questionnaire,
  serverDraftResponses,
  getStore,
}: UseFillSessionFormsArgs) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

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

  // Snapshots that belong to the draft but are not (yet) live forms. They
  // stay in the persisted draft (see `saveFillDraft`'s `retained`) — the
  // ways a resume can fail are NOT the same: a version bump means the
  // answers can no longer be trusted onto the new tree and dropping them
  // is correct, while a network error means try again later, and
  // destroying the clinician's only copy over it is not.
  const [retainedSnapshots, setRetainedSnapshots] = useState<
    DraftFormSnapshot[]
  >([]);
  const dropRetainedSnapshot = useCallback((questionnaireId: string) => {
    setRetainedSnapshots((previous) =>
      previous.filter((entry) => entry.questionnaireId !== questionnaireId),
    );
  }, []);

  // Read by resume callbacks that must see the CURRENT session without
  // re-creating themselves per forms change. Effect-synced, which is
  // enough: every reader is an event-handler-initiated async path that
  // runs strictly after the commit that changed `forms`.
  const formsRef = useRef(forms);
  useEffect(() => {
    formsRef.current = forms;
  }, [forms]);

  /** Resume non-primary snapshots. Each snapshot is retained before refetch
   *  so autosave cannot erase it while it is not yet attached to a live form;
   *  refetch success mounts or merges it, version drift drops it, and fetch
   *  failure keeps it retained for a later retry. */
  const onResumeAddedForms = useCallback(
    (snapshots: DraftFormSnapshot[]) => {
      setRetainedSnapshots((previous) => {
        const seen = new Set(previous.map((entry) => entry.questionnaireId));
        return [
          ...previous,
          ...snapshots.filter(
            (snapshot) => !seen.has(snapshot.questionnaireId),
          ),
        ];
      });
      void (async () => {
        for (const snapshot of snapshots) {
          // Already in the session (the clinician added it by hand before
          // pressing Resume): apply the snapshot to the live store the
          // same way the primary form's resume overlay does — dropping it
          // silently would erase the drafted answers from the stored
          // draft on the very next persist.
          const existing = formsRef.current.find(
            (form) => form.key === snapshot.questionnaireId,
          );
          if (existing) {
            if (
              String(existing.questionnaire.version) !==
              snapshot.questionnaireVersion
            ) {
              dropRetainedSnapshot(snapshot.questionnaireId);
              toast.warning(
                t("fill_draft_form_dropped", {
                  title: existing.questionnaire.title,
                }),
              );
              continue;
            }
            const store = getStore(existing.key);
            if (store) {
              store.set(
                responsesAtom,
                preserveExcludedStructured(
                  store.get(responsesAtom),
                  mergeDraftIntoSeed(
                    existing.questionnaire.questions,
                    snapshot.responses,
                  ),
                ),
              );
            }
            dropRetainedSnapshot(snapshot.questionnaireId);
            continue;
          }
          try {
            const fetched = await queryClient.fetchQuery({
              queryKey: questionnaireKeys.detail(snapshot.questionnaireId),
              queryFn: query(questionnaireApi.get, {
                pathParams: { id: snapshot.questionnaireId },
              }),
            });
            if (String(fetched.version) !== snapshot.questionnaireVersion) {
              dropRetainedSnapshot(snapshot.questionnaireId);
              toast.warning(
                t("fill_draft_form_dropped", { title: fetched.title }),
              );
              continue;
            }
            addQuestionnaire(
              fetched,
              mergeDraftIntoSeed(fetched.questions, snapshot.responses),
            );
            dropRetainedSnapshot(snapshot.questionnaireId);
          } catch {
            // Treat fetch failures as transient: keep the snapshot in the stored
            // draft so the next persist cannot erase it. The stored title is
            // the best available label; fall back to the id when absent.
            toast.warning(
              t("fill_draft_form_unavailable", {
                title: snapshot.title ?? snapshot.questionnaireId,
              }),
            );
          }
        }
      })();
    },
    [queryClient, addQuestionnaire, getStore, dropRetainedSnapshot, t],
  );

  /** The in-session picker's add. When the picked questionnaire matches a
   *  RETAINED snapshot (its resume re-fetch failed earlier), that snapshot
   *  IS the drafted form — seed from it instead of mounting empty, which
   *  would displace the snapshot from the stored draft on the next
   *  persist. A version drift drops it with the same toast as resume. */
  const addQuestionnaireFromPicker = useCallback(
    (selected: QuestionnaireRead) => {
      const snapshot = retainedSnapshots.find(
        (entry) => entry.questionnaireId === selected.id,
      );
      if (!snapshot) {
        addQuestionnaire(selected);
        return;
      }
      dropRetainedSnapshot(selected.id);
      if (String(selected.version) !== snapshot.questionnaireVersion) {
        toast.warning(t("fill_draft_form_dropped", { title: selected.title }));
        addQuestionnaire(selected);
        return;
      }
      addQuestionnaire(
        selected,
        mergeDraftIntoSeed(selected.questions, snapshot.responses),
      );
    },
    [retainedSnapshots, addQuestionnaire, dropRetainedSnapshot, t],
  );

  return {
    forms,
    addQuestionnaire,
    removeForm,
    retainedSnapshots,
    onResumeAddedForms,
    addQuestionnaireFromPicker,
  };
}
