import { LocationAssociationRead } from "@/types/location/association";

import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { AssignmentHandlers } from "@/components/Location/utils/locationHelpers";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";
import { useTranslation } from "react-i18next";

interface LocationModifyViewProps {
  currentLocation?: LocationAssociationRead;
  plannedLocations: LocationAssociationRead[];
  activeLocations: LocationAssociationRead[];
  selectedBedLocation?: LocationAssociationRead;
  assignmentHandlers: AssignmentHandlers;
  onAssignNowPlanned: (location: LocationAssociationRead) => void;
  onAssignNowReserved: (location: LocationAssociationRead) => void;
}

export function LocationModifyView({
  currentLocation,
  plannedLocations,
  activeLocations,
  selectedBedLocation,
  assignmentHandlers,
  onAssignNowPlanned,
  onAssignNowReserved,
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
    onCancelBed,
    onCancelEdit,
    onConfirmEdit,
    onConfirmTime,
  } = assignmentHandlers;

  const locationHistory = selectedBedLocation;
  const isAssign = sheetState.action === "assign";
  const isMove = sheetState.action === "move";
  const isPromote = sheetState.action === "promote";
  const cancelScreen = isAssign || isMove ? "assign" : "overview";
  const isPromotingReserved = isPromote
    ? activeLocations?.find((loc) => loc.id === editingState.locationId)
    : undefined;
  const isAddingReserved =
    isAssign && sheetState.timeConfig.status === "reserved";
  const isAddingPlanned =
    isAssign && sheetState.timeConfig.status === "planned";
  const showNewBedCard =
    locationHistory && (isAssign || isMove) && !editingState.locationId;
  const showKeepBedActive =
    (isMove || (isPromote && !!currentLocation)) &&
    !isAddingReserved &&
    !isAddingPlanned;

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
        keepBedActive={showKeepBedActive ? keepBedActive : undefined}
        onKeepBedActiveChange={
          showKeepBedActive ? onKeepBedActiveChange : undefined
        }
        onMove={onMove}
        onComplete={onComplete}
        onUpdateTime={onUpdateTime}
        onCancelBed={onCancelBed}
        onAssignNowPlanned={onAssignNowPlanned}
        onAssignNowReserved={onAssignNowReserved}
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
            setSheetState((prev) => ({ ...prev, screen: cancelScreen }))
          }
          handleConfirmEdit={(location) => onConfirmTime(location)}
          isPending={isPending}
          title={
            isEditingCurrentLocation
              ? t("patient_current_location")
              : isAddingReserved
                ? t("reserved_bed")
                : t("patient_next_location")
          }
        />
      )}
      {isPromotingReserved && (
        <LocationCardWrapper
          locationHistory={isPromotingReserved}
          status={sheetState.timeConfig.status}
          readOnly={isPromotingReserved.status === "reserved"}
          editingState={{
            locationId: isPromotingReserved.id,
            timeConfig: sheetState.timeConfig,
          }}
          setEditingState={(newState) => {
            if (typeof newState === "function") {
              setSheetState((prev) => ({
                ...prev,
                timeConfig: newState({
                  locationId: isPromotingReserved.id,
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
          handleCancelEdit={() => {
            onCancelEdit();
            setSheetState((prev) => ({ ...prev, screen: cancelScreen }));
          }}
          handleConfirmEdit={() => onConfirmTime(isPromotingReserved)}
          isPending={isPending}
          title={t("assign_reserved_bed_now")}
        />
      )}
    </div>
  );
}
