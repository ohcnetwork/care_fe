import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
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

  const [encounter, setEncounter] = useState<EncounterEdit>({
    status: EncounterStatus.UNKNOWN,
    encounter_class: careConfig.defaultEncounterType,
    period: {
      start: new Date().toISOString(),
      end: undefined,
    },
    priority: "routine",
    external_identifier: "",
    hospitalization: {
      re_admission: false,
      admit_source: "other",
      discharge_disposition: careConfig.defaultDischargeDisposition,
      diet_preference: "none",
    },
    discharge_summary_advice: null,
  });

  useEffect(() => {
    if (
      encounter.status === EncounterStatus.DISCHARGED ||
      encounter.status === EncounterStatus.COMPLETED ||
      encounter.status === EncounterStatus.CANCELLED ||
      encounter.status === EncounterStatus.DISCONTINUED ||
      encounter.status === EncounterStatus.ENTERED_IN_ERROR
    ) {
      if (!encounter.period.end) {
        handleUpdateEncounter({
          period: {
            ...encounter.period,
            end: new Date().toISOString(),
          },
        });
      }
    } else {
      handleUpdateEncounter({
        period: {
          ...encounter.period,
          end: undefined,
        },
      });
    }
  }, [encounter.status]);

  // Transform EncounterRead to EncounterEdit format
  const transformEncounterForUpdate = (
    read: EncounterRead,
  ): Partial<EncounterEdit> => {
    return {
      status: read.status,
      encounter_class: read.encounter_class,
      period: read.period,
      priority: read.priority,
      hospitalization: read.hospitalization,
      external_identifier: read.external_identifier,
      discharge_summary_advice: read.discharge_summary_advice,
    };
  };

  // Update encounter state when data is loaded
  useEffect(() => {
    if (encounterData) {
      const updates = transformEncounterForUpdate(encounterData);
      if (toDischarge === "true") {
        updates.status = EncounterStatus.DISCHARGED;
      }
      handleUpdateEncounter(updates);
    }
  }, [encounterData]);

  useEffect(() => {
    const formStateValue = (
      questionnaireResponse.values[0]?.value as EncounterEdit[]
    )?.[0];
    if (formStateValue) {
      setEncounter(() => ({
        ...formStateValue,
      }));
    }
  }, [questionnaireResponse]);

  const handleUpdateEncounter = (updates: Partial<EncounterEdit>) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    if (["amb", "vr", "hh"].includes(newEncounter.encounter_class)) {
      newEncounter.hospitalization = {};
    }

    if (
      ["imp", "obsenc", "emer"].includes(encounter.encounter_class) &&
      newEncounter.status === EncounterStatus.DISCHARGED
    ) {
      newEncounter.hospitalization = {
        ...newEncounter.hospitalization,
        discharge_disposition:
          newEncounter.hospitalization?.discharge_disposition ??
          careConfig.defaultDischargeDisposition,
      };
    } else if ("hospitalization" in newEncounter) {
      newEncounter.hospitalization = {
        ...newEncounter.hospitalization,
        discharge_disposition:
          encounterData?.hospitalization?.discharge_disposition,
      };
    }

    // Create the full encounter request object
    const encounterRequest: EncounterEdit = {
      ...newEncounter,
    };

    // Create the response value with the encounter request
    const responseValue: ResponseValue = {
      type: "encounter",
      value: [encounterRequest],
    };

    updateQuestionnaireResponseCB(
      [responseValue],
      questionnaireResponse.question_id,
    );
  };

  if (isLoading) {
    return <div>{t("loading_encounter")}</div>;
  }

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
              {Object.values(EncounterStatus)
                .filter((encounterStatus: EncounterStatus) =>
                  encounter.status === EncounterStatus.DISCHARGED
                    ? encounterStatus === EncounterStatus.DISCHARGED
                    : encounterStatus !== EncounterStatus.DISCHARGED &&
                      encounterStatus !== EncounterStatus.UNKNOWN,
                )
                .map((encounterStatus: EncounterStatus) => (
                  <SelectItem key={encounterStatus} value={encounterStatus}>
                    {t(`encounter_status__${encounterStatus}`)}
                  </SelectItem>
                ))}
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
          <h3 className="text-lg font-semibold break-words">
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
