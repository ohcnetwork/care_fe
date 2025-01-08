import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    return <div>Loading encounter...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details */}
        <div className="space-y-2">
          <Label>Encounter Status</Label>
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
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="discharged">Discharged</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
              <SelectItem value="entered_in_error">Entered in Error</SelectItem>
              <SelectItem value="unknown">Unknown</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Encounter Class</Label>
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
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="imp">Inpatient (IP)</SelectItem>
              <SelectItem value="amb">Ambulatory (OP)</SelectItem>
              <SelectItem value="obsenc">Observation Room</SelectItem>
              <SelectItem value="emer">Emergency</SelectItem>
              <SelectItem value="vr">Virtual</SelectItem>
              <SelectItem value="hh">Home Health</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Priority</Label>
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
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASAP">ASAP</SelectItem>
              <SelectItem value="callback_results">Callback Results</SelectItem>
              <SelectItem value="callback_for_scheduling">
                Callback for Scheduling
              </SelectItem>
              <SelectItem value="elective">Elective</SelectItem>
              <SelectItem value="emergency">Emergency</SelectItem>
              <SelectItem value="preop">Pre-op</SelectItem>
              <SelectItem value="as_needed">As Needed</SelectItem>
              <SelectItem value="routine">Routine</SelectItem>
              <SelectItem value="rush_reporting">Rush Reporting</SelectItem>
              <SelectItem value="stat">Stat</SelectItem>
              <SelectItem value="timing_critical">Timing Critical</SelectItem>
              <SelectItem value="use_as_directed">Use as Directed</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Hospital Identifier</Label>
          <Input
            value={encounter.external_identifier || ""}
            onChange={(e) =>
              handleUpdateEncounter({ external_identifier: e.target.value })
            }
            disabled={disabled}
            placeholder="Ip/op/obs/emr number"
          />
        </div>
      </div>
      {/* Hospitalization Details - Only show for relevant encounter classes */}
      {(encounter.encounter_class === "imp" ||
        encounter.encounter_class === "obsenc" ||
        encounter.encounter_class === "emer") && (
        <div className="col-span-2 border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold break-words">
            Hospitalization Details
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
              <Label>Re-admission</Label>
            </div>

            <div className="space-y-2">
              <Label>Admit Source</Label>
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
                  <SelectValue placeholder="Select admit source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hosp_trans">Hospital Transfer</SelectItem>
                  <SelectItem value="emd">Emergency Department</SelectItem>
                  <SelectItem value="outp">Outpatient Department</SelectItem>
                  <SelectItem value="born">Born</SelectItem>
                  <SelectItem value="gp">General Practitioner</SelectItem>
                  <SelectItem value="mp">Medical Practitioner</SelectItem>
                  <SelectItem value="nursing">Nursing Home</SelectItem>
                  <SelectItem value="psych">Psychiatric Hospital</SelectItem>
                  <SelectItem value="rehab">Rehabilitation Facility</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Show discharge disposition only when status is completed */}
            {encounter.status === "completed" && (
              <div className="space-y-2">
                <Label>Discharge Disposition</Label>
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
                    <SelectValue placeholder="Select discharge disposition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="alt_home">Alternate Home</SelectItem>
                    <SelectItem value="other_hcf">
                      Other Healthcare Facility
                    </SelectItem>
                    <SelectItem value="hosp">Hospice</SelectItem>
                    <SelectItem value="long">Long Term Care</SelectItem>
                    <SelectItem value="aadvice">Left Against Advice</SelectItem>
                    <SelectItem value="exp">Expired</SelectItem>
                    <SelectItem value="psy">Psychiatric Hospital</SelectItem>
                    <SelectItem value="rehab">Rehabilitation</SelectItem>
                    <SelectItem value="snf">
                      Skilled Nursing Facility
                    </SelectItem>
                    <SelectItem value="oth">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Diet Preference</Label>
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
                  <SelectValue placeholder="Select diet preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="diary_free">Dairy Free</SelectItem>
                  <SelectItem value="nut_free">Nut Free</SelectItem>
                  <SelectItem value="gluten_free">Gluten Free</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="halal">Halal</SelectItem>
                  <SelectItem value="kosher">Kosher</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
