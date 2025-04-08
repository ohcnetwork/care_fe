import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  ENCOUNTER_ADMIT_SOURCE,
  ENCOUNTER_CLASS,
  ENCOUNTER_DIET_PREFERENCE,
  ENCOUNTER_DISCHARGE_DISPOSITION,
  ENCOUNTER_PRIORITY,
  ENCOUNTER_STATUS,
  type EncounterAdmitSources,
  type EncounterClass,
  type EncounterDietPreference,
  type EncounterDischargeDisposition,
  type EncounterEditRequest,
  type EncounterPriority,
  type EncounterStatus,
  Hospitalization,
} from "@/types/emr/encounter";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

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
}

export function EncounterQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  organizations = [],
  encounterId,
  patientId = "",
  facilityId,
}: EncounterQuestionProps) {
  // Fetch encounter data
  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: { facility: facilityId },
    }),
    enabled: !!encounterId,
  });
  const { t } = useTranslation();

  const [encounter, setEncounter] = useState<EncounterEditRequest>({
    status: "unknown" as EncounterStatus,
    encounter_class: "amb" as EncounterClass,
    period: {
      start: new Date().toISOString(),
      end: undefined,
    },
    priority: "routine" as EncounterPriority,
    external_identifier: "",
    hospitalization: {
      re_admission: false,
      admit_source: "other" as EncounterAdmitSources,
      discharge_disposition: "home" as EncounterDischargeDisposition,
      diet_preference: "none" as EncounterDietPreference,
    },
    facility: "",
    patient: "",
    organizations: [],
  });

  // Update encounter state when data is loaded
  useEffect(() => {
    if (encounterData) {
      handleUpdateEncounter(encounterData as unknown as EncounterEditRequest);
    }
  }, [encounterData]);

  useEffect(() => {
    const formStateValue = (questionnaireResponse.values[0]?.value as any)?.[0];
    if (formStateValue) {
      setEncounter(() => ({
        ...formStateValue,
      }));
    }
  }, [questionnaireResponse]);

  const handleUpdateEncounter = (
    updates: Partial<Omit<EncounterEditRequest, "organizations" | "patient">>,
  ) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    if (["amb", "vr", "hh"].includes(newEncounter.encounter_class)) {
      newEncounter.hospitalization = {} as Hospitalization;
    }

    // Create the full encounter request object
    const encounterRequest: EncounterEditRequest = {
      ...newEncounter,
      organizations,
      patient: patientId,
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details */}
        <div className="space-y-2">
          <Label>{t("encounter_status")}</Label>
          <Select
            value={encounter.status}
            onValueChange={(value) =>
              handleUpdateEncounter({
                status: value as EncounterStatus,
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_status")} />
            </SelectTrigger>
            <SelectContent>
              {ENCOUNTER_STATUS.map((encounterStatus) => (
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
            onValueChange={(value) =>
              handleUpdateEncounter({
                encounter_class: value as EncounterClass,
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("select_class")} />
            </SelectTrigger>
            <SelectContent>
              {ENCOUNTER_CLASS.map((encounterClass) => (
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
            onValueChange={(value) =>
              handleUpdateEncounter({
                priority: value as EncounterPriority,
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

      {/* Discharge Details - Show when status is discharged */}
      {encounter.status === "discharged" && (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t("discharge_summary_advice")}</Label>
            <Textarea
              value={encounter.discharge_summary_advice || ""}
              onChange={(e) =>
                handleUpdateEncounter({
                  discharge_summary_advice: e.target.value,
                })
              }
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
            {/* Only show readmission if not discharged */}
            {encounter.status !== "discharged" && (
              <div className="flex items-center space-x-2 overflow-x-auto">
                <Switch
                  checked={encounter.hospitalization?.re_admission || false}
                  onCheckedChange={(checked: boolean) =>
                    handleUpdateEncounter({
                      hospitalization: {
                        ...encounter.hospitalization,
                        re_admission: checked,
                        admit_source:
                          encounter.hospitalization?.admit_source || "other",
                        discharge_disposition:
                          encounter.hospitalization?.discharge_disposition ||
                          "home",
                        diet_preference:
                          encounter.hospitalization?.diet_preference || "none",
                      },
                    })
                  }
                  disabled={disabled}
                />
                <Label>{t("readmission")}</Label>
              </div>
            )}

            {/* Mark for discharge checkbox - Only show if not readmission */}
            {!encounter.hospitalization?.re_admission && (
              <div className="flex items-center space-x-2 overflow-x-auto">
                <Switch
                  checked={encounter.status === "discharged"}
                  onCheckedChange={(checked: boolean) => {
                    handleUpdateEncounter({
                      status: checked
                        ? "discharged"
                        : ("in_progress" as EncounterStatus),
                      hospitalization: {
                        ...encounter.hospitalization,
                        re_admission: false,
                        discharge_disposition: checked ? "home" : undefined,
                        admit_source:
                          encounter.hospitalization?.admit_source || "other",
                        diet_preference:
                          encounter.hospitalization?.diet_preference || "none",
                      },
                      // Clear discharge summary when unchecking
                      ...(checked
                        ? {}
                        : { discharge_summary_advice: undefined }),
                      // Clear discharge date when unchecking
                      period: {
                        ...encounter.period,
                        end: checked
                          ? encounter.period.end || new Date().toISOString()
                          : undefined,
                      },
                    });
                  }}
                  disabled={disabled}
                />
                <Label>{t("mark_for_discharge")}</Label>
              </div>
            )}

            <div className="space-y-2">
              <Label>{t("admit_source")}</Label>
              <Select
                value={encounter.hospitalization?.admit_source}
                onValueChange={(value) =>
                  handleUpdateEncounter({
                    hospitalization: {
                      ...encounter.hospitalization,
                      admit_source: value as EncounterAdmitSources,
                      re_admission:
                        encounter.hospitalization?.re_admission || false,
                      discharge_disposition:
                        encounter.hospitalization?.discharge_disposition ||
                        "home",
                      diet_preference:
                        encounter.hospitalization?.diet_preference || "none",
                    },
                  })
                }
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

            {/* Show discharge disposition and date when status is discharged */}
            {encounter.status === "discharged" && (
              <>
                <div className="space-y-2">
                  <Label>{t("discharge_disposition")}</Label>
                  <Select
                    value={encounter.hospitalization?.discharge_disposition}
                    onValueChange={(value) =>
                      handleUpdateEncounter({
                        hospitalization: {
                          ...encounter.hospitalization,
                          discharge_disposition:
                            value as EncounterDischargeDisposition,
                          re_admission:
                            encounter.hospitalization?.re_admission || false,
                          admit_source:
                            encounter.hospitalization?.admit_source || "other",
                          diet_preference:
                            encounter.hospitalization?.diet_preference ||
                            "none",
                        },
                      })
                    }
                    disabled={disabled}
                  >
                    <SelectTrigger>
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
                </div>

                <div className="space-y-2">
                  <Label>{t("discharge_date_time")}</Label>
                  <div className="flex sm:gap-2flex-wrap">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-sm text-left font-normal h-8",
                            !encounter.period.end && "text-gray-500",
                          )}
                        >
                          <CareIcon icon="l-calender" className="mr-2 size-4" />
                          {encounter.period.end
                            ? new Date(
                                encounter.period.end,
                              ).toLocaleDateString()
                            : t("select_date")}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            encounter.period.end
                              ? new Date(encounter.period.end)
                              : new Date()
                          }
                          onSelect={(newDate) => {
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
                          disabled={(date) =>
                            encounter.period.start
                              ? date < new Date(encounter.period.start)
                              : false
                          }
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      className="sm:w-[150px] border-t-0 sm:border-t text-sm border-gray-200 h-8"
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
              </>
            )}

            <div className="space-y-2">
              <Label>{t("diet_preference")}</Label>
              <Select
                value={encounter.hospitalization?.diet_preference}
                onValueChange={(value) =>
                  handleUpdateEncounter({
                    hospitalization: {
                      ...encounter.hospitalization,
                      diet_preference: value as EncounterDietPreference,
                      re_admission:
                        encounter.hospitalization?.re_admission || false,
                      admit_source:
                        encounter.hospitalization?.admit_source || "other",
                      discharge_disposition:
                        encounter.hospitalization?.discharge_disposition ||
                        "home",
                    },
                  })
                }
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
