import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CATEGORY_ICONS } from "@/components/Patient/allergy/list";

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
import type { Code } from "@/types/base/code/code";
import {
  ALLERGY_CATEGORY,
  ALLERGY_CLINICAL_STATUS,
  ALLERGY_CRITICALITY,
  ALLERGY_VERIFICATION_STATUS,
  type AllergyCategory,
  type AllergyClinicalStatus,
  type AllergyVerificationStatus,
} from "@/types/emr/allergyIntolerance/allergyIntolerance";
import allergyIntoleranceApi from "@/types/emr/allergyIntolerance/allergyIntoleranceApi";

import {
  ALLERGY_SOFT_DELETE,
  newAllergyRow,
  projectValues,
  toBaselineRows,
  type AllergyRow,
} from "./model";

/** Patient-scoped fetch of the first 100 allergies — the baseline is
 *  capped at `limit: 100`, not guaranteed complete. While the query is
 *  loading or errored the hook gets `undefined`, never `[]`, so a section
 *  mid-fetch is never mistaken for "the server returned zero allergies." */
function useAllergyBaseline(
  patientId: string | undefined,
): readonly BaselineRow<AllergyRow>[] | undefined {
  const { data } = useQuery({
    queryKey: ["allergies", patientId],
    queryFn: query(allergyIntoleranceApi.getAllergy, {
      pathParams: { patientId: patientId! },
      queryParams: { limit: 100 },
    }),
    enabled: !!patientId,
  });
  return useMemo(
    () => (data ? toBaselineRows(data.results) : undefined),
    [data],
  );
}

function CategorySelect({
  category,
  onValueChange,
  disabled,
  hasId,
  controlProps,
}: {
  category: AllergyCategory;
  onValueChange: (value: AllergyCategory) => void;
  disabled?: boolean;
  /** Category becomes immutable once the row is a server record. */
  hasId: boolean;
  controlProps: StructuredControlProps;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={category}
      onValueChange={onValueChange}
      disabled={disabled || hasId}
    >
      <SelectTrigger {...controlProps} className="h-9 w-full">
        <SelectValue placeholder={t("select_category")}>
          <div className="flex items-center gap-2">
            {CATEGORY_ICONS[category]}
            <span>{t(category)}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {ALLERGY_CATEGORY.map((value) => (
          <SelectItem key={value} value={value}>
            <div className="flex items-center gap-2">
              {CATEGORY_ICONS[value]}
              <span>{t(value)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CriticalitySelect({
  criticality,
  onValueChange,
  disabled,
  controlProps,
}: {
  criticality: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  controlProps: StructuredControlProps;
}) {
  const { t } = useTranslation();
  return (
    <Select
      value={criticality}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger {...controlProps} className="h-9 w-full">
        <SelectValue placeholder={t("critical")} />
      </SelectTrigger>
      <SelectContent>
        {ALLERGY_CRITICALITY.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ClinicalStatusSelect({
  status,
  onValueChange,
  disabled,
  controlProps,
}: {
  status: AllergyClinicalStatus;
  onValueChange: (value: AllergyClinicalStatus) => void;
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
        {ALLERGY_CLINICAL_STATUS.map((value) => (
          <SelectItem key={value} value={value}>
            {t(value)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Options pre-translated — `RowStatusSelect` never imports i18next.
 *  Uses the enum keys (`t(value)`), which are real locale keys;
 *  `ALLERGY_VERIFICATION_STATUS`'s display labels are untranslated
 *  English. */
function useVerificationStatusOptions() {
  const { t } = useTranslation();
  return useMemo(
    () =>
      (
        Object.keys(ALLERGY_VERIFICATION_STATUS) as AllergyVerificationStatus[]
      ).map((value) => ({ value, label: t(value) })),
    [t],
  );
}

function todayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

/**
 * Fields for the STAGED (mobile add-flow) row, shared with the desktop
 * `StructuredList` columns only in intent, not in markup — the staged form
 * has no grid to fit into and needs no `ctx.controlProps` (it isn't inside
 * `StructuredList` at all).
 */
function StagedAllergyFields({
  row,
  onUpdate,
  disabled,
}: {
  row: AllergyRow;
  onUpdate: (patch: Partial<AllergyRow>) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const verificationOptions = useVerificationStatusOptions();
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("category")}</label>
        <CategorySelect
          category={row.category}
          onValueChange={(value) => onUpdate({ category: value })}
          disabled={disabled}
          hasId={!!row.id}
          controlProps={{
            id: "staged-allergy-category",
            "aria-label": t("category"),
          }}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-gray-500">{t("criticality")}</label>
        <CriticalitySelect
          criticality={row.criticality}
          onValueChange={(value) => onUpdate({ criticality: value })}
          disabled={disabled}
          controlProps={{
            id: "staged-allergy-criticality",
            "aria-label": t("criticality"),
          }}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("status")}</label>
        <RowStatusSelect
          id="staged-allergy-status"
          aria-label={t("status")}
          value={row.verification_status}
          onValueChange={(value) => onUpdate({ verification_status: value })}
          options={verificationOptions}
          hiddenForNewRow="entered_in_error"
          isExistingRecord={!!row.id}
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("occurrence")}</label>
        <Input
          id="staged-allergy-occurrence"
          aria-label={t("occurrence")}
          type="date"
          max={todayDateString()}
          value={row.last_occurrence ?? ""}
          onChange={(e) =>
            onUpdate({ last_occurrence: e.target.value || undefined })
          }
          disabled={disabled}
        />
      </div>
      <div className="col-span-2 space-y-1">
        <label className="text-xs text-gray-500">{t("note")}</label>
        <Input
          id="staged-allergy-note"
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

export function AllergyEditor({
  question,
  disabled,
  errors,
  patientId,
  encounterId,
}: StructuredInputProps) {
  const { t } = useTranslation();
  const verificationOptions = useVerificationStatusOptions();
  const baseline = useAllergyBaseline(patientId);

  const list = useStructuredRows({
    questionId: question.id,
    baseline,
    projectValues,
    softDelete: ALLERGY_SOFT_DELETE,
    disabled,
  });

  const columns: StructuredColumn<AllergyRow>[] = useMemo(
    () => [
      {
        key: "category",
        header: t("category"),
        width: "8rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <CategorySelect
            category={row.row.category}
            onValueChange={(value) => update({ category: value })}
            disabled={cellDisabled}
            hasId={row.origin === "baseline"}
            controlProps={controlProps}
          />
        ),
      },
      {
        key: "substance",
        header: t("substance"),
        width: "minmax(10rem, 1fr)",
        // The mobile card's own title already shows this value (`rowTitle`
        // below) — mirrors `ChargeItemEditor`'s "item" column.
        mobileHidden: true,
        render: ({ row }) => (
          <span className="block truncate font-medium">
            {row.row.code.display}
          </span>
        ),
      },
      {
        key: "criticality",
        header: t("criticality"),
        width: "9rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <CriticalitySelect
            criticality={row.row.criticality}
            onValueChange={(value) => update({ criticality: value })}
            disabled={cellDisabled}
            controlProps={controlProps}
          />
        ),
      },
      {
        key: "verification_status",
        header: t("status"),
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
        key: "clinical_status",
        header: t("clinical_status"),
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
        key: "last_occurrence",
        header: t("occurrence"),
        width: "10rem",
        render: ({ row, update, disabled: cellDisabled, controlProps }) => (
          <Input
            {...controlProps}
            type="date"
            max={todayDateString()}
            value={row.row.last_occurrence ?? ""}
            onChange={(e) =>
              update({ last_occurrence: e.target.value || undefined })
            }
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

  const addPlaceholder = t("add_allergy", { count: list.rows.length + 1 });

  return (
    <div className="space-y-2">
      <StructuredDroppedRowsNotice
        droppedEdits={list.droppedEdits}
        rowLabel={(row) => row.code.display}
      />
      <StructuredList
        questionId={question.id}
        label={t("structured_type__allergy_intolerance")}
        rows={list.rows}
        columns={columns}
        errors={errors}
        disabled={disabled}
        onUpdateRow={list.updateRow}
        onRemoveRow={list.removeRow}
        rowTitle={(row) => row.row.code.display}
        rowSummary={(row) =>
          [
            t(row.row.category),
            t(row.row.criticality),
            t(row.row.verification_status),
          ].join(" · ")
        }
        // An entered-in-error row freezes entirely; an inactive/resolved
        // row only dims.
        rowDisabled={(row) => row.softDeleted}
        rowClassName={(row) =>
          row.row.clinical_status !== "active" ? "opacity-60" : undefined
        }
        // `newAllergyRow` bakes the current encounter into the row and
        // `toRequests` refuses to submit without one — with no encounter
        // in context the add control is omitted rather than creating rows
        // that could never save.
        addControl={
          encounterId ? (
            <AddEntityControl<AllergyRow>
              system="system-allergy-code"
              entityType="allergy"
              placeholder={addPlaceholder}
              disabled={disabled}
              createRow={(code: Code) => newAllergyRow(code, encounterId)}
              onAdd={(row) => list.addRow(row)}
              renderStagedRow={(staged, updateStaged) => (
                <StagedAllergyFields
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
