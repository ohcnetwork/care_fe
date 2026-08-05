import { z } from "zod";

import { resolveChanges } from "@/components/QuestionnaireV2/structured/core/changes";
import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type {
  StructuredBatchEntry,
  StructuredRequestContext,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import type { FileUploadQuestion } from "@/types/files/file";
import { FileCategory, FileType } from "@/types/files/file";
import type { StructuredEdit } from "@/types/questionnaire/structured";

/**
 * The assistant write guard (spec §6 A2 — see `timeOfDeath/model.ts`'s
 * `rowSchema` for the full contract). Published for completeness (every
 * ported type publishes one), but honestly: `file_data: z.instanceof(File)`
 * means this schema ALWAYS rejects an assistant-authored patch, by
 * construction, not merely in practice — an assistant write arrives as a
 * plain JSON `unknown` value (`ApplyStructuredEditInput.patch: unknown`,
 * `fill/assistant/types.ts`), and a real browser `File` (a live handle to
 * bytes on disk, produced only by a genuine file-picker interaction) cannot
 * be reconstructed FROM JSON — this is the exact same round-trip
 * impossibility `FileUploadRow`'s own doc comment (`draftPolicy:
 * "exclude"`) documents for why this type cannot be drafted either. `File`
 * is a Node/browser global; `z.instanceof(File)` works identically under
 * `node --test` (Node 20+ ships a global `File`) and in the real app.
 */
export const rowSchema = z
  .object({
    name: z.string(),
    file_type: z.enum(FileType),
    file_category: z.enum(FileCategory),
    associating_id: z.string().min(1),
    original_name: z.string().min(1),
    file_data: z.instanceof(File),
  })
  .strict();

/**
 * UNCHANGED SHAPE — the whole reason `files` stays `draftPolicy: "exclude"`
 * (D6, spec §5, this port's own decision the definition documents). Every
 * other structured type widened or invented a row shape that is plain,
 * JSON-serializable data; this one still carries `file_data: File` — a live
 * browser handle, not data. A `File` cannot be `JSON.stringify`d into a
 * draft and, even if its bytes were base64-encoded instead, the result
 * could not be turned back into a `File` on restore (the browser will not
 * re-grant filesystem access to a picked file from a serialized blob). So
 * this alias is not "hasn't been ported yet" — it is the port's answer:
 * there is no other shape that both round-trips through a draft AND still
 * carries the file to upload.
 */
export type FileUploadRow = FileUploadQuestion;

/**
 * A freshly picked `File`, seeded exactly the way `FileQuestion.tsx`'s
 * upload effect did (`FileQuestion.tsx:137-144`): `name` starts EMPTY on
 * purpose — the clinician has to type one — `original_name` is the file's
 * own name, `file_type`/`file_category` are the fixed values that widget
 * always used, and `associating_id` is the encounter this section is filling
 * (a file upload is always billed to the encounter, never a value the row
 * itself carries). `file_data` holds `file` BY REFERENCE, not a copy — that
 * same reference is what `toRequests` (below) later hands to
 * `readFileAsDataURL`. There is now exactly one place a `File` object lives
 * between pick and submit: this row. The legacy widget kept a SECOND copy in
 * `useFileUpload`'s own `files` state and resynced the response from it on
 * every render (`FileQuestion.tsx:131-151`); `FilesEditor.tsx` never does
 * that — the picker's buffer is drained into rows the instant it reports
 * something and cleared in the same tick (see that file's effect), so there
 * is only ever one store to read, update or remove from.
 */
export function newFileRow(file: File, encounterId: string): FileUploadRow {
  return {
    name: "",
    file_data: file,
    original_name: file.name,
    file_type: FileType.ENCOUNTER,
    file_category: FileCategory.UNSPECIFIED,
    associating_id: encounterId,
  };
}

/**
 * A files section is a LIST with no "half filled" row to reconcile, same as
 * `charge_item`: a row is born whole the moment `newFileRow` creates it (its
 * `name` starts `""`, but the row itself is real — a `File` is already
 * attached and already destined for an upload) and either exists or has been
 * removed. There is deliberately no `isEmptyRow` filtering an unnamed row out
 * of the projection — PROJECTION AND SUBMIT MUST AGREE, and `toRequests`
 * (below) submits every surviving row regardless of its `name`, trusting
 * that a blocking `validate()` error (`unnamedFileRowIds`) already stopped
 * the whole submit before `toRequests` could run on one still unnamed — the
 * exact same division of labour as `charge_item`'s quantity decision
 * (`model.ts`'s `invalidQuantityRowIds` there). Filtering unnamed rows out
 * here instead would let an attached-but-unnamed file silently vanish from
 * both the screen and the request with no error at all — precisely the
 * silent-drop class this phase exists to retire.
 */
export const projectValues: ProjectValues<FileUploadRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "files", value: [...rows] }];

/**
 * THE NAME DECISION — row-scoped, pure, i18n-free (the definition file turns
 * this into a translated `QuestionValidationError` per row). Mirrors
 * `validateFileUploadQuestion`'s `NAME` field today (`FileQuestion.tsx`'s
 * `FILE_UPLOAD_FIELDS.NAME`), but only for `name` — `file_data` can never be
 * missing (every row is born from a real, just-picked `File`, unlike the
 * legacy widget's index-derived reconstruction) and `original_name` is
 * always the file's own name, never user-editable, so neither can go blank
 * the way `name` can. Trimmed so pure whitespace does not pass as a real
 * name. A `remove` edit is never reported: the row is on its way out, not
 * something the clinician still needs to name (mirrors `charge_item`'s
 * "never reports a remove edit" and `appointment`'s "an edit that resolved
 * to nothing visible must not trip validation").
 */
export function unnamedFileRowIds(
  edits: readonly StructuredEdit<FileUploadRow>[],
): string[] {
  return edits
    .filter((edit) => edit.op !== "remove" && !edit.patch.name?.trim())
    .map((edit) => edit.rowId);
}

/** The one dependency `toRequests` needs beyond `edits`/`context` — read
 *  this doc comment before "fixing" the missing `@/Utils/utils` import
 *  above; there isn't one, and that is deliberate. */
export interface FileRequestDeps {
  /** Turns a `File` into a `data:` URL. In production this is the real
   *  `readFileAsDataURL` (`@/Utils/utils`), wired in by `definitions/
   *  files.tsx` — never imported here directly. */
  readFileAsDataURL: (file: File) => Promise<string>;
}

/**
 * Files are uploaded, never amended or re-fetched: `creates` is the whole
 * story. `resolveChanges(edits, {})` — no `baseline` — is the differ's own
 * contract-v2 shape (`StructuredTypeDefinitionV2.toRequests` takes no
 * baseline argument at all; `time_of_death`'s `toRequests` makes the
 * identical call for the identical reason). `updates`/`removes` are not
 * read: a well-formed log for this create-only type only ever emits `add`
 * (`useStructuredRows`'s `addRow`/`addRows`), so both sets are empty in
 * practice, and even a corrupted/hand-edited draft carrying an `update` or a
 * stray `remove` has no endpoint here that could act on either — there is no
 * PATCH/PUT for an uploaded file and no delete route this differ owns. An
 * empty edit log produces ZERO requests by construction (P1-14): `creates`
 * is `[]`, `Promise.all([])` resolves to `[]`, nothing is ever compiled for
 * an untouched section.
 *
 * Base64 conversion happens HERE, in the differ, and nowhere else (spec
 * §4) — it is the whole reason this type cannot be drafted (D6): the row
 * carries the live `File` right up to the moment of submission; nothing
 * upstream (the editor, `projectValues`, a draft dump) ever holds the
 * base64 string instead, so there is no serialized form to persist that
 * would also survive a reload as something uploadable.
 *
 * `readFileAsDataURL` IS INJECTED (`FileRequestDeps`), not imported at
 * module scope, and this is a deliberate departure from every sibling
 * differ (`chargeItem`/`timeOfDeath`/`appointment` import their own request
 * helpers directly). Found empirically, not merely anticipated: this
 * module's earlier draft imported `readFileAsDataURL` straight from
 * `@/Utils/utils` — which itself imports `@careConfig` — and
 * `care.config.ts` reads `import.meta.env` at module scope, which is
 * `undefined` under `node --test` (there is no Vite there to supply it).
 * That import alone crashed the ENTIRE test file before a single assertion
 * ran, not merely the one function that used the browser-only `FileReader`
 * — the brief's own scope note assumed only the latter. Mirrors
 * `encounter/model.ts`'s `makeNormalizePatch`, which takes its
 * `dischargeDisposition` config value as a parameter for the identical
 * `@careConfig` reason ("TAKES ITS CONFIG rather than importing
 * `@careConfig`", that file's own doc comment). The upside beyond merely
 * avoiding the crash: `model.test.ts` can now inject a Node-safe fake and
 * exercise the WHOLE differ — request shape, log order, the base64 split —
 * not just the two early-return guards the brief's original plan expected
 * to be the limit of what's testable here.
 *
 * `definitions/files.tsx` (never collected by `node --test`, same rule as
 * every other definition file) calls `makeToRequests({ readFileAsDataURL })`
 * once, at module scope, with the real implementation.
 */
export function makeToRequests({
  readFileAsDataURL,
}: FileRequestDeps): (
  edits: readonly StructuredEdit<FileUploadRow>[],
  context: StructuredRequestContext,
) => Promise<StructuredBatchEntry[]> {
  return async function toRequests(edits, { encounterId, questionId }) {
    // Guard mirrors `charge_item`'s `!facilityId` / `time_of_death`'s
    // `!patientId`: `requires: ["encounterId", "facilityId"]` on the
    // definition means the slot never reaches "ready" without one, so this
    // is structurally unreachable on a real submit — stated directly rather
    // than assumed, same as those two. Returning before `creates.map` also
    // means the injected reader is never invoked for a context that can't
    // build a valid request anyway — pinned by `model.test.ts`.
    if (!encounterId) return [];
    const { creates } = resolveChanges(edits, {});
    return Promise.all(
      creates.map(async (row) => {
        const base64 = (await readFileAsDataURL(row.file_data)).split(",")[1];
        return {
          url: `/api/v1/files/upload-file/`,
          method: "POST" as const,
          body: { ...row, file_data: base64, encounter: encounterId },
          reference_id: structuredReferenceId("files", questionId),
        };
      }),
    );
  };
}
