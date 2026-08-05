/**
 * The fill session's write phase and the gate every assistant write
 * passes, kept dependency-free so `node --test` can exercise the gate
 * directly (see `sessionPhase.test.ts`).
 *
 * `FillPageBody` derives the phase from `useSubmitFillSession` and hands
 * it to both halves of the session: every human input surface takes it as
 * `frozen`, and the assistant handle takes it here. Without the gate the
 * assistant would be the one writer that ignores the submit freeze.
 */

/** "composing" is client validation + batch compose, "submitting" the
 *  request in flight. Both mean the payload is already being built from a
 *  snapshot of the responses, so a write landing now paints on screen and
 *  is silently absent from what the server receives. */
export type FillSessionPhase = "editing" | "composing" | "submitting";

export type SessionPhaseGateResult =
  { ok: true } | { ok: false; error: string };

export function checkSessionEditable(
  phase: FillSessionPhase,
): SessionPhaseGateResult {
  if (phase === "editing") return { ok: true };
  return {
    ok: false,
    error:
      "This form is being submitted and cannot be edited right now; wait for the submission to finish",
  };
}
