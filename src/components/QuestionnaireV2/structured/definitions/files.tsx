import { t } from "i18next";

import { readFileAsDataURL } from "@/Utils/utils";

import { FilesEditor } from "@/components/QuestionnaireV2/structured/types/files/FilesEditor";
import {
  makeToRequests,
  unnamedFileRowIds,
} from "@/components/QuestionnaireV2/structured/types/files/model";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";

function FilesInput(props: StructuredInputProps) {
  if (!props.encounterId) return null;
  return <FilesEditor {...props} />;
}

// The real `readFileAsDataURL` is wired in HERE, at the one seam allowed to
// import `@/Utils/utils` (and, transitively, `@careConfig`) — never inside
// `structured/types/files/model.ts` itself. See `model.ts`'s
// `FileRequestDeps` doc comment for why: that import alone crashes
// `node --test` (`care.config.ts` reads `import.meta.env`, `undefined`
// outside Vite), which would take every OTHER test in `model.test.ts` down
// with it, not merely the one function that needs a real `FileReader`.
const toRequests = makeToRequests({ readFileAsDataURL });

export const filesDefinition: StructuredTypeDefinition<"files"> = {
  type: "files",
  component: FilesInput,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  /**
   * THE ONLY SURVIVING "exclude" (D6, spec §5). Every other structured type
   * became `"serialize"` under contract v2 — D2's default, since a v2 row
   * is plain, JSON-serializable data by construction. A `files` row is the
   * one exception: `file_data` is a raw `File`, a live browser handle with
   * no JSON representation and no way back from one. Even a draft that
   * base64-encoded it instead would not help — the spec considered exactly
   * that (a metadata-only restore, and a separate IndexedDB store for the
   * bytes) and rejected both for this phase: encoding balloons localStorage
   * for a row that already has an underlying upload endpoint, and neither
   * approach changes the actual product consequence below.
   *
   * THE CONSEQUENCE, STATED PLAINLY: a clinician who attaches files to this
   * section and then loses the page — a crash, a reload, an accidental
   * navigation — loses those attachments. Only this section; every other
   * answered question on the same form (including every other structured
   * section) still restores from the draft normally, because `"exclude"`
   * is scoped per structured TYPE, not per submission. Nothing about this
   * port changes that trade-off — it is a pre-existing, deliberate product
   * decision this definition now documents explicitly rather than leaving
   * as an unexplained legacy-contract holdout.
   *
   * If a second `"exclude"` type ever appears here, that is a bug in that
   * type's row shape (something non-JSON-serializable snuck onto it), not a
   * new instance of this policy — this file is the one place D6 is
   * supposed to still apply.
   */
  draftPolicy: "exclude",
  contract: 2,
  toRequests,
  // i18n boundary: `model.ts`'s `unnamedFileRowIds` is the pure, row-scoped
  // decision (imports no i18next); this is the only place it becomes a
  // translated, row_id-keyed `QuestionValidationError`. `field_key: "name"`
  // matches the `FilesEditor`'s `name` column exactly (its
  // `errorFieldKeys` defaults to `[column.key]`), so this renders inline
  // via `StructuredFieldError` — see `QuestionBlock.tsx`'s
  // `STRUCTURED_TYPES_WITH_INLINE_FIELD_ERRORS` note for why `files` isn't
  // added there in this commit.
  validate: (_projection, edits, questionId) =>
    unnamedFileRowIds(edits).map((rowId) => ({
      question_id: questionId,
      field_key: "name",
      row_id: rowId,
      error: t("field_required"),
      required: true,
    })),
};
