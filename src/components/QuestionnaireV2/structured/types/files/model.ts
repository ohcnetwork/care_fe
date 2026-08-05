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
 * Assistant write guard. `file_data: z.instanceof(File)` means this schema
 * ALWAYS rejects an assistant-authored patch by construction: an assistant
 * write arrives as plain JSON (`ApplyStructuredEditInput.patch: unknown`),
 * and a real browser `File` cannot be reconstructed from JSON — the same
 * round-trip impossibility behind this type's `draftPolicy: "exclude"`.
 * `File` is a Node/browser global, so `z.instanceof(File)` behaves the same
 * under `node --test` (Node 20+) as in the app.
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
 * Carries `file_data: File` — a live browser handle, not plain data —
 * which is why `files` is `draftPolicy: "exclude"`: a `File` cannot be
 * `JSON.stringify`d into a draft, and even base64-encoded bytes could not
 * be turned back into a `File` on restore. No alternative row shape both
 * round-trips through a draft and still carries the file to upload.
 */
export type FileUploadRow = FileUploadQuestion;

/**
 * `name` starts EMPTY on purpose — the clinician has to type one.
 * `original_name` is the file's own name; `associating_id` is the encounter
 * this section is filling. `file_data` holds `file` BY REFERENCE, not a
 * copy — the same reference `toRequests` later hands to `readFileAsDataURL`.
 * This row is the only place a `File` lives between pick and submit: the
 * picker's buffer is drained into rows and cleared in the same tick
 * (`FilesEditor.tsx`'s effect), so there is only one store to read, update
 * or remove from.
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
 * A LIST with no "half filled" row: a row is born whole the moment
 * `newFileRow` creates it (its `name` starts `""`, but a `File` is already
 * attached). Deliberately no `isEmptyRow` filtering unnamed rows out of the
 * projection — projection and submit must agree, and `toRequests` submits
 * every surviving row regardless of `name`, trusting the blocking
 * `validate()` error (`unnamedFileRowIds`) to stop the submit first.
 * Filtering here would let an attached-but-unnamed file silently vanish
 * from both the screen and the request with no error at all.
 */
export const projectValues: ProjectValues<FileUploadRow> = (rows) =>
  rows.length === 0 ? [] : [{ type: "files", value: [...rows] }];

/**
 * Row-scoped, pure, i18n-free — the definition file turns this into a
 * translated `QuestionValidationError` per row. Only `name` is checked:
 * `file_data` and `original_name` come from the picked `File` itself and
 * cannot go blank the way the typed `name` can. Trimmed so pure whitespace
 * does not pass. A `remove` edit is never reported: the row is on its way
 * out, not something the clinician still needs to name.
 */
export function unnamedFileRowIds(
  edits: readonly StructuredEdit<FileUploadRow>[],
): string[] {
  return edits
    .filter((edit) => edit.op !== "remove" && !edit.patch.name?.trim())
    .map((edit) => edit.rowId);
}

/** The one dependency `toRequests` needs beyond `edits`/`context` —
 *  injected by `definitions/files.tsx`, deliberately never imported here. */
export interface FileRequestDeps {
  /** Turns a `File` into a `data:` URL. In production this is the real
   *  `readFileAsDataURL`, wired in by `definitions/files.tsx`. */
  readFileAsDataURL: (file: File) => Promise<string>;
}

/**
 * Files are uploaded, never amended or re-fetched: `creates` is the whole
 * story. `updates`/`removes` are not read — a well-formed log for this
 * create-only type only ever emits `add`, and there is no PATCH or delete
 * endpoint this differ could act on either way. An empty edit log produces
 * zero requests by construction.
 *
 * Base64 conversion happens HERE, in the differ, and nowhere else: the row
 * carries the live `File` right up to submission, so nothing upstream ever
 * holds a serialized form a draft could persist.
 *
 * `readFileAsDataURL` is injected (`FileRequestDeps`) rather than imported:
 * `@/Utils/utils` imports `@careConfig`, which reads `import.meta.env` at
 * module scope — `undefined` under `node --test` — so the import alone would
 * crash the whole test file. Injection also lets tests exercise the full
 * differ with a Node-safe fake. `definitions/files.tsx` wires the real
 * implementation once, at module scope.
 */
export function makeToRequests({
  readFileAsDataURL,
}: FileRequestDeps): (
  edits: readonly StructuredEdit<FileUploadRow>[],
  context: StructuredRequestContext,
) => Promise<StructuredBatchEntry[]> {
  return async function toRequests(edits, { encounterId, questionId }) {
    // `requires: ["encounterId", "facilityId"]` on the definition means the
    // slot never reaches "ready" without one, so this is unreachable on a
    // real submit. Returning before `creates.map` also keeps the injected
    // reader from ever running for a context that cannot build a valid
    // request.
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
