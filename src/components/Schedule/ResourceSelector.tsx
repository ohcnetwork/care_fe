import { LocationSearch } from "@/components/Location/LocationSearch";
import { PractitionerSelector } from "@/pages/Appointments/components/PractitionerSelector";
import { HealthcareServiceSelector } from "@/pages/Facility/services/HealthcareServiceSelector";
import { HealthcareServiceReadSpec } from "@/types/healthcareService/healthcareService";
import { LocationList } from "@/types/location/location";
import { SchedulableResourceType } from "@/types/scheduling/schedule";
import { UserReadMinimal } from "@/types/user/user";

interface ResourceSelectorProps {
  selectedResourceType: SchedulableResourceType;
  facilityId: string;
  selectedUser: UserReadMinimal | null;
  selectedLocation: LocationList | null;
  selectedService: HealthcareServiceReadSpec | null;
  setSelectedUser: (user: UserReadMinimal | null) => void;
  setSelectedLocation: (location: LocationList | null) => void;
  setSelectedService: (service: HealthcareServiceReadSpec | null) => void;
  onChange: (resourceId: string) => void;
}
export const ResourceSelector = ({
  selectedResourceType,
  facilityId,
  selectedUser,
  selectedLocation,
  selectedService,
  setSelectedUser,
  setSelectedLocation,
  setSelectedService,
  onChange,
}: ResourceSelectorProps) => {
  return (
    <>
      {selectedResourceType === SchedulableResourceType.Practitioner && (
        <PractitionerSelector
          facilityId={facilityId}
          selected={selectedUser}
          onSelect={(user) => {
            setSelectedUser(user);
            onChange(user?.id || "");
          }}
        />
      )}

      {selectedResourceType === SchedulableResourceType.Location && (
        <LocationSearch
          facilityId={facilityId}
          onSelect={(location) => {
            setSelectedLocation(location);
            onChange(location.id);
          }}
          value={selectedLocation}
        />
      )}

      {selectedResourceType === SchedulableResourceType.HealthcareService && (
        <HealthcareServiceSelector
          facilityId={facilityId}
          selected={selectedService}
          onSelect={(service) => {
            setSelectedService(service);
            onChange(service?.id || "");
          }}
        />
      )}
    </>
  );
};
