import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Select from "@/components/ui/select-util";

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

  const [encounter, setEncounter] = useState<EncounterEditRequest>(() => {
    if (!encounterData) {
      return {
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
      };
    }
    return {
      status: encounterData.status,
      encounter_class: encounterData.encounter_class,
      period: encounterData.period,
      priority: encounterData.priority,
      external_identifier: encounterData.external_identifier || "",
      hospitalization: encounterData.hospitalization,
      facility: encounterData.facility.id,
      patient: encounterData.patient.id,
      organizations: [],
    };
  });

  // Update encounter state when data is loaded
  useEffect(() => {
    if (encounterData) {
      setEncounter({
        status: encounterData.status,
        encounter_class: encounterData.encounter_class,
        period: encounterData.period,
        priority: encounterData.priority,
        external_identifier: encounterData.external_identifier || "",
        hospitalization: encounterData.hospitalization,
        facility: encounterData.facility.id,
        patient: encounterData.patient.id,
        organizations: [],
      });
    }
  }, [encounterData]);

  const handleUpdateEncounter = (
    updates: Partial<Omit<EncounterEditRequest, "organizations" | "patient">>,
  ) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    setEncounter(newEncounter);

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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Details */}
      <div className="space-y-2">
        <Label>Encounter Status</Label>
        <Select
          value={encounter.status}
          onChange={(value) =>
            handleUpdateEncounter({
              status: value as EncounterStatus,
            })
          }
          disabled={disabled}
          options={[
            { value: "planned", label: "Planned" },
            { value: "in_progress", label: "In Progress" },
            { value: "on_hold", label: "On Hold" },
            { value: "discharged", label: "Discharged" },
            { value: "completed", label: "Completed" },
            { value: "cancelled", label: "Cancelled" },
            { value: "discontinued", label: "Discontinued" },
            { value: "entered_in_error", label: "Entered in Error" },
            { value: "unknown", label: "Unknown" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Encounter Class</Label>
        <Select
          value={encounter.encounter_class}
          onChange={(value) =>
            handleUpdateEncounter({
              encounter_class: value as EncounterClass,
            })
          }
          disabled={disabled}
          options={[
            { value: "imp", label: "Inpatient (IP)" },
            { value: "amb", label: "Ambulatory (OP)" },
            { value: "obsenc", label: "Observation Room" },
            { value: "emer", label: "Emergency" },
            { value: "vr", label: "Virtual" },
            { value: "hh", label: "Home Health" },
          ]}
        />
      </div>

      <div className="space-y-2">
        <Label>Priority</Label>
        <Select
          value={encounter.priority}
          onChange={(value) =>
            handleUpdateEncounter({
              priority: value as EncounterPriority,
            })
          }
          disabled={disabled}
          options={[
            { value: "ASAP", label: "ASAP" },
            { value: "callback_results", label: "Callback Results" },
            {
              value: "callback_for_scheduling",
              label: "Callback for Scheduling",
            },
            { value: "elective", label: "Elective" },
            { value: "emergency", label: "Emergency" },
            { value: "preop", label: "Pre-op" },
            { value: "as_needed", label: "As Needed" },
            { value: "routine", label: "Routine" },
            { value: "rush_reporting", label: "Rush Reporting" },
            { value: "stat", label: "Stat" },
            { value: "timing_critical", label: "Timing Critical" },
            { value: "use_as_directed", label: "Use as Directed" },
            { value: "urgent", label: "Urgent" },
          ]}
        />
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

      {/* Hospitalization Details - Only show for relevant encounter classes */}
      {(encounter.encounter_class === "imp" ||
        encounter.encounter_class === "obsenc" ||
        encounter.encounter_class === "emer") && (
        <div className="col-span-2 border rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold">Hospitalization Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
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
                value={encounter.hospitalization?.admit_source || "other"}
                onChange={(value) =>
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
                options={[
                  { value: "hosp_trans", label: "Hospital Transfer" },
                  { value: "emd", label: "Emergency Department" },
                  { value: "outp", label: "Outpatient Department" },
                  { value: "born", label: "Born" },
                  { value: "gp", label: "General Practitioner" },
                  { value: "mp", label: "Medical Practitioner" },
                  { value: "nursing", label: "Nursing Home" },
                  { value: "psych", label: "Psychiatric Hospital" },
                  { value: "rehab", label: "Rehabilitation Facility" },
                  { value: "other", label: "Other" },
                ]}
                placeholder="Select admit source"
              />
            </div>

            {/* Show discharge disposition only when status is completed */}
            {encounter.status === "completed" && (
              <div className="space-y-2">
                <Label>Discharge Disposition</Label>
                <Select
                  value={
                    encounter.hospitalization?.discharge_disposition || "oth"
                  }
                  onChange={(value) =>
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
                  options={[
                    { value: "home", label: "Home" },
                    { value: "alt_home", label: "Alternate Home" },
                    { value: "other_hcf", label: "Other Healthcare Facility" },
                    { value: "hosp", label: "Hospice" },
                    { value: "long", label: "Long Term Care" },
                    { value: "aadvice", label: "Left Against Advice" },
                    { value: "exp", label: "Expired" },
                    { value: "psy", label: "Psychiatric Hospital" },
                    { value: "rehab", label: "Rehabilitation" },
                    { value: "snf", label: "Skilled Nursing Facility" },
                    { value: "oth", label: "Other" },
                  ]}
                  placeholder="Select discharge disposition"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Diet Preference</Label>
              <Select
                value={encounter.hospitalization?.diet_preference || "none"}
                onChange={(value) =>
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
                options={[
                  { value: "vegetarian", label: "Vegetarian" },
                  { value: "diary_free", label: "Dairy Free" },
                  { value: "nut_free", label: "Nut Free" },
                  { value: "gluten_free", label: "Gluten Free" },
                  { value: "vegan", label: "Vegan" },
                  { value: "halal", label: "Halal" },
                  { value: "kosher", label: "Kosher" },
                  { value: "none", label: "None" },
                ]}
                placeholder="Select diet preference"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
