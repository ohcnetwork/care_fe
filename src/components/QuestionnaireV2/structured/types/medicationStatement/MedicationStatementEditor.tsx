import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Common/Avatar";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { HistoricalRecordSelector } from "@/components/HistoricalRecordSelector";
import { DosageInstructionList } from "@/components/Medicine/DosageInstructionList";
import { FormattedDosage } from "@/components/Medicine/FormattedDosage";
import { formatDuration, formatFrequency } from "@/components/Medicine/utils";

import { AddEntityControl } from "@/components/QuestionnaireV2/structured/core/AddEntityControl";
import { RowStatusSelect } from "@/components/QuestionnaireV2/structured/core/RowStatusSelect";
import {
  StructuredList,
  type StructuredColumn,
  type StructuredControlProps,
} from "@/components/QuestionnaireV2/structured/core/StructuredList";
import type {
  BaselineRow,
  RowId,
} from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import type { Code } from "@/types/base/code/code";
import {
  MedicationRequestDosageInstruction,
  MedicationRequestRead,
  displayMedicationName,
} from "@/types/emr/medicationRequest/medicationRequest";
import medicationRequestApi from "@/types/emr/medicationRequest/medicationRequestApi";
import {
  MEDICATION_STATEMENT_STATUS,
  MedicationStatementInformationSourceType,
  MedicationStatementRead,
} from "@/types/emr/medicationStatement";
import medicationStatementApi from "@/types/emr/medicationStatement/medicationStatementApi";
import type { Period } from "@/types/questionnaire/base";

import {
  MEDICATION_STATEMENT_FIELD_KEYS,
  MEDICATION_STATEMENT_SOFT_DELETE,
  fromHistoricalMedicationRequest,
  fromHistoricalMedicationStatement,
  newMedicationStatementRow,
  periodDateForInput,
  periodDateFromInput,
  projectValues,
  toBaselineRows,
  type MedicationStatementRow,
} from "./model";

/** Medication statements are prefetched once per (patient, encounter) — no
 *  partial baseline state; while the query is loading or errored the hook
 *  gets `undefined` (BASELINE COMPLETENESS CONTRACT), never `[]`, so a
 *  section mid-fetch is never mistaken for "the server confirmed zero
 *  medications." */
function useMedicationStatementBaseline(
  patientId: string | undefined,
  encounterId: string | undefined,
): readonly BaselineRow<MedicationStatementRow>[] | undefined {
  const { data } = useQuery({
    queryKey: ["medication_statements", patientId, encounterId],
    queryFn: query(medicationStatementApi.list, {
      pathParams: { patientId: patientId! },
      queryParams: { limit: 100, encounter: encounterId },
    }),
    enabled: !!patientId,
  });
  return useMemo(
    () => (data ? toBaselineRows(data.results) : undefined),
    [data],
  );
}

const INFORMATION_SOURCE_OPTIONS: {
  value: MedicationStatementInformationSourceType;
  icon: IconName;
}[] = [
  { value: MedicationStatementInformationSourceType.PATIENT, icon: "l-user" },
  {
    value: MedicationStatementInformationSourceType.PRACTITIONER,
    icon: "l-user-nurse",
  },
  {
    value: MedicationStatementInformationSourceType.RELATED_PERSON,
    icon: "l-users-alt",
  },
];

function InformationSourceSelect({
  value,
  onValueChange,
  disabled,
  controlProps,
}: {
  value: MedicationStatementInformationSourceType;
  onValueChange: (value: MedicationStatementInformationSourceType) => void;
  disabled?: boolean;
  controlProps: StructuredControlProps;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={value}
      onValueChange={(next) =>
        onValueChange(next as MedicationStatementInformationSourceType)
      }
      disabled={disabled}
    >
      <SelectTrigger {...controlProps} className="h-9 w-full capitalize">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {INFORMATION_SOURCE_OPTIONS.map((source) => (
          <SelectItem
            key={source.value}
            value={source.value}
            className="capitalize"
          >
            <CareIcon icon={source.icon} className="mr-2" />
            {t(source.value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Every status option, already translated — `RowStatusSelect` never
 *  imports i18next itself. Mirrors `medication_status__${value}` exactly,
 *  the same key family `MedicationStatementGridRow`'s own Select used
 *  (`MedicationStatementQuestion.tsx:852`). */
function useStatusOptions() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      MEDICATION_STATEMENT_STATUS.map((value) => ({
        value,
        label: t(`medication_status__${value}`),
      })),
    [t],
  );
}

function EffectivePeriodFields({
  period,
  onChange,
  disabled,
  fieldId,
  describedBy,
  invalid,
}: {
  period: Period | undefined;
  onChange: (period: Period | undefined) => void;
  disabled?: boolean;
  fieldId: string;
  describedBy: string | undefined;
  invalid: boolean;
}) {
  const { t } = useTranslation();
  // The native input speaks bare "yyyy-MM-dd"; the row's wire value is a
  // timezone-aware ISO instant (`periodDateForInput`/`periodDateFromInput`'s
  // own doc comment has the full "why" — the backend 400s on a naive
  // datetime). This boundary crossing happens HERE, and only here.
  const setStart = (value: string) => {
    const next = { ...period, start: periodDateFromInput(value) };
    onChange(next.start || next.end ? next : undefined);
  };
  const setEnd = (value: string) => {
    const next = { ...period, end: periodDateFromInput(value) };
    onChange(next.start || next.end ? next : undefined);
  };
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <div className="w-full sm:w-1/2">
        <Input
          id={`${fieldId}--start`}
          aria-label={t("start_date")}
          aria-required
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          type="date"
          value={periodDateForInput(period?.start)}
          onChange={(e) => setStart(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="w-full sm:w-1/2">
        <Input
          id={`${fieldId}--end`}
          aria-label={t("end_date")}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          type="date"
          value={periodDateForInput(period?.end)}
          onChange={(e) => setEnd(e.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/**
 * Fields for the STAGED (mobile add-flow) row, shared with the desktop
 * `StructuredList` columns only in intent, not in markup — mirrors
 * `allergyIntolerance/AllergyEditor.tsx`'s `StagedAllergyFields`. A staged
 * row is always a fresh `add` (never a server record yet), so none of the
 * `isReadOnly` field-freezing below applies to it.
 */
function StagedMedicationFields({
  row,
  onUpdate,
  disabled,
}: {
  row: MedicationStatementRow;
  onUpdate: (patch: Partial<MedicationStatementRow>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const statusOptions = useStatusOptions();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("source")}</label>
        <InformationSourceSelect
          value={row.information_source}
          onValueChange={(value) => onUpdate({ information_source: value })}
          disabled={disabled}
          controlProps={{
            id: "staged-medication-source",
            "aria-label": t("source"),
          }}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("status")}</label>
        <RowStatusSelect
          id="staged-medication-status"
          aria-label={t("status")}
          value={row.status}
          onValueChange={(value) => onUpdate({ status: value })}
          options={statusOptions}
          hiddenForNewRow="entered_in_error"
          isExistingRecord={!!row.id}
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">
          {t("dosage_instructions")}
          <span className="ml-0.5 text-red-500">*</span>
        </label>
        <Input
          id="staged-medication-dosage"
          aria-label={t("dosage_instructions")}
          placeholder={t("enter_dosage_instructions")}
          value={row.dosage_text}
          onChange={(e) => onUpdate({ dosage_text: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">
          {t("medication_taken_between")}
          <span className="ml-0.5 text-red-500">*</span>
        </label>
        <EffectivePeriodFields
          period={row.effective_period}
          onChange={(period) => onUpdate({ effective_period: period })}
          disabled={disabled}
          fieldId="staged-medication-period"
          describedBy={undefined}
          invalid={false}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("reason")}</label>
        <Input
          id="staged-medication-reason"
          aria-label={t("reason")}
          placeholder={t("reason_for_medication")}
          value={row.reason ?? ""}
          onChange={(e) => onUpdate({ reason: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("note")}</label>
        <Input
          id="staged-medication-note"
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

export function MedicationStatementEditor({
  question,
  disabled,
  errors,
  patientId,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const statusOptions = useStatusOptions();
  const baseline = useMedicationStatementBaseline(patientId, encounterId);
  const [pendingRemoveRowId, setPendingRemoveRowId] = useState<RowId | null>(
    null,
  );

  // No explicit type arguments — `TRow` infers from `projectValues`, `Mode`
  // defaults to "list" (medication_statement is a genuine list).
  const list = useStructuredRows({
    questionId: question.id,
    baseline,
    projectValues,
    softDelete: MEDICATION_STATEMENT_SOFT_DELETE,
    disabled,
  });

  const pendingRemoveRow = list.rows.find(
    (row) => row.rowId === pendingRemoveRowId,
  );

  const columns: StructuredColumn<MedicationStatementRow>[] = useMemo(
    () => [
      {
        key: "medicine",
        header: t("medicine"),
        width: "minmax(12rem, 1fr)",
        // The mobile card's own title already shows this value (`rowTitle`
        // below) — mirrors `AllergyEditor`'s "substance" column.
        mobileHidden: true,
        render: ({ row }) => (
          <span className="block truncate font-medium">
            {row.row.medication.display}
          </span>
        ),
      },
      {
        key: "information_source",
        header: t("source"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <InformationSourceSelect
            value={row.row.information_source}
            onValueChange={(value) => update({ information_source: value })}
            // isReadOnly: source freezes once the row is a server record —
            // mirrors `MedicationStatementQuestion.tsx`'s
            // `isReadOnly = !!medication.id` (:767, :795).
            disabled={cellDisabled || row.origin === "baseline"}
            controlProps={controlProps}
          />
        ),
      },
      {
        key: "status",
        header: t("status"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <RowStatusSelect
            {...controlProps}
            value={row.row.status}
            onValueChange={(value) => update({ status: value })}
            options={statusOptions}
            hiddenForNewRow="entered_in_error"
            isExistingRecord={row.origin === "baseline"}
            // Status stays editable even on a server record — legacy never
            // gates this Select on `isReadOnly`, only on the section-level
            // `disabled`.
            disabled={cellDisabled}
          />
        ),
      },
      {
        key: MEDICATION_STATEMENT_FIELD_KEYS.DOSAGE,
        header: t("dosage_instructions"),
        required: true,
        width: "minmax(12rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Input
            {...controlProps}
            placeholder={t("enter_dosage_instructions")}
            value={row.row.dosage_text}
            onChange={(e) => update({ dosage_text: e.target.value })}
            disabled={cellDisabled || row.origin === "baseline"}
          />
        ),
      },
      {
        key: MEDICATION_STATEMENT_FIELD_KEYS.PERIOD,
        header: t("medication_taken_between"),
        required: true,
        width: "minmax(16rem, 1fr)",
        render: ({
          row,
          update,
          disabled: cellDisabled,
          fieldId,
          describedBy,
          invalid,
        }) => (
          <EffectivePeriodFields
            period={row.row.effective_period}
            onChange={(period) => update({ effective_period: period })}
            disabled={cellDisabled || row.origin === "baseline"}
            fieldId={fieldId}
            describedBy={describedBy}
            invalid={invalid}
          />
        ),
      },
      {
        key: "reason",
        header: t("reason"),
        width: "minmax(10rem, 1fr)",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Input
            {...controlProps}
            maxLength={100}
            placeholder={t("reason_for_medication")}
            value={row.row.reason ?? ""}
            onChange={(e) => update({ reason: e.target.value })}
            disabled={cellDisabled || row.origin === "baseline"}
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
    [t, statusOptions],
  );

  const addPlaceholder = t("add_medication", { count: list.rows.length + 1 });

  return (
    <div className="space-y-4">
      <ConfirmActionDialog
        open={pendingRemoveRowId !== null}
        onOpenChange={(open) => !open && setPendingRemoveRowId(null)}
        title={t("remove_medication")}
        description={t("remove_medication_confirmation", {
          medication: pendingRemoveRow?.row.medication.display,
        })}
        onConfirm={() => {
          if (pendingRemoveRowId) list.removeRow(pendingRemoveRowId);
          setPendingRemoveRowId(null);
        }}
        confirmText={t("remove")}
        variant="destructive"
      />

      <div className="flex flex-wrap items-center justify-end">
        <HistoricalRecordSelector<
          MedicationRequestRead | MedicationStatementRead
        >
          title={t("medication_history")}
          structuredTypes={[
            {
              type: t("past_prescriptions"),
              displayFields: [
                {
                  key: "",
                  label: t("medicine"),
                  render: (med) => displayMedicationName(med),
                },
                {
                  key: "dosage_instruction",
                  label: t("dosage"),
                  render: (instructions) =>
                    instructions?.length ? (
                      <DosageInstructionList
                        instructions={instructions}
                        renderItem={(di) => {
                          const freq = formatFrequency(di) || "";
                          return (
                            <div className="flex flex-col">
                              <FormattedDosage instruction={di} fallback="" />
                              {freq && <span>{freq}</span>}
                            </div>
                          );
                        }}
                        gap="sm"
                      />
                    ) : (
                      "-"
                    ),
                },
                {
                  key: "dosage_instruction",
                  label: t("duration"),
                  render: (instructions) =>
                    instructions?.length ? (
                      <DosageInstructionList
                        instructions={instructions}
                        renderItem={(di) => formatDuration(di) || "-"}
                        gap="sm"
                      />
                    ) : (
                      "-"
                    ),
                },
                {
                  key: "created_by",
                  label: t("prescribed_by"),
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
              ],
              expandableFields: [
                {
                  key: "dosage_instruction",
                  label: t("instructions"),
                  render: (instructions) =>
                    instructions
                      ?.flatMap(
                        (di: MedicationRequestDosageInstruction) =>
                          di.additional_instruction?.map(
                            (inst) => inst.display,
                          ) ?? [],
                      )
                      .filter(Boolean)
                      .join(", ") || undefined,
                },
                {
                  key: "note",
                  label: t("notes"),
                  render: (note) => note,
                },
              ],
              queryKey: ["medication_requests", patientId ?? ""],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) => {
                const response = await query(medicationRequestApi.list, {
                  pathParams: { patientId: patientId! },
                  queryParams: {
                    limit,
                    offset,
                    status:
                      "active,on_hold,draft,unknown,ended,completed,cancelled",
                  },
                })({ signal });
                return response as PaginatedResponse<MedicationRequestRead>;
              },
            },
            {
              type: t("medication_statements"),
              displayFields: [
                {
                  key: "medication",
                  label: t("medicine"),
                  render: (med) => med?.display,
                },
                {
                  key: "dosage_text",
                  label: t("dosage_instruction"),
                  render: (dosage) => dosage,
                },
                {
                  key: "status",
                  label: t("status"),
                  render: (status: string) => t(`medication_status__${status}`),
                },
                {
                  key: "created_by",
                  label: t("prescribed_by"),
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
              ],
              expandableFields: [
                {
                  key: "note",
                  label: t("notes"),
                  render: (note) => note,
                },
              ],
              queryKey: ["medication_statements", patientId ?? ""],
              queryFn: async (
                limit: number,
                offset: number,
                signal: AbortSignal,
              ) => {
                const response = await query(medicationStatementApi.list, {
                  pathParams: { patientId: patientId! },
                  queryParams: {
                    limit,
                    offset,
                    status:
                      "active,on_hold,completed,stopped,unknown,not_taken,intended",
                  },
                })({ signal });
                return response as PaginatedResponse<MedicationStatementRead>;
              },
            },
          ]}
          buttonLabel={t("medication_history")}
          onAddSelected={(selected) => {
            const converted = selected.map((record) =>
              "dosage_instruction" in record
                ? fromHistoricalMedicationRequest(record, encounterId!)
                : fromHistoricalMedicationStatement(record, encounterId!),
            );
            list.addRows(converted);
          }}
          disableAPI={!patientId}
        />
      </div>

      <StructuredList
        questionId={question.id}
        label={t("structured_type__medication_statement")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={(rowId) => setPendingRemoveRowId(rowId)}
        rowTitle={(row) => row.row.medication.display}
        rowSummary={(row) => {
          const period = row.row.effective_period;
          const periodText = period?.start
            ? `${format(new Date(period.start), "d MMM, yyyy")} - ${
                period.end
                  ? format(new Date(period.end), "d MMM, yyyy")
                  : t("ongoing")
              }`
            : undefined;
          return [t(`medication_status__${row.row.status}`), periodText]
            .filter(Boolean)
            .join(" · ");
        }}
        // A row already marked entered-in-error freezes entirely — mirrors
        // `allergyIntolerance/AllergyEditor.tsx`'s identical rule, which
        // already covers the legacy widget's own "already error at fetch
        // time freezes the row" case: `softDeleted` reflects the CURRENT
        // computed status (baseline patched by this session's edits alike),
        // so a row reaches this state either via a fresh Remove or via a
        // historical `entered_in_error` status the server already had.
        rowDisabled={(row) => row.softDeleted}
        addControl={
          <AddEntityControl<MedicationStatementRow>
            system="system-medication"
            entityType="medication"
            placeholder={addPlaceholder}
            disabled={disabled}
            searchPostFix=" clinical drug"
            createRow={(code: Code) =>
              newMedicationStatementRow(code, encounterId!)
            }
            onAdd={(row) => list.addRow(row)}
            renderStagedRow={(staged, updateStaged) => (
              <StagedMedicationFields
                row={staged}
                onUpdate={updateStaged}
                disabled={disabled}
              />
            )}
          />
        }
      />
    </div>
  );
}
