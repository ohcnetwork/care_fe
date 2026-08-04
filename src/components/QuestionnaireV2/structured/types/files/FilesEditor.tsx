import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";

import FileUploadDropdown from "@/components/Files/FileUploadDropdown";

import {
  StructuredList,
  type StructuredColumn,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import useFileUpload from "@/hooks/useFileUpload";

import { BACKEND_ALLOWED_EXTENSIONS, FileType } from "@/types/files/file";

import { newFileRow, projectValues, type FileUploadRow } from "./model";

/** A file is uploaded, never prefetched — there is no server row to convert
 *  into a baseline, ever (the legacy widget only ever wrote a response,
 *  `FileQuestion.tsx` reads only `questionnaireResponse.values`). Module
 *  scope, like `projectValues`: a fresh `[]` literal on every render would
 *  be a new baseline identity each time, defeating `useStructuredRows`'s own
 *  memoization of it. Passed explicitly (rather than omitted, Lesson 3 —
 *  this phase's binding "Lessons from the first ports") so the honest
 *  complete set — "the server confirmed zero rows", per the BASELINE
 *  COMPLETENESS CONTRACT, which names `files` directly as one of the types
 *  for which this is permanently, not merely currently, true — is what the
 *  core actually receives, not `undefined` (its "still loading/errored"
 *  signal). Mirrors `AppointmentEditor.tsx`/`ChargeItemEditor.tsx`'s own
 *  `NO_BASELINE`. */
const NO_BASELINE: readonly BaselineRow<FileUploadRow>[] = [];

export function FilesEditor({
  question,
  disabled,
  errors,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
  // No explicit type arguments — `TRow` infers from `projectValues`, `Mode`
  // defaults to "list" (files is a genuine list, not a singleton).
  const list = useStructuredRows({
    questionId: question.id,
    baseline: NO_BASELINE,
    projectValues,
    disabled,
  });

  const fileUpload = useFileUpload({
    type: FileType.ENCOUNTER,
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    multiple: true,
    allowNameFallback: false,
    compress: false,
  });

  // THE ONE EFFECT THIS PHASE KEEPS. `useFileUpload` owns its `File[]`
  // buffer internally and exposes no "on selected" callback — announcing
  // that buffer here is the only available seam. It is a SOURCE of files,
  // not the source of truth: every file it reports becomes a row
  // immediately (`list.addRows`, ONE commit for the whole batch, so 21
  // files selected at once fold into ONE edit-log write, not 21) and its
  // own buffer is drained in the SAME tick (`clearFiles`) — there is no
  // parallel array left to keep in sync and no index to shift when a row is
  // later removed, unlike the legacy widget's `FileQuestion.tsx:131-151`,
  // which rebuilt the WHOLE response from `fileUpload.files` on every
  // render and re-derived each name by array position (removing file 0
  // silently relabelled every remaining row).
  //
  // Confined to `[fileUpload.files]` ON PURPOSE (`react-hooks/exhaustive-deps`
  // disabled below) — this is the one place Task 4's render-loop lesson
  // applies directly: `list.addRows`'s identity changes on every edit (it
  // closes over `rows`/`edits`, per `useStructuredRows.ts`), so listing it
  // here would re-run this effect on every keystroke in an unrelated cell.
  // Harmless in practice (the `length === 0` guard below no-ops), but
  // there is no reason to depend on an unstable callback when the only
  // thing that must ever re-trigger this effect is the picker reporting
  // NEW files.
  useEffect(() => {
    if (fileUpload.files.length === 0) return;
    list.addRows(
      fileUpload.files.map((file) => newFileRow(file, encounterId!)),
    );
    fileUpload.clearFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUpload.files]);

  const columns: StructuredColumn<FileUploadRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: t("file_name"),
        width: "minmax(12rem, 1fr)",
        required: true,
        render: ({
          row,
          update,
          disabled: cellDisabled,
          ariaLabel,
          fieldId,
          describedBy,
          invalid,
        }) => (
          <Input
            id={fieldId}
            // `fillSubmitGuards.spec.ts:50` locates these by placeholder —
            // `block.getByPlaceholder("File Name")` — so the placeholder is
            // load-bearing and must stay exactly `t("file_name")`.
            placeholder={t("file_name")}
            aria-label={ariaLabel}
            aria-required
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy}
            value={row.row.name}
            onChange={(event) => update({ name: event.target.value })}
            disabled={cellDisabled}
          />
        ),
      },
      {
        key: "original_name",
        header: t("original_file_name"),
        width: "minmax(8rem, 12rem)",
        // The row title below is this exact same value — showing it again
        // as a stacked mobile field would be the identical double-print
        // `ChargeItemEditor.tsx` avoids on its own "item" column (Task 6
        // review, minor) for the same reason: the collapsed card's title
        // already says it.
        mobileHidden: true,
        render: ({ row }) => (
          <span className="block truncate text-sm">
            {row.row.original_name}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <>
      <StructuredList
        questionId={question.id}
        label={t("structured_type__files")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={list.removeRow}
        rowTitle={(row) => row.row.original_name}
        addControl={
          // `fillSubmitGuards.spec.ts:87-89,120-122` drives
          // `block.locator('input[type="file"]').setInputFiles(...)`, and
          // `structuredRendering.spec.ts:74-75` requires the dropdown's
          // OWN hidden input to stay hidden while something else in the
          // block is `:visible` — so this must stay in the addControl
          // slot, rendered directly, never behind a portal.
          <FileUploadDropdown
            fileUpload={fileUpload}
            buttonVariant="secondary"
            buttonClassName="border border-secondary-300"
          />
        }
      />
      {fileUpload.Dialogues}
    </>
  );
}
