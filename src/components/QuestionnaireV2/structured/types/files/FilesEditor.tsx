import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";

import FileUploadDropdown from "@/components/Files/FileUploadDropdown";

import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
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
  // REVIEW FIX 1 — `fileUpload.previewing` gates the drain. A camera
  // capture (`useFileUpload.tsx`'s `Dialogues`, `CameraCaptureDialog`)
  // appends to `fileUpload.files` the INSTANT the shutter fires
  // (`captureImage`'s `toBlob` callback → `onCapture` → `setFiles`) — well
  // before the clinician has seen the Retake/Confirm preview screen, let
  // alone chosen one. Draining unconditionally on every `files` change
  // therefore promoted the just-snapped, not-yet-reviewed photo into a
  // permanent row immediately; clicking Retake calls `onResetCapture`
  // (`clearFiles`), which only clears an ALREADY-DRAINED buffer and cannot
  // retract the row it already produced. Capture → Retake → Capture used to
  // leave TWO rows behind, one an explicitly rejected photo (caught in
  // review, not by this port's own mount session, which never drove the
  // camera path). `previewing` is exactly the flag `CameraCaptureDialog`'s
  // own `setPreview` prop toggles for this window: `true` from the moment
  // the shutter fires until Confirm or Retake is clicked, `false`
  // otherwise, and it is untouched by the plain file-picker and audio-
  // recorder paths (`AudioCaptureDialog` only ever calls `onCapture` from
  // its own explicit Submit action, after the recording is already
  // reviewed — no analogous pre-confirm window exists there). Retake clears
  // `files` to `[]` in the SAME batched update that flips `previewing` back
  // to `false`, so this effect reruns with nothing left to drain — no row
  // is ever created for a rejected capture. Confirm leaves `files` populated
  // and flips `previewing` to `false` — this effect then drains normally.
  //
  // REVIEW FIX 2 — also gated on `disabled`. `list.addRows` already no-ops
  // internally while the section is frozen (`useStructuredRows`'s own
  // `disabled` check, returning `{ok:false, reason:"disabled"}` without
  // committing), but this effect used to call `fileUpload.clearFiles()`
  // regardless — so a pick made mid-submit vanished from the picker's own
  // buffer with no row ever appearing and no feedback at all. Guarding the
  // whole effect body means a pick made while disabled simply stays queued
  // in `fileUpload.files`, undrained, and is added the moment the section
  // re-enables — never silently discarded. `addControl` below additionally
  // disables `FileUploadDropdown`'s trigger outright, so this branch is a
  // defensive backstop (e.g. a slow async capture resolving just as a
  // submit begins), not the primary defense.
  //
  // Confined to `[fileUpload.files, fileUpload.previewing, disabled]` ON
  // PURPOSE (`react-hooks/exhaustive-deps` disabled below) — `list.addRows`
  // is deliberately NOT a dependency: this is the one place Task 4's
  // render-loop lesson applies directly, since its identity changes on
  // every edit (it closes over `rows`/`edits`, per `useStructuredRows.ts`),
  // and listing it here would re-run this effect on every keystroke in an
  // unrelated cell. Harmless in practice (the guards below no-op), but
  // there is no reason to depend on an unstable callback when the only
  // things that must ever re-trigger this effect are the picker reporting
  // NEW files, the capture-preview window closing, or the section's
  // disabled state changing.
  useEffect(() => {
    if (disabled || fileUpload.files.length === 0 || fileUpload.previewing) {
      return;
    }
    list.addRows(
      fileUpload.files.map((file) => newFileRow(file, encounterId!)),
    );
    fileUpload.clearFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUpload.files, fileUpload.previewing, disabled]);

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
      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.original_name}
      />
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
            // REVIEW FIX 2 (see the effect above): the primary defense.
            // `StructuredList` renders `addControl` OUTSIDE its own
            // `pointer-events-none opacity-40` disabled wrapper, so nothing
            // upstream of this component ever froze it — the picker stayed
            // fully interactive during a submit freeze until this prop
            // existed.
            disabled={disabled}
          />
        }
      />
      {fileUpload.Dialogues}
    </>
  );
}
