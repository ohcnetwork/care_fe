import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import { StructuredFieldError } from "@/components/QuestionnaireV2/structured/core/StructuredFieldError";
import { mergePatch } from "@/components/QuestionnaireV2/structured/core/rowMutations";
import { selectStructuredFieldErrors } from "@/components/QuestionnaireV2/structured/core/structuredFieldErrors";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";

import query from "@/Utils/request/query";
import {
  ENCOUNTER_ADMIT_SOURCE,
  ENCOUNTER_DIET_PREFERENCE,
  ENCOUNTER_DISCHARGE_DISPOSITION,
  ENCOUNTER_PRIORITY,
  EncounterStatus,
  type EncounterAdmitSources,
  type EncounterClass,
  type EncounterDietPreference,
  type EncounterDischargeDisposition,
  type EncounterPriority,
  type EncounterRead,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import careConfig from "@careConfig";

import {
  isHospitalizedClass,
  makeNormalizePatch,
  projectValues,
  toBaselineRows,
  toEncounterRow,
} from "./model";

/**
 * Split in two so the hook is never mounted with a partial baseline
 * (BASELINE COMPLETENESS CONTRACT — `model.ts`'s `toBaselineRows` doc
 * comment) and so `?toDischarge=true` is seedable in one move: the body's
 * very first render already has a COMPLETE server row to build the seed
 * from, since it doesn't exist until the query below resolves.
 *
 * `key={encounterId}` on `EncounterEditorBody` guarantees a remount per
 * encounter id, so the body's one-shot seed and the hook's baseline can
 * never straddle two different encounters.
 */
export function EncounterEditor(props: StructuredInputProps) {
  const { t } = useTranslation();
  const { encounterId, facilityId } = props;
  const {
    data: encounter,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId! },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId,
  });

  if (isLoading) return <FormSkeleton rows={2} />;
  if (isError || !encounter) {
    // Deliberately not "...couldn't be displayed. Reload the page": inside a
    // structured block, the dropped-row notice should be concise.
    return (
      <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        {t("encounter_load_failed")}
      </p>
    );
  }
  return (
    <EncounterEditorBody key={encounterId} {...props} encounter={encounter} />
  );
}

function EncounterEditorBody({
  question,
  disabled,
  encounterId,
  errors,
  encounter,
}: StructuredInputProps & { encounter: EncounterRead }) {
  const { t } = useTranslation();
  const [{ toDischarge }] = useQueryParams();

  const baseline = useMemo(
    () => toBaselineRows(encounter, encounterId!),
    [encounter, encounterId],
  );

  // Referentially stable: `makeNormalizePatch` returns a fresh closure per
  // call, and `useStructuredRows` memoizes on this value (an unmemoized
  // one would needlessly recompute every mutator's own `useCallback`).
  const normalizePatch = useMemo(
    () =>
      makeNormalizePatch({
        dischargeDisposition: careConfig.defaultDischargeDisposition,
      }),
    [],
  );

  /**
   * `?toDischarge=true` as an ordinary recorded `update` — visible to
   * dirty tracking, drafts, and the differ.
   *
   * Built via `mergePatch(..., normalizePatch)`, NOT a bare spread with
   * `status: DISCHARGED`: `initialEdits` bypasses the mutators
   * (`useStructuredRows` feeds entries straight to `applyEditToLog`), and
   * a bare spread would ship with `period.end` and
   * `discharge_disposition` both undefined — blocking Save and sending a
   * PUT with no discharge date on the primary discharge entry point.
   *
   * A restored draft still wins — the hook seeds only when the log is
   * empty.
   */
  const initialEdits = useMemo(
    () =>
      toDischarge === "true"
        ? [
            {
              rowId: encounterId!,
              op: "update" as const,
              patch: mergePatch(
                toEncounterRow(encounter),
                { status: EncounterStatus.DISCHARGED },
                normalizePatch,
              ),
            },
          ]
        : undefined,
    [toDischarge, encounter, encounterId, normalizePatch],
  );

  // No explicit type argument — `TRow` infers from `projectValues`, `Mode`
  // from the `mode: "single"` literal below. Naming `TRow` explicitly here
  // (`useStructuredRows<EncounterRow>({...})`) suppresses inference for
  // `Mode`, which silently falls back to `"list"` and narrows the return
  // to `ListRowsController` — no `row`/`setRow` at all.
  const single = useStructuredRows({
    questionId: question.id,
    mode: "single",
    baseline,
    projectValues,
    normalizePatch,
    initialEdits,
    disabled,
  });

  const row = single.row?.row;
  if (!row) return null;
  const setRow = single.setRow;

  // Computed once and reused for the ring, `aria-describedby` AND the
  // rendered message below, so the three can never disagree with each
  // other (mirrors `AppointmentEditor.tsx`'s `slotError`).
  const hasDispositionError =
    selectStructuredFieldErrors(errors, {
      questionId: question.id,
      // No rowId and no rowIndex: `hospitalization.discharge_disposition`
      // belongs to the singleton SECTION, not to a row — matcher rule 3.
      // Encounter is the only type in this wave that exercises that
      // branch.
      fieldKeys: ["hospitalization.discharge_disposition"],
    }).length > 0;
  const dispositionErrorId = `${question.id}--discharge-disposition--error`;

  // The one authority for "does this class carry a hospitalization
  // record" — never re-fork the `["imp","obsenc","emer"]` literal here.
  const hospitalized = isHospitalizedClass(row.encounter_class);
  // Gates the discharge-disposition/date pair. Whenever
  // `requiresDischargeDisposition` can fire (`row.status ===
  // DISCHARGED`), this is already true, so the bound error is never
  // hidden inside a collapsed subtree.
  const showDischargeFields =
    row.status === EncounterStatus.DISCHARGED ||
    !!row.hospitalization?.discharge_disposition;

  return (
    <div className="space-y-6">
      <StructuredDroppedRowsNotice
        droppedEdits={single.droppedEdits}
        rowLabel={() => t("structured_type__encounter")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>{t("encounter_status")}</Label>
          <Select
            value={row.status}
            onValueChange={(value: EncounterStatus) =>
              setRow({ status: value })
            }
            disabled={disabled || row.status === EncounterStatus.DISCHARGED}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_status")} />
            </SelectTrigger>
            <SelectContent>
              {Object.values(EncounterStatus)
                .filter((status) =>
                  row.status === EncounterStatus.DISCHARGED
                    ? status === EncounterStatus.DISCHARGED
                    : status !== EncounterStatus.DISCHARGED &&
                      status !== EncounterStatus.UNKNOWN,
                )
                .map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(`encounter_status__${status}`)}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("encounter_class")}</Label>
          <Select
            value={row.encounter_class}
            onValueChange={(value: EncounterClass) =>
              setRow({ encounter_class: value })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_class")} />
            </SelectTrigger>
            <SelectContent>
              {careConfig.encounterClasses.map((encounterClass) => (
                <SelectItem key={encounterClass} value={encounterClass}>
                  {t(`encounter_class__${encounterClass}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("priority")}</Label>
          <Select
            value={row.priority}
            onValueChange={(value: EncounterPriority) =>
              setRow({ priority: value })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_priority")} />
            </SelectTrigger>
            <SelectContent>
              {ENCOUNTER_PRIORITY.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {t(`encounter_priority__${priority}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("hospital_identifier")}</Label>
          <Input
            value={row.external_identifier || ""}
            onChange={(e) => setRow({ external_identifier: e.target.value })}
            disabled={disabled}
            placeholder={t("ip_op_obs_emr_number")}
          />
        </div>
      </div>

      {row.status !== EncounterStatus.DISCHARGED && (
        <div className="col-span-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t("discharge_patient")}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => setRow({ status: EncounterStatus.DISCHARGED })}
            >
              {t("mark_for_discharge")}
            </Button>
          </div>
        </div>
      )}

      {(row.status === EncounterStatus.DISCHARGED ||
        row.discharge_summary_advice) && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t("discharge_summary_advice")}</Label>
            <Textarea
              defaultValue={row.discharge_summary_advice || ""}
              onChange={(e) => {
                setRow({
                  discharge_summary_advice: e.target.value || null,
                });
              }}
              disabled={disabled}
              placeholder={t("enter_discharge_summary_advice")}
            />
          </div>
        </div>
      )}

      {hospitalized && (
        <div className="col-span-2 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold break-words">
            {t("hospitalization_details")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Switch
                checked={row.hospitalization?.re_admission || false}
                onCheckedChange={(checked: boolean) => {
                  if (!row.hospitalization) return;
                  setRow({
                    hospitalization: {
                      ...row.hospitalization,
                      re_admission: checked,
                    },
                  });
                }}
                disabled={disabled}
              />
              <Label>{t("readmission")}</Label>
            </div>

            <div className="space-y-2">
              <Label>{t("admit_source")}</Label>
              <Select
                value={row.hospitalization?.admit_source}
                onValueChange={(value: EncounterAdmitSources) => {
                  if (!row.hospitalization) return;
                  setRow({
                    hospitalization: {
                      ...row.hospitalization,
                      admit_source: value,
                    },
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_admit_source")} />
                </SelectTrigger>
                <SelectContent>
                  {ENCOUNTER_ADMIT_SOURCE.map((admitSource) => (
                    <SelectItem key={admitSource} value={admitSource}>
                      {t(`encounter_admit_sources__${admitSource}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {showDischargeFields && (
              <>
                <div className="space-y-2">
                  <Label>
                    {t("discharge_disposition")}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={
                      row.hospitalization?.discharge_disposition ??
                      careConfig.defaultDischargeDisposition
                    }
                    onValueChange={(value: EncounterDischargeDisposition) => {
                      if (!row.hospitalization) return;
                      setRow({
                        hospitalization: {
                          ...row.hospitalization,
                          discharge_disposition: value,
                        },
                      });
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      aria-invalid={hasDispositionError || undefined}
                      aria-describedby={dispositionErrorId}
                      className={cn(
                        hasDispositionError && "ring-1 ring-red-500",
                      )}
                    >
                      <SelectValue
                        placeholder={t("select_discharge_disposition")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {ENCOUNTER_DISCHARGE_DISPOSITION.map((disposition) => (
                        <SelectItem key={disposition} value={disposition}>
                          {t(`encounter_discharge_disposition__${disposition}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <StructuredFieldError
                    id={dispositionErrorId}
                    questionId={question.id}
                    fieldKeys={["hospitalization.discharge_disposition"]}
                    errors={errors}
                  />
                </div>

                {row.status === EncounterStatus.DISCHARGED && (
                  <div className="space-y-2">
                    <Label>{t("discharge_date_time")}</Label>
                    <div className="flex gap-1 flex-wrap">
                      <DatePicker
                        date={
                          row.period.end ? new Date(row.period.end) : new Date()
                        }
                        onChange={(newDate) => {
                          if (!newDate) return;
                          const currentDate = row.period.end
                            ? new Date(row.period.end)
                            : new Date();
                          const updatedDate = new Date(newDate);
                          updatedDate.setHours(currentDate.getHours());
                          updatedDate.setMinutes(currentDate.getMinutes());
                          setRow({
                            period: {
                              ...row.period,
                              end: updatedDate.toISOString(),
                            },
                          });
                        }}
                        disabled={(date) => {
                          if (!row.period.start) return false;
                          const startDate = new Date(row.period.start);
                          startDate.setHours(0, 0, 0, 0);
                          return date < startDate;
                        }}
                        dateFormat="d/M/yyyy"
                        className="flex-1"
                      />
                      <Input
                        type="time"
                        className="flex-1 border-t-0 sm:border-t text-sm border-gray-200 h-9"
                        value={
                          row.period.end
                            ? new Date(row.period.end).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                            : new Date().toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                                hour12: false,
                              })
                        }
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value
                            .split(":")
                            .map(Number);
                          if (isNaN(hours) || isNaN(minutes)) return;
                          const updatedDate = new Date(
                            row.period.end || new Date(),
                          );
                          updatedDate.setHours(hours);
                          updatedDate.setMinutes(minutes);
                          setRow({
                            period: {
                              ...row.period,
                              end: updatedDate.toISOString(),
                            },
                          });
                        }}
                        disabled={disabled}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="space-y-2">
              <Label>{t("diet_preference")}</Label>
              <Select
                value={row.hospitalization?.diet_preference}
                onValueChange={(value: EncounterDietPreference) => {
                  if (!row.hospitalization) return;
                  setRow({
                    hospitalization: {
                      ...row.hospitalization,
                      diet_preference: value,
                    },
                  });
                }}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_diet_preference")} />
                </SelectTrigger>
                <SelectContent>
                  {ENCOUNTER_DIET_PREFERENCE.map((dietPreference) => (
                    <SelectItem key={dietPreference} value={dietPreference}>
                      {t(`encounter_diet_preference__${dietPreference}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
