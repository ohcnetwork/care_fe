import { LocationHistory } from "@/types/emr/encounter/encounter";

import { LocationCardWrapper } from "../LocationCardWrapper";
import {
  EditingState,
  LocationSheetState,
} from "../hooks/useLocationAssignment";
import { CurrentLocationsList } from "./CurrentLocationsList";

interface assignmentHandlers {
  sheetState: LocationSheetState;
  setSheetState: React.Dispatch<React.SetStateAction<LocationSheetState>>;
  isPending: boolean;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  onMove: () => void;
  onComplete: (location: LocationHistory) => void;
  onUpdateTime: (location: LocationHistory) => void;
  onCancel: (status: "active" | "planned", location: LocationHistory) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (location: LocationHistory) => void;
  onConfirmTime: (plannedLocation?: LocationHistory) => void;
}

interface LocationModifyViewProps {
  currentLocation?: LocationHistory;
  plannedLocations: LocationHistory[];
  selectedBedLocation?: LocationHistory;
  assignmentHandlers: assignmentHandlers;
  onAssignNowPlanned: (location: LocationHistory) => void;
}

export function LocationModifyView({
  currentLocation,
  plannedLocations,
  selectedBedLocation,
  assignmentHandlers,
  onAssignNowPlanned,
}: LocationModifyViewProps) {
  const {
    sheetState,
    editingState,
    setEditingState,
    setSheetState,
    isPending,
    keepBedActive,
    onKeepBedActiveChange,
    onMove,
    onComplete,
    onUpdateTime,
    onCancel,
    onCancelEdit,
    onConfirmEdit,
    onConfirmTime,
  } = assignmentHandlers;
  const showNewBedCard =
    selectedBedLocation &&
    (sheetState.action === "new" || sheetState.action === "move") &&
    !editingState.locationId;

  return (
    <div className="space-y-4">
      <CurrentLocationsList
        currentLocation={currentLocation}
        plannedLocations={plannedLocations}
        editingState={editingState}
        setEditingState={setEditingState}
        isPending={isPending}
        showMoveButton={false}
        keepBedActive={keepBedActive}
        onKeepBedActiveChange={onKeepBedActiveChange}
        onMove={onMove}
        onComplete={onComplete}
        onUpdateTime={onUpdateTime}
        onCancel={onCancel}
        onAssignNow={onAssignNowPlanned}
        onCancelEdit={onCancelEdit}
        onConfirmEdit={onConfirmEdit}
      />

      {showNewBedCard && (
        <LocationCardWrapper
          locationHistory={selectedBedLocation}
          status={sheetState.timeConfig.status}
          editingState={{
            locationId: selectedBedLocation.id,
            timeConfig: sheetState.timeConfig,
          }}
          setEditingState={(newState) => {
            if (typeof newState === "function") {
              setSheetState((prev) => ({
                ...prev,
                timeConfig: newState({
                  locationId: selectedBedLocation.id,
                  timeConfig: prev.timeConfig,
                }).timeConfig,
              }));
            } else {
              setSheetState((prev) => ({
                ...prev,
                timeConfig: newState.timeConfig,
              }));
            }
          }}
          handleCancelEdit={() =>
            setSheetState((prev) => ({ ...prev, screen: "assign" }))
          }
          handleConfirmEdit={() => onConfirmTime()}
          isPending={isPending}
        />
      )}
    </div>
  );
}
