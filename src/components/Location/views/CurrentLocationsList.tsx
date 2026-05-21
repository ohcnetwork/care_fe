import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";

import { LocationActionButtons } from "@/components/Location/LocationActionButtons";
import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { EditingState } from "@/components/Location/utils/locationHelpers";
import { useTranslation } from "react-i18next";

interface CurrentLocationsListProps {
  currentLocation?: LocationAssociationRead;
  plannedLocations: LocationAssociationRead[];
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  isPending: boolean;
  showMoveButton: boolean;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  onMove: () => void;
  onAddBed?: () => void;
  onComplete: (location: LocationAssociationRead) => void;
  onUpdateTime: (location: LocationAssociationRead) => void;
  onCancelBed: (
    status: "active" | "planned",
    location: LocationAssociationRead,
  ) => void;
  onAssignNowPlanned: (location: LocationAssociationRead) => void;
  onAssignNowReserved: (location: LocationAssociationRead) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (location: LocationAssociationRead) => void;
  linkedLocations?: LocationAssociationRead[];
}

export function CurrentLocationsList({
  currentLocation,
  plannedLocations,
  editingState,
  setEditingState,
  isPending,
  showMoveButton,
  keepBedActive,
  onKeepBedActiveChange,
  onMove,
  onAddBed,
  onComplete,
  onUpdateTime,
  onCancelBed,
  onAssignNowPlanned,
  onAssignNowReserved,
  onCancelEdit,
  onConfirmEdit,
  linkedLocations,
}: CurrentLocationsListProps) {
  const { t } = useTranslation();
  const renderLocationCard = (
    locationHistory: LocationAssociationRead,
    status: LocationAssociationStatus,
  ) => (
    <LocationCardWrapper
      key={locationHistory.id}
      locationHistory={locationHistory}
      status={status}
      editingState={editingState}
      setEditingState={setEditingState}
      handleCancelEdit={onCancelEdit}
      handleConfirmEdit={onConfirmEdit}
      isPending={isPending}
      keepBedActive={status === "active" ? keepBedActive : undefined}
      onKeepBedActiveChange={
        status === "active" ? onKeepBedActiveChange : undefined
      }
      onComplete={status === "active" ? onComplete : undefined}
    >
      {showMoveButton && (
        <div className="flex justify-end gap-2">
          <LocationActionButtons
            status={status}
            location={locationHistory}
            onMove={onMove}
            onAddBed={onAddBed}
            onComplete={
              status === "active" || status === "reserved"
                ? onComplete
                : undefined
            }
            onUpdateTime={onUpdateTime}
            onCancelBed={() =>
              onCancelBed(status as "planned" | "active", locationHistory)
            }
            onAssignNow={
              status === "reserved"
                ? () => onAssignNowReserved(locationHistory)
                : status === "planned"
                  ? () => onAssignNowPlanned(locationHistory)
                  : undefined
            }
          />
        </div>
      )}
    </LocationCardWrapper>
  );

  return (
    <>
      {currentLocation && renderLocationCard(currentLocation, "active")}
      {linkedLocations && linkedLocations.length > 0 && (
        <>
          <h3 className="text-base font-semibold">{t("linked_locations")}</h3>
          {linkedLocations.map((location) =>
            renderLocationCard(location, location.status),
          )}
        </>
      )}
      {plannedLocations.map((location) =>
        renderLocationCard(location, "planned"),
      )}
    </>
  );
}
