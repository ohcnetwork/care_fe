import { useState } from "react";

import { LocationSelectorDialog } from "@/components/ui/sidebar/facility/location/location-switcher";

import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { LocationList } from "@/types/location/location";

import DispenseDrawer from "./DispenseDrawer";

export const DispenseButton = ({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
}) => {
  const [location, setLocation] = useState<LocationList | undefined>(undefined);
  const [showDrawer, setShowDrawer] = useState(false);
  const { selectedEncounter } = useEncounter();

  const handleLocationSelect = (selectedLocation: LocationList) => {
    setLocation(selectedLocation);
    setOpen(false);
    setShowDrawer(true);
  };

  const getLocationPath = (location: LocationList): string => {
    const path = [location.name];
    let current = location.parent;
    while (current && current.id) {
      path.unshift(current.name);
      current = current.parent;
    }
    return path.length > 1 ? path.join(" → ") : path[0] || "";
  };

  return (
    <>
      <LocationSelectorDialog
        facilityId={selectedEncounter?.facility.id || ""}
        location={location}
        setLocation={setLocation}
        open={open}
        setOpen={setOpen}
        navigateUrl={undefined}
        myLocations={true}
        onLocationSelect={handleLocationSelect}
      />

      {location && selectedEncounter && (
        <DispenseDrawer
          open={showDrawer}
          onOpenChange={(isOpen: boolean) => {
            setShowDrawer(isOpen);
            if (!isOpen) {
              setLocation(undefined);
            }
          }}
          patientId={selectedEncounter.patient.id}
          encounterId={selectedEncounter.id}
          selectedLocation={{
            id: location.id,
            name: location.name,
            path: getLocationPath(location),
          }}
        />
      )}
    </>
  );
};
