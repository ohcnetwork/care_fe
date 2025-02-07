import { format } from "date-fns";
import React, { useState } from "react";

import { Input } from "@/components/ui/input";

import { LocationSearch } from "@/components/Location/LocationSearch";

import { LocationAssociationQuestion } from "@/types/location/association";
import { LocationList } from "@/types/location/location";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

interface LocationQuestionProps {
  question: Question;
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  facilityId: string;
  locationId: string;
  encounterId: string;
}

export function LocationQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  facilityId,
  encounterId,
}: LocationQuestionProps) {
  const [selectedLocation, setSelectedLocation] = useState<LocationList | null>(
    null,
  );

  const values =
    (questionnaireResponse.values?.[0]
      ?.value as unknown as LocationAssociationQuestion[]) || [];

  const association = values[0] ?? {};

  const handleUpdateAssociation = (
    updates: Partial<LocationAssociationQuestion>,
  ) => {
    const newAssociation: LocationAssociationQuestion = {
      id: association?.id || null,
      encounter: encounterId,
      start_datetime: association?.start_datetime || new Date().toISOString(),
      end_datetime: null,
      status: "active",
      location: association?.location || "",
      meta: {},
      created_by: null,
      updated_by: null,
      ...updates,
    };

    updateQuestionnaireResponseCB(
      [{ type: "location_association", value: [newAssociation] }],
      questionnaireResponse.question_id,
    );
  };

  const handleLocationSelect = (location: LocationList) => {
    setSelectedLocation(location);
    handleUpdateAssociation({ location: location.id });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-4">
        <div>
          <label className="text-sm font-medium mb-1 block">
            Select Location
          </label>
          <LocationSearch
            mode="kind"
            facilityId={facilityId}
            onSelect={handleLocationSelect}
            disabled={disabled}
            value={selectedLocation}
          />
        </div>

        {selectedLocation && (
          <div>
            <label className="text-sm font-medium mb-1 block">Start Time</label>
            <Input
              type="datetime-local"
              value={
                association?.start_datetime
                  ? format(
                      new Date(association.start_datetime),
                      "yyyy-MM-dd'T'HH:mm",
                    )
                  : format(new Date(), "yyyy-MM-dd'T'HH:mm")
              }
              onChange={(e) =>
                handleUpdateAssociation({
                  start_datetime: new Date(e.target.value).toISOString(),
                })
              }
              disabled={disabled}
              className="h-9"
            />
          </div>
        )}
      </div>
    </div>
  );
}
