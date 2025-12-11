import { LocationHistory } from "@/types/emr/encounter/encounter";
import { LocationAssociationStatus } from "@/types/location/association";

import { LocationActionButtons } from "../LocationActionButtons";
import { LocationCardWrapper } from "../LocationCardWrapper";
import { EditingState } from "../hooks/useLocationAssignment";

interface CurrentLocationsListProps {
  currentLocation?: LocationHistory;
  plannedLocations: LocationHistory[];
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  isPending: boolean;
  showMoveButton: boolean;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  onMove: () => void;
  onComplete: (location: LocationHistory) => void;
  onUpdateTime: (location: LocationHistory) => void;
  onCancel: (status: "active" | "planned", location: LocationHistory) => void;
  onAssignNow: (location: LocationHistory) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (location: LocationHistory) => void;
  linkedLocations?: LocationHistory[];
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
  onComplete,
  onUpdateTime,
  onCancel,
  onAssignNow,
  onCancelEdit,
  onConfirmEdit,
  linkedLocations,
}: CurrentLocationsListProps) {
  const renderLocationCard = (
    locationHistory: LocationHistory,
    status: LocationAssociationStatus,
    areLinkedLocations?: boolean,
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
      areLinkedLocations={areLinkedLocations}
    >
      {showMoveButton && (
        <div className="flex justify-end gap-2">
          <LocationActionButtons
            status={status}
            location={locationHistory}
            onMove={onMove}
            onComplete={status === "active" ? onComplete : undefined}
            onUpdateTime={onUpdateTime}
            onCancel={() =>
              onCancel(status as "planned" | "active", locationHistory)
            }
            onAssignNow={
              status === "planned"
                ? () => onAssignNow(locationHistory)
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
      {linkedLocations?.map((location) =>
        renderLocationCard(location, location.status, true),
      )}
      {plannedLocations.map((location) =>
        renderLocationCard(location, "planned"),
      )}
    </>
  );
}
