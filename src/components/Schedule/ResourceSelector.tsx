import { LocationSearch } from "@/components/Location/LocationSearch";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { HealthcareServiceSelector } from "@/pages/Facility/services/HealthcareServiceSelector";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

export type ScheduleResourceFormState =
  | {
      resource: UserReadMinimal | null;
      resource_type: SchedulableResourceType.Practitioner;
    }
  | {
      resource: LocationList | null;
      resource_type: SchedulableResourceType.Location;
    }
  | {
      resource: HealthcareServiceReadSpec | null;
      resource_type: SchedulableResourceType.HealthcareService;
    };

interface ResourceSelectorProps {
  facilityId: string;
  selectedResource: ScheduleResourceFormState;
  setSelectedResource: (resource: ScheduleResourceFormState) => void;
}
export const ResourceSelector = ({
  facilityId,
  selectedResource,
  setSelectedResource,
}: ResourceSelectorProps) => {
  switch (selectedResource.resource_type) {
    case SchedulableResourceType.Practitioner:
      return (
        <PractitionerSelector
          facilityId={facilityId}
          selected={selectedResource.resource}
          onSelect={(user) => {
            setSelectedResource({
              resource: user,
              resource_type: selectedResource.resource_type,
            });
          }}
        />
      );

    case SchedulableResourceType.Location:
      return (
        <LocationSearch
          facilityId={facilityId}
          onSelect={(location) => {
            setSelectedResource({
              resource: location,
              resource_type: selectedResource.resource_type,
            });
          }}
          value={selectedResource.resource}
        />
      );

    case SchedulableResourceType.HealthcareService:
      return (
        <HealthcareServiceSelector
          facilityId={facilityId}
          selected={selectedResource.resource}
          onSelect={(service) => {
            setSelectedResource({
              resource: service,
              resource_type: selectedResource.resource_type,
            });
          }}
        />
      );

    default:
      return null;
  }
};
