import { useEffect, useMemo, useState } from "react";

import useAuthUser from "@/hooks/useAuthUser";
import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import { sweepExpiredFillDrafts } from "./draft/fillDraftCache";
import { fillDraftScopeKey } from "./draft/fillDraftCore";
import { loadFillDraft, type FillDraftScope } from "./draft/fillDraftStore";
import { parseServerDraft, type ServerDraftState } from "./draft/serverDraft";
import { subjectKeyOf, type FillSubject } from "./subject";

interface FillPageDraftsOptions {
  subject: FillSubject;
  questionnaire?: QuestionnaireRead;
  continueDraftId?: string;
  serverDraft?: FormSubmissionRead;
  resumeLocalDraft: boolean;
  prescription?: string;
  toDischarge?: string;
}

/** Resolve draft recovery for a session without rereading autosaved edits on refetch. */
export function useFillPageDrafts({
  subject,
  questionnaire,
  continueDraftId,
  serverDraft,
  resumeLocalDraft,
  prescription,
  toDischarge,
}: FillPageDraftsOptions) {
  const user = useAuthUser();
  useEffect(() => {
    sweepExpiredFillDrafts();
  }, []);

  // Server draft (continue_draft) supersedes any local draft.
  const serverDraftState = useMemo<ServerDraftState | undefined>(
    () =>
      continueDraftId && serverDraft && questionnaire
        ? parseServerDraft(serverDraft, questionnaire)
        : undefined,
    [continueDraftId, serverDraft, questionnaire],
  );

  // These query parameters change the record or workflow a widget edits,
  // even when the encounter and questionnaire remain the same.
  const contextParams = new URLSearchParams();
  if (prescription) contextParams.set("prescription", prescription);
  if (toDischarge === "true") contextParams.set("toDischarge", "true");
  const contextKey = contextParams.toString() || undefined;
  const scope: FillDraftScope | undefined = questionnaire
    ? {
        userId: user.id,
        subjectKey: subjectKeyOf(subject),
        entryQuestionnaireId: questionnaire.id,
        contextKey,
      }
    : undefined;

  // Load once per user, subject, questionnaire and editing context.
  // Autosave writes do not change these dependencies.
  const scopeKey = scope ? fillDraftScopeKey(scope) : undefined;
  const sessionKey = `${scopeKey}--${continueDraftId ?? ""}--${resumeLocalDraft}`;
  const readLocalDraft = () =>
    scopeKey && scope && questionnaire && !continueDraftId
      ? loadFillDraft(scope, questionnaire.questions)
      : undefined;
  const [snapshot, setSnapshot] = useState(() => ({
    sessionKey,
    draft: readLocalDraft(),
  }));
  let localDraft = snapshot.draft;
  if (snapshot.sessionKey !== sessionKey) {
    localDraft = readLocalDraft();
    setSnapshot({ sessionKey, draft: localDraft });
  }

  return { scope, sessionKey, localDraft, serverDraftState };
}
