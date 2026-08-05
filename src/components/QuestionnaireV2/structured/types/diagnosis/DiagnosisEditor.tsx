import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import { AddEntityControl } from "@/components/QuestionnaireV2/structured/core/AddEntityControl";
import { RowStatusSelect } from "@/components/QuestionnaireV2/structured/core/RowStatusSelect";
import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import {
  StructuredList,
  type StructuredColumn,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import { formatCalendarDate } from "@/components/QuestionnaireV2/structured/shared/calendarDate";
import {
  EnumSelect,
  todayDateString,
  useTranslatedOptions,
} from "@/components/QuestionnaireV2/structured/shared/editorPrimitives";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import query from "@/Utils/request/query";
import type { Code } from "@/types/base/code/code";
import {
  DIAGNOSIS_CLINICAL_STATUS,
  DIAGNOSIS_SEVERITY,
  DIAGNOSIS_VERIFICATION_STATUS,
  type DiagnosisSeverity,
} from "@/types/emr/diagnosis/diagnosis";
import diagnosisApi from "@/types/emr/diagnosis/diagnosisApi";

import {
  DIAGNOSIS_SOFT_DELETE,
  diagnosisDisplayOrder,
  diagnosisDuplicateKey,
  isOnsetFrozen,
  newDiagnosisRow,
  projectValues,
  toBaselineRows,
  toDiagnosisRow,
  toReusedDiagnosisRow,
  type DiagnosisRow,
} from "./model";

/** Encounter-scoped fetch of the first 100 diagnoses — the baseline is
 *  capped at `limit: 100`, not guaranteed complete. While the query is
 *  loading or errored the hook gets `undefined`, never `[]`, so a section
 *  mid-fetch is never mistaken for "the server returned zero diagnoses." */
function useDiagnosisBaseline(
  patientId: string | undefined,
  encounterId: string | undefined,
): readonly BaselineRow<DiagnosisRow>[] | undefined {
  const { data } = useQuery({
    queryKey: ["diagnoses", patientId, encounterId],
    queryFn: query(diagnosisApi.listDiagnosis, {
      pathParams: { patientId: patientId! },
      queryParams: {
        encounter: encounterId,
        limit: 100,
        category: "encounter_diagnosis,chronic_condition",
      },
    }),
    enabled: !!patientId && !!encounterId,
  });
  return useMemo(
    () => (data ? toBaselineRows(data.results) : undefined),
    [data],
  );
}

/**
 * Fields for the STAGED (mobile add-flow) row. Onset is always editable
 * here: a staged row never carries a server id, so the date input has no
 * freeze condition to apply.
 */
function StagedDiagnosisFields({
  row,
  onUpdate,
  disabled,
}: {
  row: DiagnosisRow;
  onUpdate: (patch: Partial<DiagnosisRow>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const verificationOptions = useTranslatedOptions(
    DIAGNOSIS_VERIFICATION_STATUS,
  );
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("onset_date")}</label>
        <Input
          id="staged-diagnosis-onset"
          aria-label={t("onset_date")}
          type="date"
          max={todayDateString()}
          value={row.onset?.onset_datetime ?? ""}
          onChange={(e) =>
            onUpdate({
              onset: e.target.value
                ? { onset_datetime: e.target.value }
                : undefined,
            })
          }
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("status")}</label>
        <EnumSelect
          value={row.clinical_status}
          options={DIAGNOSIS_CLINICAL_STATUS}
          onValueChange={(value) => onUpdate({ clinical_status: value })}
          disabled={disabled}
          placeholder={t("diagnosis_status_placeholder")}
          controlProps={{
            id: "staged-diagnosis-status",
            "aria-label": t("status"),
          }}
          itemClassName="capitalize"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("severity")}</label>
        <EnumSelect
          value={row.severity}
          options={DIAGNOSIS_SEVERITY}
          onValueChange={(value) => onUpdate({ severity: value })}
          disabled={disabled}
          placeholder={t("choose_severity")}
          controlProps={{
            id: "staged-diagnosis-severity",
            "aria-label": t("severity"),
          }}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("verification")}</label>
        <RowStatusSelect
          id="staged-diagnosis-verification"
          aria-label={t("verification")}
          value={row.verification_status}
          onValueChange={(value) => onUpdate({ verification_status: value })}
          options={verificationOptions}
          hiddenForNewRow="entered_in_error"
          isExistingRecord={!!row.id}
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("notes")}</label>
        <Input
          id="staged-diagnosis-note"
          aria-label={t("notes")}
          placeholder={t("additional_notes")}
          value={row.note ?? ""}
          onChange={(e) => onUpdate({ note: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function DiagnosisEditor({
  question,
  disabled,
  errors,
  patientId,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const verificationOptions = useTranslatedOptions(
    DIAGNOSIS_VERIFICATION_STATUS,
  );
  const baseline = useDiagnosisBaseline(patientId, encounterId);

  const list = useStructuredRows({
    questionId: question.id,
    baseline,
    projectValues,
    softDelete: DIAGNOSIS_SOFT_DELETE,
    duplicateKey: diagnosisDuplicateKey,
    // Display-only: sorts what the clinician sees by onset date; the edit
    // log and baseline never see this order (see `diagnosisDisplayOrder`).
    displayOrder: diagnosisDisplayOrder,
    disabled,
  });

  const handleAdd = useCallback(
    (row: DiagnosisRow) => {
      const result = list.addRow(row);
      if (!result.ok && result.reason === "duplicate") {
        toast.warning(t("diagnosis_already_exist_warning"));
      }
    },
    [list, t],
  );

  // Each selected historical diagnosis is re-added as a NEW row for this
  // encounter (`toReusedDiagnosisRow` strips the server id and defaults a
  // null severity). Duplicate filtering is `list.addRows`' job via
  // `duplicateKey`; one warning toast covers any rejected duplicates in
  // the batch.
  const handleAddHistorical = useCallback(
    (selected: DiagnosisRow[]) => {
      if (!encounterId) return;
      const results = list.addRows(
        selected.map((row) => toReusedDiagnosisRow(row, encounterId)),
      );
      if (
        results.some((result) => !result.ok && result.reason === "duplicate")
      ) {
        toast.warning(t("diagnosis_already_exist_warning"));
      }
    },
    [list, encounterId, t],
  );

  const columns: StructuredColumn<DiagnosisRow>[] = useMemo(
    () => [
      {
        key: "diagnosis",
        header: t("diagnosis"),
        width: "minmax(12rem, 1fr)",
        // The mobile card's own title already shows this value (`rowTitle`
        // below) — mirrors `ChargeItemEditor`'s "item" column.
        mobileHidden: true,
        render: ({ row }) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium" title={row.row.code.display}>
              {row.row.code.display}
            </span>
            <Badge variant="secondary" className="shrink-0">
              {t(`Diagnosis_${row.row.category}__title`)}
            </Badge>
          </div>
        ),
      },
      {
        // Keyed "onset", not "onset_date" — matches `DiagnosisRequest`'s own
        // wire field name, so a server validation error keyed on `onset`
        // binds here via the DEFAULT `errorFieldKeys` (`[key]`) with no
        // extra mapping needed.
        key: "onset",
        header: t("onset_date"),
        width: "10rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Input
            {...controlProps}
            type="date"
            max={todayDateString()}
            value={row.row.onset?.onset_datetime ?? ""}
            onChange={(e) =>
              update({
                onset: e.target.value
                  ? { onset_datetime: e.target.value }
                  : undefined,
              })
            }
            // Onset is frozen once the row has reached the server — see
            // `isOnsetFrozen`'s own doc comment (`./model.ts`).
            disabled={cellDisabled || isOnsetFrozen(row.origin)}
          />
        ),
      },
      {
        key: "clinical_status",
        header: t("status"),
        width: "10rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <EnumSelect
            value={row.row.clinical_status}
            options={DIAGNOSIS_CLINICAL_STATUS}
            onValueChange={(value) => update({ clinical_status: value })}
            disabled={cellDisabled}
            placeholder={t("diagnosis_status_placeholder")}
            controlProps={controlProps}
            itemClassName="capitalize"
          />
        ),
      },
      {
        key: "severity",
        header: t("severity"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <EnumSelect
            value={row.row.severity}
            options={DIAGNOSIS_SEVERITY}
            onValueChange={(value) => update({ severity: value })}
            disabled={cellDisabled}
            placeholder={t("choose_severity")}
            controlProps={controlProps}
          />
        ),
      },
      {
        key: "verification_status",
        header: t("verification"),
        width: "10rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <RowStatusSelect
            {...controlProps}
            value={row.row.verification_status}
            onValueChange={(value) => update({ verification_status: value })}
            options={verificationOptions}
            hiddenForNewRow="entered_in_error"
            isExistingRecord={row.origin === "baseline"}
            disabled={cellDisabled}
          />
        ),
      },
      {
        key: "note",
        header: t("notes"),
        width: "minmax(10rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Input
            {...controlProps}
            placeholder={t("additional_notes")}
            value={row.row.note ?? ""}
            onChange={(e) => update({ note: e.target.value })}
            disabled={cellDisabled}
          />
        ),
      },
    ],
    [t, verificationOptions],
  );

  const addDiagnosisPlaceholder = t("add_diagnosis", {
    count: list.rows.length + 1,
  });

  return (
    <div className="space-y-4">
      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.code.display}
      />
      <div className="flex flex-wrap items-center justify-end">
        <HistoricalRecordSelector<DiagnosisRow>
          title={t("past_diagnoses")}
          structuredTypes={[
            {
              type: t("diagnoses"),
              converter: toDiagnosisRow,
              displayFields: [
                {
                  key: "code",
                  label: t("diagnosis"),
                  render: (code: Code) => code?.display || "-",
                },
                {
                  key: "clinical_status",
                  label: t("status"),
                  render: (status: string) => t(status),
                },
                {
                  key: "verification_status",
                  label: t("verification"),
                  render: (status: string) => t(status),
                },
                {
                  key: "severity",
                  label: t("severity"),
                  render: (severity: DiagnosisSeverity | null) =>
                    severity ? t(severity) : "-",
                },
                {
                  key: "onset",
                  label: t("onset_date"),
                  render: (onset: DiagnosisRow["onset"]) =>
                    formatCalendarDate(onset?.onset_datetime, "dd MMM yyyy"),
                },
              ],
              expandableFields: [
                { key: "note", label: t("notes"), render: (note) => note },
              ],
              queryKey: ["diagnoses_and_chronic_conditions", patientId ?? ""],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) =>
                query(diagnosisApi.listDiagnosis, {
                  pathParams: { patientId: patientId! },
                  queryParams: {
                    offset,
                    limit,
                    exclude_verification_status: "entered_in_error",
                    category: "encounter_diagnosis,chronic_condition",
                  },
                })({ signal }),
            },
          ]}
          buttonLabel={t("diagnosis_history")}
          onAddSelected={handleAddHistorical}
          disableAPI={!patientId}
        />
      </div>

      <StructuredList
        questionId={question.id}
        label={t("structured_type__diagnosis")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={list.removeRow}
        rowTitle={(row) => row.row.code.display}
        rowSummary={(row) =>
          [
            t(`Diagnosis_${row.row.category}__title`),
            t(row.row.clinical_status),
            t(row.row.verification_status),
            ...(row.row.severity ? [t(row.row.severity)] : []),
          ].join(" · ")
        }
        // An entered-in-error row freezes entirely; reads the row's own
        // `softDeleted` flag, never a positional lookup.
        rowDisabled={(row) => row.softDeleted}
        // `newDiagnosisRow` bakes the current encounter into the row and
        // `toRequests` refuses to submit without one — with no encounter
        // in context the add control is omitted rather than creating rows
        // that could never save.
        addControl={
          encounterId ? (
            <AddEntityControl<DiagnosisRow>
              system="system-condition-code"
              entityType="diagnosis"
              placeholder={addDiagnosisPlaceholder}
              disabled={disabled}
              createRow={(code: Code) => newDiagnosisRow(code, encounterId)}
              onAdd={handleAdd}
              renderStagedRow={(staged, updateStaged) => (
                <StagedDiagnosisFields
                  row={staged}
                  onUpdate={updateStaged}
                  disabled={disabled}
                />
              )}
            />
          ) : undefined
        }
      />
    </div>
  );
}
