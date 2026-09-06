import { ReactNode } from "react";

import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";

interface LocationFormPickerProps {
  facilityId: string;
  locationId: string;
  trigger?: ReactNode;
  disabled?: boolean;
}

export function LocationFormPicker({
  facilityId,
  locationId,
  trigger,
  disabled = false,
}: LocationFormPickerProps) {
  return (
    <ResourceFormPicker
      facilityId={facilityId}
      subjectType="location"
      subjectId={locationId}
      disabled={disabled}
      trigger={trigger}
    />
  );
}
