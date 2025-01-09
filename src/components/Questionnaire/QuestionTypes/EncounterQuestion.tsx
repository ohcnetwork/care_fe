import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ENCOUNTER_ADMIT_SOURCE,
  ENCOUNTER_CLASS,
  ENCOUNTER_DIET_PREFERENCE,
  ENCOUNTER_DISCHARGE_DISPOSITION,
  ENCOUNTER_PRIORITY,
  ENCOUNTER_STATUS,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  type EncounterAdmitSources,
  type EncounterClass,
  type EncounterDietPreference,
  type EncounterDischargeDisposition,
  type EncounterEditRequest,
  type EncounterPriority,
  type EncounterStatus,
} from "@/types/emr/encounter";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { Switch } from "../../../components/ui/switch";

interface EncounterQuestionProps {
  question: Question;
  encounterId: string;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
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

    // Create the full encounter request object
    const encounterRequest: EncounterEditRequest = {
      ...newEncounter,
      organizations,
      patient: patientId,
    };

    // Create the response value with the encounter request
    const responseValue: ResponseValue = {
      type: "encounter",
      value: [encounterRequest] as unknown as typeof responseValue.value,
    };

    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [responseValue],
    });
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
              {Object.entries(ENCOUNTER_STATUS).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {t(key)}
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
              {Object.entries(ENCOUNTER_CLASS).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {t(key)}
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
              {Object.entries(ENCOUNTER_PRIORITY).map(([key, value]) => (
                <SelectItem key={key} value={value}>
                  {t(key)}
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
      {/* Hospitalization Details - Only show for relevant encounter classes */}
      {(encounter.encounter_class === "imp" ||
        encounter.encounter_class === "obsenc" ||
        encounter.encounter_class === "emer") && (
        <div className="col-span-2 border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold break-words">
            {t("hospitalization_details")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {Object.entries(ENCOUNTER_ADMIT_SOURCE).map(
                    ([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {t(key)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Show discharge disposition only when status is completed */}
            {encounter.status === "completed" && (
              <div className="space-y-2">
                <Label>{t("Discharge Disposition")}</Label>
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
                          encounter.hospitalization?.diet_preference || "none",
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
                    {Object.entries(ENCOUNTER_DISCHARGE_DISPOSITION).map(
                      ([key, value]) => (
                        <SelectItem key={key} value={value}>
                          {t(key)}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
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
                  {Object.entries(ENCOUNTER_DIET_PREFERENCE).map(
                    ([key, value]) => (
                      <SelectItem key={key} value={value}>
                        {t(key)}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
