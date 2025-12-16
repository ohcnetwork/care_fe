import { LocationHistory } from "@/types/emr/encounter/encounter";

import {
  EditingState,
  LocationSheetState,
} from "@/components/Location/hooks/useLocationAssignment";
import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";
import { useTranslation } from "react-i18next";

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
  selectedLinkedBed?: LocationHistory;
  assignmentHandlers: assignmentHandlers;
  onAssignNowPlanned: (location: LocationHistory) => void;
}

export function LocationModifyView({
  currentLocation,
  plannedLocations,
  selectedBedLocation,
  selectedLinkedBed,
  assignmentHandlers,
  onAssignNowPlanned,
}: LocationModifyViewProps) {
  const { t } = useTranslation();
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
    (selectedBedLocation || selectedLinkedBed) &&
    (sheetState.action === "new" || sheetState.action === "move") &&
    !editingState.locationId;
  const locationId = selectedBedLocation?.id || selectedLinkedBed?.id || "";
  const locationHistory = (selectedBedLocation || selectedLinkedBed)!;
  const isEditingCurrentLocation = currentLocation?.id === locationId;
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
          locationHistory={locationHistory}
          status={sheetState.timeConfig.status}
          editingState={{
            locationId,
            timeConfig: sheetState.timeConfig,
          }}
          setEditingState={(newState) => {
            if (typeof newState === "function") {
              setSheetState((prev) => ({
                ...prev,
                timeConfig: newState({
                  locationId: locationId,
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
          title={
            isEditingCurrentLocation
              ? t("patient_current_location")
              : t("patient_next_location")
          }
        />
      )}
    </div>
  );
}
