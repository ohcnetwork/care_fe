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
 *  into a baseline, ever. Module scope so the baseline keeps one identity
 *  across renders (a fresh `[]` literal would defeat `useStructuredRows`'s
 *  memoization). Passed explicitly so the core receives the honest complete
 *  set — "the server confirmed zero rows", per the BASELINE COMPLETENESS
 *  CONTRACT, which names `files` as permanently baseline-free — not
 *  `undefined`, its "still loading/errored" signal. */
const NO_BASELINE: readonly BaselineRow<FileUploadRow>[] = [];

export function FilesEditor({
  question,
  disabled,
  errors,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
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

  // `useFileUpload` owns its `File[]` buffer and exposes no "on selected"
  // callback, so this effect is the only seam. It is a SOURCE of files, not
  // the source of truth: every file it reports becomes a row immediately
  // (`addRows` batches them together) and the buffer is cleared in the same
  // tick, leaving a single store to read, update or remove from.
  //
  // `previewing` gates the drain: a camera capture appends to
  // `fileUpload.files` the instant the shutter fires, before the clinician
  // has chosen Retake/Confirm. Draining during that window would promote a
  // not-yet-reviewed photo into a permanent row that Retake (`clearFiles`)
  // could no longer retract. Retake empties `files` in the same batched
  // update that flips `previewing` off, so nothing is drained for a rejected
  // capture; Confirm leaves `files` populated and the drain runs. The plain
  // file-picker and audio-recorder paths never set `previewing`.
  //
  // `disabled` gates the whole body: `addRows` already no-ops while frozen,
  // but clearing the buffer anyway would silently discard a pick made
  // mid-submit. Left queued, it is added the moment the section re-enables.
  // (`addControl` also disables the picker trigger; this is the backstop.)
  //
  // `list.addRows` is deliberately NOT a dependency — its identity changes on
  // every edit (it closes over rows/edits), so listing it would re-run this
  // effect on every keystroke in an unrelated cell. Only new files, the
  // preview window closing, or the disabled state may re-trigger it.
  useEffect(() => {
    if (
      disabled ||
      !encounterId ||
      fileUpload.files.length === 0 ||
      fileUpload.previewing
    ) {
      return;
    }
    list.addRows(fileUpload.files.map((file) => newFileRow(file, encounterId)));
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
            // The placeholder is load-bearing for file-input automation and
            // must stay exactly `t("file_name")`.
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
        // The row title below is this exact value — the collapsed mobile
        // card already shows it, so don't print it twice as a stacked field.
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
          // This must stay in the addControl slot, rendered directly, so the
          // dropdown's own hidden input remains available without a portal.
          <FileUploadDropdown
            fileUpload={fileUpload}
            buttonVariant="secondary"
            buttonClassName="border border-secondary-300"
            // `StructuredList` renders `addControl` OUTSIDE its own
            // `pointer-events-none opacity-40` disabled wrapper, so the
            // picker must be disabled here explicitly or it stays fully
            // interactive during a submit freeze.
            disabled={disabled}
          />
        }
      />
      {fileUpload.Dialogues}
    </>
  );
}
