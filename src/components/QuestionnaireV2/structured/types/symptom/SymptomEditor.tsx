import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Avatar } from "@/components/Common/Avatar";
import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";

import { AddEntityControl } from "@/components/QuestionnaireV2/structured/core/AddEntityControl";
import { RowStatusSelect } from "@/components/QuestionnaireV2/structured/core/RowStatusSelect";
import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import {
  StructuredList,
  type StructuredColumn,
  type StructuredControlProps,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import type { Code } from "@/types/base/code/code";
import {
  SYMPTOM_CLINICAL_STATUS,
  SYMPTOM_CLINICAL_STATUS_COLORS,
  SYMPTOM_SEVERITY,
  SYMPTOM_SEVERITY_COLORS,
  SYMPTOM_VERIFICATION_STATUS,
  SYMPTOM_VERIFICATION_STATUS_COLORS,
  type Onset,
  type SymptomClinicalStatus,
  type SymptomSeverity,
} from "@/types/emr/symptom/symptom";
import symptomApi from "@/types/emr/symptom/symptomApi";

import {
  SYMPTOM_SOFT_DELETE,
  newSymptomRow,
  projectValues,
  symptomDuplicateKey,
  toBaselineRows,
  toReusedSymptomRow,
  toSymptomRow,
  type SymptomRow,
} from "./model";

/** Encounter-scoped fetch of the first 100 symptoms — the baseline is
 *  capped at `limit: 100`, not guaranteed complete (unlike
 *  `allergy_intolerance`, the fetch is not patient-wide). While the query
 *  is loading or errored the hook gets `undefined`, never `[]`. */
function useSymptomBaseline(
  patientId: string | undefined,
  encounterId: string | undefined,
): readonly BaselineRow<SymptomRow>[] | undefined {
  const { data } = useQuery({
    queryKey: ["symptoms", patientId, encounterId],
    queryFn: query(symptomApi.listSymptoms, {
      pathParams: { patientId: patientId! },
      queryParams: { limit: 100, encounter: encounterId },
    }),
    enabled: !!patientId && !!encounterId,
  });
  return useMemo(
    () => (data ? toBaselineRows(data.results) : undefined),
    [data],
  );
}

function ClinicalStatusSelect({
  status,
  onValueChange,
  disabled,
  controlProps,
}: {
  status: SymptomClinicalStatus;
  onValueChange: (value: SymptomClinicalStatus) => void;
  disabled?: boolean;
  controlProps: StructuredControlProps;
}) {
  const { t } = useTranslation();
  return (
    <Select value={status} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger {...controlProps} className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SYMPTOM_CLINICAL_STATUS.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SeveritySelect({
  severity,
  onValueChange,
  disabled,
  controlProps,
}: {
  severity: SymptomSeverity;
  onValueChange: (value: SymptomSeverity) => void;
  disabled?: boolean;
  controlProps: StructuredControlProps;
}) {
  const { t } = useTranslation();
  return (
    <Select value={severity} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger {...controlProps} className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SYMPTOM_SEVERITY.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Every verification-status option, already translated — `RowStatusSelect`
 *  never imports i18next itself. Unlike `allergy_intolerance`'s
 *  `ALLERGY_VERIFICATION_STATUS` (an object display-label map),
 *  `SYMPTOM_VERIFICATION_STATUS` is already the plain enum tuple, so there
 *  is no second map to reconcile here. */
function useVerificationStatusOptions() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      SYMPTOM_VERIFICATION_STATUS.map((value) => ({ value, label: t(value) })),
    [t],
  );
}

function todayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Fields for the STAGED (mobile add-flow) row — shares intent, not markup,
 * with the desktop `StructuredList` columns (mirrors `AllergyEditor.tsx`'s
 * `StagedAllergyFields`). A staged row never has a server `id`, so onset is
 * never frozen here — the freeze only applies once a row is a real,
 * persisted baseline record (see the "onset" column below).
 */
function StagedSymptomFields({
  row,
  onUpdate,
  disabled,
}: {
  row: SymptomRow;
  onUpdate: (patch: Partial<SymptomRow>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const verificationOptions = useVerificationStatusOptions();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("onset_date")}</label>
        <Input
          id="staged-symptom-onset"
          aria-label={t("onset_date")}
          type="date"
          max={todayDateString()}
          value={row.onset?.onset_datetime ?? ""}
          onChange={(e) =>
            onUpdate({
              onset: {
                ...row.onset,
                onset_datetime: e.target.value || undefined,
              },
            })
          }
          disabled={disabled}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("status")}</label>
        <ClinicalStatusSelect
          status={row.clinical_status}
          onValueChange={(value) => onUpdate({ clinical_status: value })}
          disabled={disabled}
          controlProps={{
            id: "staged-symptom-status",
            "aria-label": t("status"),
          }}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("severity")}</label>
        <SeveritySelect
          severity={row.severity}
          onValueChange={(value) => onUpdate({ severity: value })}
          disabled={disabled}
          controlProps={{
            id: "staged-symptom-severity",
            "aria-label": t("severity"),
          }}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("verification")}</label>
        <RowStatusSelect
          id="staged-symptom-verification"
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
        <label className="text-xs text-gray-500">{t("note")}</label>
        <Input
          id="staged-symptom-note"
          aria-label={t("note")}
          placeholder={t("additional_notes")}
          value={row.note ?? ""}
          onChange={(e) => onUpdate({ note: e.target.value })}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

export function SymptomEditor({
  question,
  disabled,
  errors,
  patientId,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const verificationOptions = useVerificationStatusOptions();
  const baseline = useSymptomBaseline(patientId, encounterId);

  const list = useStructuredRows({
    questionId: question.id,
    baseline,
    projectValues,
    softDelete: SYMPTOM_SOFT_DELETE,
    duplicateKey: symptomDuplicateKey,
    disabled,
  });

  const columns: StructuredColumn<SymptomRow>[] = useMemo(
    () => [
      {
        key: "code",
        header: t("symptom"),
        width: "minmax(10rem, 1fr)",
        // The mobile card's own title already shows this value (`rowTitle`
        // below) — mirrors `AllergyEditor`'s "substance" column.
        mobileHidden: true,
        render: ({ row }) => (
          <span className="block truncate font-medium">
            {row.row.code.display}
          </span>
        ),
      },
      {
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
                onset: {
                  ...row.row.onset,
                  onset_datetime: e.target.value || undefined,
                },
              })
            }
            // Onset is frozen once the row is a persisted baseline record.
            // A historical symptom re-added via `toReusedSymptomRow` has
            // its id stripped (origin "added"), so its onset stays
            // editable.
            disabled={cellDisabled || row.origin === "baseline"}
          />
        ),
      },
      {
        key: "clinical_status",
        header: t("status"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <ClinicalStatusSelect
            status={row.row.clinical_status}
            onValueChange={(value) => update({ clinical_status: value })}
            disabled={cellDisabled}
            controlProps={controlProps}
          />
        ),
      },
      {
        key: "severity",
        header: t("severity"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <SeveritySelect
            severity={row.row.severity}
            onValueChange={(value) => update({ severity: value })}
            disabled={cellDisabled}
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
        header: t("note"),
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

  const addSymptomPlaceholder = t("add_symptom", {
    count: list.rows.length + 1,
  });

  // Surfaces the `duplicateKey` rejection as a warning toast.
  const handleAdd = useCallback(
    (row: SymptomRow) => {
      const result = list.addRow(row);
      if (!result.ok && result.reason === "duplicate") {
        toast.warning(t("symptom_already_exist_warning"));
      }
    },
    [list, t],
  );

  // Each selected historical symptom is re-added as a new row; the same
  // duplicate guard as `addRow` rejects collisions, one toast per
  // rejection.
  const handleAddHistorical = useCallback(
    (selected: SymptomRow[]) => {
      if (!encounterId) return;
      const results = list.addRows(
        selected.map((row) => toReusedSymptomRow(row, encounterId)),
      );
      for (const result of results) {
        if (!result.ok && result.reason === "duplicate") {
          toast.warning(t("symptom_already_exist_warning"));
        }
      }
    },
    [list, encounterId, t],
  );

  return (
    <div className="space-y-2">
      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.code.display}
      />
      <div className="flex flex-wrap items-center justify-end">
        <HistoricalRecordSelector<SymptomRow>
          title={t("past_symptoms")}
          structuredTypes={[
            {
              type: t("symptoms"),
              displayFields: [
                {
                  key: "code",
                  label: t("symptom"),
                  render: (code: Code) => code?.display || "",
                },
                {
                  key: "clinical_status",
                  label: t("status"),
                  render: (status: string) => (
                    <Badge
                      variant={
                        SYMPTOM_CLINICAL_STATUS_COLORS[
                          status as keyof typeof SYMPTOM_CLINICAL_STATUS_COLORS
                        ]
                      }
                    >
                      {t(status)}
                    </Badge>
                  ),
                },
                {
                  key: "verification_status",
                  label: t("verification"),
                  render: (verification_status: string) => (
                    <Badge
                      variant={
                        SYMPTOM_VERIFICATION_STATUS_COLORS[
                          verification_status as keyof typeof SYMPTOM_VERIFICATION_STATUS_COLORS
                        ]
                      }
                    >
                      {t(verification_status)}
                    </Badge>
                  ),
                },
                {
                  key: "severity",
                  label: t("severity"),
                  render: (severity: string) => (
                    <Badge
                      variant={
                        SYMPTOM_SEVERITY_COLORS[
                          severity as keyof typeof SYMPTOM_SEVERITY_COLORS
                        ]
                      }
                    >
                      {t(severity)}
                    </Badge>
                  ),
                },
                {
                  key: "created_by",
                  label: t("recorded_by"),
                  render: (created_by) => (
                    <div className="flex items-center gap-2">
                      <Avatar
                        imageUrl={created_by?.profile_picture_url}
                        name={formatName(created_by, true)}
                        className="size-6 rounded-full"
                      />
                      <span className="text-sm truncate">
                        {formatName(created_by)}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "onset",
                  label: t("onset_date"),
                  render: (onset: Onset) =>
                    onset?.onset_datetime
                      ? format(new Date(onset.onset_datetime), "dd MMM yyyy")
                      : "",
                },
              ],
              expandableFields: [
                {
                  key: "note",
                  label: t("notes"),
                  render: (note) => note,
                },
              ],
              queryKey: ["symptoms", patientId ?? ""],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) =>
                query(symptomApi.listSymptoms, {
                  pathParams: { patientId: patientId! },
                  queryParams: {
                    offset,
                    limit,
                    exclude_verification_status: "entered_in_error",
                  },
                })({ signal }),
              converter: toSymptomRow,
            },
          ]}
          buttonLabel={t("symptom_history")}
          onAddSelected={handleAddHistorical}
        />
      </div>

      <StructuredList
        questionId={question.id}
        label={t("structured_type__symptom")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={list.removeRow}
        rowTitle={(row) => row.row.code.display}
        rowSummary={(row) =>
          [
            row.row.onset?.onset_datetime
              ? `${t("onset")} ${format(new Date(row.row.onset.onset_datetime), "MMM d, yyyy")}`
              : undefined,
            t(row.row.clinical_status),
            t(row.row.severity),
          ]
            .filter((part): part is string => !!part)
            .join(" · ")
        }
        // An entered-in-error row freezes entirely.
        rowDisabled={(row) => row.softDeleted}
        // `newSymptomRow` bakes the current encounter into the row and
        // `toRequests` refuses to submit without one — with no encounter
        // in context the add control is omitted rather than creating rows
        // that could never save.
        addControl={
          encounterId ? (
            <AddEntityControl<SymptomRow>
              system="system-condition-code"
              entityType="symptom"
              placeholder={addSymptomPlaceholder}
              disabled={disabled}
              createRow={(code: Code) => newSymptomRow(code, encounterId)}
              onAdd={handleAdd}
              renderStagedRow={(staged, updateStaged) => (
                <StagedSymptomFields
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
