import { useQueryParams } from "raviger";
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
import { Textarea } from "@/components/ui/textarea";

import { BedSelect } from "@/components/Common/BedSelect";
import { FacilitySelect } from "@/components/Common/FacilitySelect";
import { LocationSelect } from "@/components/Common/LocationSelect";
import UserAutocomplete from "@/components/Common/UserAutocompleteFormField";
import { FacilityModel } from "@/components/Facility/models";
import { FieldLabel } from "@/components/Form/FormFields/FormField";
import PatientCategorySelect from "@/components/Patient/PatientCategorySelect";
import { UserBareMinimum } from "@/components/Users/models";

import { CONSULTATION_SUGGESTION } from "@/common/constants";

import { type Encounter, ROUTE_TO_FACILITY } from "@/types/emr/encounter";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface EncounterQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
  clearError: () => void;
}

export function EncounterQuestion({
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
}: EncounterQuestionProps) {
  const [encounter, setEncounter] = useState<Partial<Encounter>>(() => {
    return (
      (questionnaireResponse.values?.[0]?.value as Partial<Encounter>) || {
        suggestion: "A",
        admitted: false,
        transferred_from_location: undefined,
      }
    );
  });

  // Get facilityId from queryParams
  const [qParams] = useQueryParams();
  const facilityId = qParams.facilityId;

  const [bed, setBed] = useState<any>(null);
  const [referredToFacility, setReferredToFacility] =
    useState<FacilityModel | null>(null);
  const [referredFromFacility, setReferredFromFacility] =
    useState<FacilityModel | null>(null);

  const updateEncounter = (updates: Partial<Encounter>) => {
    clearError();
    const newEncounter = { ...encounter, ...updates };
    setEncounter(newEncounter);
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [
        {
          type: "encounter",
          value: newEncounter as Encounter,
        },
      ],
    });
  };

  const handleDoctorSelect = (doctor: UserBareMinimum | null) => {
    if (doctor?.id) {
      updateEncounter({
        treating_physician: doctor.id.toString(),
        treating_physician_object: doctor,
      });
    } else {
      updateEncounter({
        treating_physician: "",
        treating_physician_object: null,
      });
    }
  };

  const handleReferredToFacilityChange = (selected: FacilityModel | null) => {
    setReferredToFacility(selected);
    if (selected) {
      if (!selected.id) {
        updateEncounter({
          referred_to_external: selected.name,
          referred_to: undefined,
        });
      } else {
        updateEncounter({
          referred_to: selected.id,
          referred_to_external: undefined,
        });
      }
    }
  };

  const handleReferredFromFacilityChange = (
    selected: FacilityModel | FacilityModel[] | null,
  ) => {
    setReferredFromFacility(selected as FacilityModel | null);
    if (selected && !Array.isArray(selected)) {
      if (!selected.id) {
        updateEncounter({
          referred_from_facility_external: selected.name,
          referred_from_facility: undefined,
        });
      } else {
        updateEncounter({
          referred_from_facility: selected.id,
          referred_from_facility_external: undefined,
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">
        {question.text}
        {question.required && <span className="ml-1 text-red-500">*</span>}
      </Label>

      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Details */}

          <div className="space-y-2">
            <Label>Route to Facility</Label>
            <Select
              value={encounter.route_to_facility?.toString()}
              onValueChange={(value) =>
                updateEncounter({
                  route_to_facility: Number(
                    value,
                  ) as Encounter["route_to_facility"],
                })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select route" />
              </SelectTrigger>
              <SelectContent>
                {ROUTE_TO_FACILITY.map((route) => (
                  <SelectItem key={route} value={route.toString()}>
                    {route === 10
                      ? "Direct"
                      : route === 20
                        ? "Referred"
                        : "Transfer"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <PatientCategorySelect
              name="category"
              value={encounter.category}
              onChange={(e) => updateEncounter({ category: e.value })}
              disabled={disabled}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Decision after consultation</Label>
            <Select
              value={encounter.suggestion}
              onValueChange={(value) =>
                updateEncounter({
                  suggestion: value as Encounter["suggestion"],
                  admitted: value === "A",
                })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select decision" />
              </SelectTrigger>
              <SelectContent>
                {CONSULTATION_SUGGESTION.filter(
                  (option) => !("deprecated" in option),
                ).map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.text}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {encounter.suggestion === "R" && (
            <div id="referred_to" className="col-span-6 mb-5">
              <FieldLabel>Referred To Facility</FieldLabel>
              <FacilitySelect
                name="referred_to"
                searchAll={true}
                selected={referredToFacility}
                setSelected={handleReferredToFacilityChange}
                freeText={true}
                errors={""}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label>
              {encounter.suggestion === "A" ? "IP Number" : "OP Number"}
            </Label>
            <Input
              value={encounter.patient_no || ""}
              onChange={(e) => updateEncounter({ patient_no: e.target.value })}
              disabled={disabled}
              required={encounter.suggestion === "A"}
            />
          </div>

          {/* Death Details */}
          {encounter.suggestion === "DD" && (
            <>
              <div className="col-span-full space-y-2">
                <Label>Cause of Death</Label>
                <Textarea
                  value={encounter.discharge_notes || ""}
                  onChange={(e) =>
                    updateEncounter({ discharge_notes: e.target.value })
                  }
                  disabled={disabled}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Date & Time of Death</Label>
                <Input
                  type="datetime-local"
                  value={encounter.death_datetime || ""}
                  onChange={(e) =>
                    updateEncounter({ death_datetime: e.target.value })
                  }
                  disabled={disabled}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Death Confirmed by</Label>
                <Input
                  value={encounter.death_confirmed_doctor || ""}
                  onChange={(e) =>
                    updateEncounter({
                      death_confirmed_doctor: e.target.value,
                    })
                  }
                  disabled={disabled}
                  required
                />
              </div>
            </>
          )}

          {/* Bed Selection */}
          {encounter.suggestion === "A" && (
            <div className="col-span-full space-y-2">
              <Label>Bed</Label>
              <BedSelect
                name="bed"
                setSelected={setBed}
                selected={bed}
                error=""
                multiple={false}
                unoccupiedOnly={true}
                facility={encounter.facility}
              />
            </div>
          )}

          {/* Referral Details */}
          {(encounter.route_to_facility === 20 ||
            encounter.route_to_facility === 30) && (
            <div className="col-span-full space-y-4">
              <div className="space-y-2">
                <Label>
                  {encounter.route_to_facility === 20
                    ? "Referred From Facility"
                    : "Transferred From Facility"}
                </Label>
                <FacilitySelect
                  name="referred_from_facility"
                  searchAll={true}
                  selected={referredFromFacility}
                  setSelected={handleReferredFromFacilityChange}
                  freeText={true}
                  disabled={disabled}
                />
              </div>

              {encounter.route_to_facility === 20 && (
                <div className="space-y-2">
                  <Label>Referring Doctor</Label>
                  <Input
                    value={encounter.referred_by_external || ""}
                    onChange={(e) =>
                      updateEncounter({ referred_by_external: e.target.value })
                    }
                    disabled={disabled}
                    placeholder="Enter referring doctor's name"
                  />
                </div>
              )}

              {encounter.route_to_facility === 30 && (
                <div className="space-y-2">
                  <Label>Transferred From Location</Label>
                  <LocationSelect
                    name="transferred_from_location"
                    facilityId={facilityId}
                    setSelected={(location) =>
                      updateEncounter({
                        transferred_from_location: location ?? undefined,
                      })
                    }
                    selected={encounter.transferred_from_location ?? null}
                    showAll={false}
                    multiple={false}
                    disabled={disabled}
                  />
                </div>
              )}
            </div>
          )}

          {/* Doctor Details */}
          <div className="space-y-2">
            <Label>Treating Doctor</Label>
            <UserAutocomplete
              name="treating_physician"
              value={encounter.treating_physician_object ?? undefined}
              onChange={(e) => handleDoctorSelect(e.value)}
              userType="Doctor"
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
