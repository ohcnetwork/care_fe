import { LocationAssociationRead } from "@/types/location/association";

import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { AssignmentHandlers } from "@/components/Location/utils/locationHelpers";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";
import { useTranslation } from "react-i18next";

interface LocationModifyViewProps {
  currentLocation?: LocationAssociationRead;
  plannedLocations: LocationAssociationRead[];
  selectedBedLocation?: LocationAssociationRead;
  selectedLinkedBed?: LocationAssociationRead;
  assignmentHandlers: AssignmentHandlers;
  onAssignNowPlanned: (location: LocationAssociationRead) => void;
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

  const locationHistory = selectedBedLocation || selectedLinkedBed;
  const showNewBedCard =
    locationHistory &&
    (sheetState.action === "new" || sheetState.action === "move") &&
    !editingState.locationId;
  const locationId = locationHistory?.id || "";
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
          handleConfirmEdit={(location) => onConfirmTime(location)}
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
