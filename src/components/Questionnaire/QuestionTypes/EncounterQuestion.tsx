import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  type EncounterEdit,
  type EncounterPriority,
  type EncounterRead,
  type EncounterStatus,
} from "@/types/emr/encounter/encounter";
import encounterApi from "@/types/emr/encounter/encounterApi";
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
  encounterId,
  patientId = "",
  facilityId,
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

  const [encounter, setEncounter] = useState<EncounterEdit>({
    status: "unknown",
    encounter_class: "amb",
    period: {
      start: new Date().toISOString(),
      end: undefined,
    },
    priority: "routine",
    external_identifier: "",
    hospitalization: {
      re_admission: false,
      admit_source: "other",
      discharge_disposition: "home",
      diet_preference: "none",
    },
    facility: "",
    patient: "",
  });

  useEffect(() => {
    if (
      encounter.status === "discharged" ||
      encounter.status === "completed" ||
      encounter.status === "cancelled" ||
      encounter.status === "discontinued" ||
      encounter.status === "entered_in_error"
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
  ): Partial<Omit<EncounterEdit, "organizations" | "patient">> => {
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
      handleUpdateEncounter(transformEncounterForUpdate(encounterData));
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
    updates: Partial<Omit<EncounterEdit, "patient">>,
  ) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    if (["amb", "vr", "hh"].includes(newEncounter.encounter_class)) {
      newEncounter.hospitalization = {};
    }

    // Create the full encounter request object
    const encounterRequest: EncounterEdit = {
      ...newEncounter,
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
            onValueChange={(value: EncounterStatus) =>
              handleUpdateEncounter({
                status: value,
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
      {encounter.status !== "discharged" && (
        <div className="col-span-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">{t("discharge_patient")}</h3>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="default" size="sm" disabled={disabled}>
                  {t("mark_for_discharge")}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="w-full sm:max-w-xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("confirm_discharge")}</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2 text-left">
                    <p>{t("discharge_confirmation_message")}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t("discharge_confirmation_status_change")}</li>
                      <li>{t("discharge_confirmation_summary_required")}</li>
                      <li>{t("discharge_confirmation_date")}</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                  <AlertDialogCancel className="mt-0">
                    {t("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      handleUpdateEncounter({
                        status: "discharged",
                        period: {
                          ...encounter.period,
                          end: new Date().toISOString(),
                        },
                      });
                    }}
                  >
                    {t("proceed")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      {(encounter.status === "discharged" ||
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
            {(encounter.status === "discharged" ||
              encounter.hospitalization?.discharge_disposition) && (
              <>
                <div className="space-y-2">
                  <Label>{t("discharge_disposition")}</Label>
                  <Select
                    value={encounter.hospitalization?.discharge_disposition}
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

                {encounter.status === "discharged" && (
                  <div className="space-y-2">
                    <Label>{t("discharge_date_time")}</Label>
                    <div className="flex gap-1 flex-wrap">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex-1 justify-start text-sm text-left font-normal h-9",
                              !encounter.period.end && "text-gray-500",
                            )}
                          >
                            <CareIcon
                              icon="l-calender"
                              className="mr-2 size-4"
                            />
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
                            disabled={(date) => {
                              if (!encounter.period.start) return false;
                              const startDate = new Date(
                                encounter.period.start,
                              );
                              startDate.setHours(0, 0, 0, 0);
                              return date < startDate;
                            }}
                          />
                        </PopoverContent>
                      </Popover>
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
