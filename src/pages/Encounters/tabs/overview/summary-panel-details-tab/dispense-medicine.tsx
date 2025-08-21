import { useState } from "react";

import { LocationSelectorDialog } from "@/components/ui/sidebar/facility/location/location-switcher";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { LocationList } from "@/types/location/location";

export const DispenseMedicineButton = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [location, setLocation] = useState<LocationList | undefined>(undefined);
  const { selectedEncounter } = useEncounter();

  const navigateUrl = (selectedLocation: LocationList) =>
    `/facility/${selectedEncounter?.facility.id}/locations/${selectedLocation.id}/medication_requests/patient/${selectedEncounter?.patient.id}/bill?encounterId=${selectedEncounter?.id}`;

  return (
    <>
      <LocationSelectorDialog
        facilityId={selectedEncounter?.facility.id || ""}
        location={location}
        setLocation={setLocation}
        open={open}
        setOpen={setOpen}
        navigateUrl={navigateUrl}
        myLocations={true}
      />
    </>
  );
};
