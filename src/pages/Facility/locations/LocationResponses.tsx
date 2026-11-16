import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { ResourceResponses } from "@/components/Questionnaire/ResourceResponses/ResourceResponses";

import query from "@/Utils/request/query";
import locationApi from "@/types/location/locationApi";

import { LocationFormPicker } from "./components/LocationFormPicker";
import LocationPage from "./components/LocationPage";

interface LocationResponsesProps {
  facilityId: string;
  locationId: string;
}

export default function LocationResponses({
  facilityId,
  locationId,
}: LocationResponsesProps) {
  const { t } = useTranslation();
  const locationQuery = useQuery({
    queryKey: ["location", facilityId, locationId],
    queryFn: query(locationApi.get, {
      pathParams: { facility_id: facilityId, id: locationId },
    }),
  });

  return (
    <LocationPage
      title={t("responses")}
      actions={
        <LocationFormPicker
          facilityId={facilityId}
          locationId={locationId}
          disabled={!locationQuery.data || locationQuery.isError}
        />
      }
    >
      <ResourceResponses
        facilityId={facilityId}
        subjectType="location"
        subjectId={locationId}
        contextHref={`/facility/${facilityId}/locations/${locationId}/overview`}
      />
    </LocationPage>
  );
}
