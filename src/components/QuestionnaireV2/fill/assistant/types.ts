import type { z } from "zod";

import type { StructuredEditOp } from "@/types/questionnaire/structured";

/**
 * The assistant capability's public contract — what `formAssistant`
 * plugins (Scribe first) are handed, and what the `window` test bridge
 * exposes. `care_scribe` (a separate, lockstep-released repo) adopts this
 * shape; see the batch report's "care_scribe handover" section for the
 * migration notes.
 *
 * Every method is addressed by the question's `link_id` — the same
 * external contract the old `fill/useFillActions.ts` registry used
 * (`questionnaire.response.set`'s `link_id` parameter), not the internal
 * server-issued `question.id` uuid. `QuestionDescriptor.id` below IS that
 * `link_id` — whatever a descriptor names as `id` is exactly what you pass
 * back into `getValue`/`setValue`/`applyStructuredEdit`.
 */

export interface FormDescriptor {
  /** The questionnaire id — pass this as `formKey` to every other method.
   *  Omitting `formKey` elsewhere defaults to the primary (route-mounted)
   *  form, mirroring the old registry's default. */
  key: string;
  title: string;
  isPrimary: boolean;
}

export type PlainValueEntry = string | number | boolean | null;

export interface PlainValueSummary {
  /** One entry per repeat. Dates/times are already formatted to plain
   *  strings (`date` -> local `YYYY-MM-DD`, `dateTime` -> ISO 8601) — the
   *  same round-trippable shapes {@link RawAnswerValue} accepts back into
   *  `setValue`. */
  values: PlainValueEntry[];
  note?: string;
}

export type StructuredSlotStateKind =
  "ready" | "unknown_type" | "subject_mismatch" | "missing_context";

export interface StructuredQuestionSummary {
  /** The structured type name — a core type (`"allergy_intolerance"`) or
   *  a namespaced plugin id (`"acme.assessment"`). */
  type: string;
  /** Absent when the type could not be resolved at all
   *  (`slotState: "unknown_type"`). */
  contract?: 1 | 2;
  /** Mirrors `resolveStructuredSlotState`'s discriminant — only "ready"
   *  questions accept `applyStructuredEdit` (and even then, only on
   *  contract 2 — see that method's own doc comment). */
  slotState: StructuredSlotStateKind;
  /** The type's own published row schema (`model.ts`'s "zod row schema
   *  for A2"). `undefined` when the type has not published one yet — as
   *  of this writing, EVERY ported type (see the batch report) — in which
   *  case `applyStructuredEdit` rejects every write to it, fail-closed. */
  rowSchema?: z.ZodType;
  /** `baseline + edits`, content only — exactly what `response.values[0]
   *  .value` already holds (`structuredDataAny`). Entries carry no
   *  `rowId`: that identity lives only inside the mounted editor's own
   *  `useStructuredRows` instance, out of this generic handle's reach (see
   *  the batch report's "current projection has no rowId" limitation). */
  projection: readonly unknown[];
}

export interface QuestionDescriptor {
  /** The question's `link_id`. */
  id: string;
  text: string;
  type: string;
  required: boolean;
  /** False while hidden by `enable_when` (its own or an ancestor's) — a
   *  write here is rejected the same way a disabled question is. */
  enabled: boolean;
  answered: boolean;
  /** `choice` questions with a fixed option list. */
  options?: string[];
  /** Present for every plain (non-`structured`, non-`group`) question. */
  value?: PlainValueSummary;
  /** Present only for `type: "structured"` questions. */
  structured?: StructuredQuestionSummary;
}

export type AssistantResult<T = undefined> = T extends undefined
  ? { ok: true } | { ok: false; error: string }
  : { ok: true; value: T } | { ok: false; error: string };

export interface ApplyStructuredEditInput {
  op: StructuredEditOp;
  /** Required for "update"/"remove" — the rowId of a row the caller
   *  already knows (returned by a prior "add", read off `edits` in a
   *  descriptor, or a type-specific convention like the singleton row id
   *  `"singleton"`). Optional for "add": a fresh id is minted when
   *  omitted, and it comes back in the result. */
  rowId?: string;
  /** The COMPLETE row — same convention a human edit's `RowEdit.patch`
   *  follows (`structured/core/types.ts`), for every op, `remove`
   *  included. Validated against the type's zod row schema before it
   *  reaches the log. */
  patch: unknown;
}

/**
 * The session-scoped handle. Constructed once per mounted fill session
 * (`useFillAssistantSession`) and passed down as a prop/argument — never
 * looked up from a module-level registry. Two fill sessions mounted at
 * once (two tabs of one drawer, a Playwright spec driving two independent
 * mounts) get two independent handles whose closures cannot see or
 * clobber each other; only the `window` test bridge (`windowTestBridge.ts`)
 * holds more than one at a time, keyed by a random per-mount session id.
 */
export interface FillAssistantHandle {
  listForms(): FormDescriptor[];
  /** Omit `formKey` for the primary form. */
  listQuestions(formKey?: string): QuestionDescriptor[];
  getValue(
    formKey: string | undefined,
    questionId: string,
  ): AssistantResult<PlainValueSummary>;
  /** Plain (non-structured) questions only — the same validated,
   *  coercion-choke-point path `structured` questions get via {@link
   *  FillAssistantHandle.applyStructuredEdit}. */
  setValue(
    formKey: string | undefined,
    questionId: string,
    values: PlainValueEntry[],
    note?: string,
  ): AssistantResult;
  /** The same edit-log path a human tap takes
   *  (`structured/core/editLog.ts`'s `applyEditToLog` — the exact
   *  function `useStructuredRows`'s own mutators call). Rejects a
   *  contract-v1 (legacy) structured type outright: those types have no
   *  edit log to append to. */
  applyStructuredEdit(
    formKey: string | undefined,
    questionId: string,
    edit: ApplyStructuredEditInput,
  ): AssistantResult<{ rowId: string }>;
  /** Fires on any change to any mounted form's responses — human edits,
   *  assistant writes, or a baseline refetch's projection refresh alike. */
  subscribe(listener: () => void): () => void;
}
