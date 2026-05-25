import { LocationAssociationRead } from "@/types/location/association";

import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { AssignmentHandlers } from "@/components/Location/utils/locationHelpers";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";
import { useTranslation } from "react-i18next";

interface LocationModifyViewProps {
  currentLocation?: LocationAssociationRead;
  plannedLocations: LocationAssociationRead[];
  reservedLocations: LocationAssociationRead[];
  selectedBedLocation?: LocationAssociationRead;
  assignmentHandlers: AssignmentHandlers;
}

export function LocationModifyView({
  currentLocation,
  plannedLocations,
  reservedLocations,
  selectedBedLocation,
  assignmentHandlers,
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
    onAssignNowPlanned,
    onAssignNowReserved,
  } = assignmentHandlers;

  const isAssign = sheetState.action === "assign";
  const isMove = sheetState.action === "move";
  const isPromote = sheetState.action === "promote";
  const cancelScreen = isAssign || isMove ? "assign" : "overview";
  const promotePlannedLocation = isPromote
    ? plannedLocations?.find((loc) => loc.id === editingState.locationId)
    : undefined;
  const promoteReservedLocation = isPromote
    ? reservedLocations?.find((loc) => loc.id === editingState.locationId)
    : undefined;

  const isAddingReserved =
    isAssign && sheetState.timeConfig.status === "reserved";
  const isAddingPlanned =
    isAssign && sheetState.timeConfig.status === "planned";
  const showNewBedCard =
    selectedBedLocation && (isAssign || isMove) && !editingState.locationId;

  const showKeepBedActive =
    (isMove || (isPromote && !!currentLocation)) &&
    !isAddingReserved &&
    !isAddingPlanned;

  const locationId = selectedBedLocation?.id || "";
  const isEditingCurrentLocation = currentLocation?.id === locationId;

  const handlers = {
    editingState,
    setEditingState,
    isPending,
    onMove,
    onComplete,
    onUpdateTime,
    onCancelBed,
    onCancelEdit,
    onConfirmEdit,
    onAssignNowPlanned,
    onAssignNowReserved,
  };

  const promotingLocation = promotePlannedLocation || promoteReservedLocation;
  const readOnly = promoteReservedLocation?.status === "reserved";
  const title = promotePlannedLocation
    ? "assign_planned_bed_now"
    : "assign_reserved_bed_now";

  return (
    <div className="space-y-4">
      <CurrentLocationsList
        currentLocation={currentLocation}
        handlers={handlers}
        showMoveButton={false}
        keepBedActive={showKeepBedActive ? keepBedActive : undefined}
        onKeepBedActiveChange={
          showKeepBedActive ? onKeepBedActiveChange : undefined
        }
      />
      {showNewBedCard && (
        <LocationCardWrapper
          location={selectedBedLocation}
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
      {promotingLocation && (
        <LocationCardWrapper
          location={promotingLocation}
          status={sheetState.timeConfig.status}
          readOnly={readOnly}
          editingState={{
            locationId: promotingLocation.id,
            timeConfig: sheetState.timeConfig,
          }}
          setEditingState={(newState) => {
            if (typeof newState === "function") {
              setSheetState((prev) => ({
                ...prev,
                timeConfig: newState({
                  locationId: promotingLocation.id,
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
          handleConfirmEdit={() => onConfirmTime(promotingLocation)}
          isPending={isPending}
          title={t(title)}
        />
      )}
    </div>
  );
}
