import { useState } from "react";

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
  type EncounterClass,
  type EncounterPriority,
  type EncounterRequest,
  type EncounterStatus,
  type Hospitalization,
} from "@/types/emr/encounter";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface EncounterQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
  clearError: () => void;
  organizations?: string[];
  patientId?: string;
}

export function EncounterQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  organizations = [],
  patientId = "",
}: EncounterQuestionProps) {
  const [encounter, setEncounter] = useState<
    Omit<EncounterRequest, "organizations" | "patient">
  >(() => {
    const existingValue =
      (questionnaireResponse.values?.[0]
        ?.value as unknown as EncounterRequest) || null;
    return {
      status: existingValue?.status || "in_progress",
      encounter_class: existingValue?.encounter_class || "amb",
      period: existingValue?.period || {
        start: new Date().toISOString(),
      },
      priority: existingValue?.priority || "routine",
      external_identifier: existingValue?.external_identifier || "",
      hospitalization: existingValue?.hospitalization,
      facility: existingValue?.facility,
    };
  });

  const updateEncounter = (
    updates: Partial<Omit<EncounterRequest, "organizations" | "patient">>,
  ) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    setEncounter(newEncounter);

    // Create the full encounter request object
    const encounterRequest: EncounterRequest = {
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Basic Details */}
      <div className="space-y-2">
        <Label>Encounter Status</Label>
        <Select
          value={encounter.status}
          onValueChange={(value) =>
            updateEncounter({
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
            updateEncounter({
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
            <SelectItem value="obsenc">Observation Room </SelectItem>
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
            updateEncounter({
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
      {encounter.encounter_class === "imp" && (
        <div className="space-y-2">
          <Label>Hospitalization Details</Label>
          <Select
            value={encounter.hospitalization?.admit_source}
            onValueChange={(value) =>
              updateEncounter({
                hospitalization: {
                  ...encounter.hospitalization,
                  admit_source: value as Hospitalization["admit_source"],
                  re_admission: false,
                  discharge_disposition: "home",
                  diet_preference: "none",
                },
              })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select admission source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hosp_trans">Hospital Transfer</SelectItem>
              <SelectItem value="emd">Emergency Department</SelectItem>
              <SelectItem value="outp">Outpatient</SelectItem>
              <SelectItem value="born">Born</SelectItem>
              <SelectItem value="gp">General Practitioner</SelectItem>
              <SelectItem value="mp">Medical Practitioner</SelectItem>
              <SelectItem value="nursing">Nursing</SelectItem>
              <SelectItem value="psych">Psychiatric Hospital</SelectItem>
              <SelectItem value="rehab">Rehabilitation Hospital</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="space-y-2">
        <Label>External Identifier</Label>
        <Input
          value={encounter.external_identifier || ""}
          onChange={(e) =>
            updateEncounter({ external_identifier: e.target.value })
          }
          disabled={disabled}
          placeholder="Enter external identifier"
        />
      </div>
    </div>
  );
}
