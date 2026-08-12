import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";

import query from "@/Utils/request/query";
import { cn } from "@/lib/utils";
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
  type EncounterEdit,
  type EncounterPriority,
  type EncounterRead,
  type Hospitalization,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
import { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import {
  FieldDefinitions,
  useFieldError,
  validateFields,
} from "@/types/questionnaire/validation";
import careConfig from "@careConfig";
import { useQueryParams } from "raviger";

interface EncounterQuestionProps {
  question: Question;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  organizations?: string[];
  patientId?: string;
  facilityId: string;
  errors?: QuestionValidationError[];
}

const TERMINAL_ENCOUNTER_STATUSES: EncounterStatus[] = [
  EncounterStatus.DISCHARGED,
  EncounterStatus.COMPLETED,
  EncounterStatus.CANCELLED,
  EncounterStatus.DISCONTINUED,
  EncounterStatus.ENTERED_IN_ERROR,
];

const NON_SELECTABLE_ENCOUNTER_STATUSES: EncounterStatus[] = [
  EncounterStatus.DISCHARGED,
  EncounterStatus.UNKNOWN,
  EncounterStatus.COMPLETED,
];

const OUTPATIENT_ENCOUNTER_CLASSES: EncounterClass[] = ["amb", "vr", "hh"];

function toEncounterEdit(read: EncounterRead): EncounterEdit {
  return {
    status: read.status,
    encounter_class: read.encounter_class,
    period: read.period,
    priority: read.priority,
    hospitalization: read.hospitalization,
    external_identifier: read.external_identifier,
    discharge_summary_advice: read.discharge_summary_advice,
  };
}

function resolveDischargeDisposition(
  encounter: EncounterEdit,
  server: EncounterRead | undefined,
): EncounterDischargeDisposition | undefined {
  const current = encounter.hospitalization?.discharge_disposition;
  if (current) {
    return current;
  }
  return encounter.status === EncounterStatus.DISCHARGED
    ? careConfig.defaultDischargeDisposition
    : server?.hospitalization?.discharge_disposition;
}

function resolveHospitalization(
  encounter: EncounterEdit,
  server: EncounterRead | undefined,
): Hospitalization {
  if (OUTPATIENT_ENCOUNTER_CLASSES.includes(encounter.encounter_class)) {
    return {};
  }
  return {
    ...encounter.hospitalization,
    discharge_disposition: resolveDischargeDisposition(encounter, server),
  };
}

function resolvePeriodEnd(
  encounter: EncounterEdit,
  server: EncounterRead | undefined,
): string | undefined {
  if (!TERMINAL_ENCOUNTER_STATUSES.includes(encounter.status)) {
    return undefined;
  }
  // Leaving a terminal status clears the end date, so fall back to the
  // recorded one rather than stamping "now" on the way back in.
  return (
    encounter.period.end ?? server?.period?.end ?? new Date().toISOString()
  );
}

function normalizeEncounter(
  encounter: EncounterEdit,
  server: EncounterRead | undefined,
): EncounterEdit {
  return {
    ...encounter,
    hospitalization: resolveHospitalization(encounter, server),
    period: { ...encounter.period, end: resolvePeriodEnd(encounter, server) },
  };
}

const ENCOUNTER_FIELDS: FieldDefinitions = {
  DISCHARGE_DISPOSITION: {
    key: "hospitalization.discharge_disposition",
    required: true,
  },
} as const;

export function validateEncounterQuestion(
  value: EncounterEdit | undefined,
  questionId: string,
): QuestionValidationError[] {
  const errors: QuestionValidationError[] = [];

  if (
    value?.status === EncounterStatus.DISCHARGED &&
    ["imp", "obsenc", "emer"].includes(value.encounter_class) &&
    !value?.hospitalization?.discharge_disposition
  ) {
    errors.push(...validateFields(value, questionId, ENCOUNTER_FIELDS));
  }

  return errors;
}

export function EncounterQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  encounterId,
  facilityId,
  errors = [],
}: EncounterQuestionProps) {
  // Fetch encounter data
  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(encounterApi.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId,
  });
  const { t } = useTranslation();
  const [{ toDischarge }] = useQueryParams();
  const { hasError, getError } = useFieldError(
    questionnaireResponse.question_id,
    errors,
  );

  // The questionnaire response is the single source of truth for the encounter
  // being edited; a copy in local state only ever drifts out of sync with it.
  const encounter = (
    questionnaireResponse.values[0]?.value as EncounterEdit[] | undefined
  )?.[0];

  // Seed the response from the server once per encounter. Skipped if the form
  // already has an answer (e.g. a restored draft) so it isn't clobbered on remount.
  const seededEncounterId = useRef<string>(null);
  useEffect(() => {
    if (
      !encounterData ||
      encounter ||
      seededEncounterId.current === encounterData.id
    ) {
      return;
    }
    seededEncounterId.current = encounterData.id;
    const seed = toEncounterEdit(encounterData);
    if (toDischarge === "true") {
      seed.status = EncounterStatus.DISCHARGED;
    }
    updateQuestionnaireResponseCB(
      [{ type: "encounter", value: [normalizeEncounter(seed, encounterData)] }],
      questionnaireResponse.question_id,
    );
  }, [
    encounterData,
    encounter,
    toDischarge,
    updateQuestionnaireResponseCB,
    questionnaireResponse.question_id,
  ]);

  if (isLoading || !encounter) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const handleUpdateEncounter = (updates: Partial<EncounterEdit>) => {
    clearError();
    const next = normalizeEncounter(
      { ...encounter, ...updates },
      encounterData,
    );
    updateQuestionnaireResponseCB(
      [{ type: "encounter", value: [next] }],
      questionnaireResponse.question_id,
    );
  };

  const isCurrentStatusNonSelectable =
    NON_SELECTABLE_ENCOUNTER_STATUSES.includes(encounter.status);
  const selectableEncounterStatuses = Object.values(EncounterStatus).filter(
    (encounterStatus) => {
      if (isCurrentStatusNonSelectable) {
        return encounterStatus === encounter.status;
      }
      return !NON_SELECTABLE_ENCOUNTER_STATUSES.includes(encounterStatus);
    },
  );

  return (
    <div className="space-y-6">
      <QuestionLabel question={question} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details */}
        <div className="space-y-2">
          <Label>{t("encounter_status")}</Label>
          <Select
            value={encounter.status}
            onValueChange={(value: EncounterStatus) =>
              handleUpdateEncounter({
                status: value,
              })
            }
            disabled={
              disabled || encounter.status === EncounterStatus.DISCHARGED
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_status")} />
            </SelectTrigger>
            <SelectContent>
              {selectableEncounterStatuses.map(
                (encounterStatus: EncounterStatus) => (
                  <SelectItem key={encounterStatus} value={encounterStatus}>
                    {t(`encounter_status__${encounterStatus}`)}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("encounter_class")}</Label>
          <Select
            value={encounter.encounter_class}
            onValueChange={(value: EncounterClass) =>
              handleUpdateEncounter({
                encounter_class: value,
              })
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
            value={encounter.priority}
            onValueChange={(value: EncounterPriority) =>
              handleUpdateEncounter({
                priority: value,
              })
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
            value={encounter.external_identifier || ""}
            onChange={(e) =>
              handleUpdateEncounter({ external_identifier: e.target.value })
            }
            disabled={disabled}
            placeholder={t("ip_op_obs_emr_number")}
          />
        </div>
      </div>

      {/* Mark for discharge button - Show if not already discharged */}
      {encounter.status !== EncounterStatus.DISCHARGED && (
        <div className="col-span-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t("discharge_patient")}</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() =>
                handleUpdateEncounter({ status: EncounterStatus.DISCHARGED })
              }
            >
              {t("mark_for_discharge")}
            </Button>
          </div>
        </div>
      )}

      {(encounter.status === EncounterStatus.DISCHARGED ||
        encounter.discharge_summary_advice) && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t("discharge_summary_advice")}</Label>
            <Textarea
              defaultValue={encounter.discharge_summary_advice || ""}
              onChange={(e) => {
                handleUpdateEncounter({
                  discharge_summary_advice: e.target.value || null,
                });
              }}
              disabled={disabled}
              placeholder={t("enter_discharge_summary_advice")}
            />
          </div>
        </div>
      )}

      {/* Hospitalization Details - Only show for relevant encounter classes */}
      {["imp", "obsenc", "emer"].includes(encounter.encounter_class) && (
        <div className="col-span-2 border border-gray-200 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold wrap-break-word">
            {t("hospitalization_details")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Switch
                checked={encounter.hospitalization?.re_admission || false}
                onCheckedChange={(checked: boolean) => {
                  if (!encounter.hospitalization) return;
                  handleUpdateEncounter({
                    hospitalization: {
                      ...encounter.hospitalization,
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
                value={encounter.hospitalization?.admit_source}
                onValueChange={(value: EncounterAdmitSources) => {
                  if (!encounter.hospitalization) return;
                  handleUpdateEncounter({
                    hospitalization: {
                      ...encounter.hospitalization,
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

            {/* Show discharge disposition and date when status is discharged OR has discharge disposition */}
            {(encounter.status === EncounterStatus.DISCHARGED ||
              encounter.hospitalization?.discharge_disposition) && (
              <>
                <div className="space-y-2">
                  <Label>
                    {t("discharge_disposition")}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={
                      encounter.hospitalization?.discharge_disposition ??
                      careConfig.defaultDischargeDisposition
                    }
                    onValueChange={(value: EncounterDischargeDisposition) => {
                      if (!encounter.hospitalization) return;
                      handleUpdateEncounter({
                        hospitalization: {
                          ...encounter.hospitalization,
                          discharge_disposition: value,
                        },
                      });
                    }}
                    disabled={disabled}
                  >
                    <SelectTrigger
                      className={cn(
                        hasError(ENCOUNTER_FIELDS.DISCHARGE_DISPOSITION.key) &&
                          "ring-1 ring-red-500",
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
                  {hasError(ENCOUNTER_FIELDS.DISCHARGE_DISPOSITION.key) && (
                    <p className="text-red-500 text-sm">
                      {
                        getError(ENCOUNTER_FIELDS.DISCHARGE_DISPOSITION.key)
                          ?.msg
                      }
                    </p>
                  )}
                </div>

                {encounter.status === EncounterStatus.DISCHARGED && (
                  <div className="space-y-2">
                    <Label>{t("discharge_date_time")}</Label>
                    <div className="flex gap-1 flex-wrap">
                      <DatePicker
                        date={
                          encounter.period.end
                            ? new Date(encounter.period.end)
                            : new Date()
                        }
                        onChange={(newDate) => {
                          if (!newDate) return;
                          const currentDate = encounter.period.end
                            ? new Date(encounter.period.end)
                            : new Date();
                          const updatedDate = new Date(newDate);
                          updatedDate.setHours(currentDate.getHours());
                          updatedDate.setMinutes(currentDate.getMinutes());
                          handleUpdateEncounter({
                            period: {
                              ...encounter.period,
                              end: updatedDate.toISOString(),
                            },
                          });
                        }}
                        disabled={(date) => {
                          if (!encounter.period.start) return false;
                          const startDate = new Date(encounter.period.start);
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
                          encounter.period.end
                            ? new Date(encounter.period.end).toLocaleTimeString(
                                [],
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: false,
                                },
                              )
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
                            encounter.period.end || new Date(),
                          );
                          updatedDate.setHours(hours);
                          updatedDate.setMinutes(minutes);
                          handleUpdateEncounter({
                            period: {
                              ...encounter.period,
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
                value={encounter.hospitalization?.diet_preference}
                onValueChange={(value: EncounterDietPreference) => {
                  if (!encounter.hospitalization) return;
                  handleUpdateEncounter({
                    hospitalization: {
                      ...encounter.hospitalization,
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
