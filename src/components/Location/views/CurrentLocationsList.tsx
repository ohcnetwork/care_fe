import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";

import { LocationActionButtons } from "@/components/Location/LocationActionButtons";
import { LocationCardWrapper } from "@/components/Location/LocationCardWrapper";
import { AssignmentHandlers } from "@/components/Location/utils/locationHelpers";
import { useTranslation } from "react-i18next";

interface CurrentLocationsListProps {
  currentLocation?: LocationAssociationRead;
  plannedLocations?: LocationAssociationRead[];
  handlers: Pick<
    AssignmentHandlers,
    | "editingState"
    | "setEditingState"
    | "isPending"
    | "onMove"
    | "onComplete"
    | "onUpdateTime"
    | "onCancelBed"
    | "onCancelEdit"
    | "onConfirmEdit"
    | "onAssignNowPlanned"
    | "onAssignNowReserved"
    | "onAddBed"
  >;
  showMoveButton: boolean;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  reservedLocations?: LocationAssociationRead[];
}

export function CurrentLocationsList({
  currentLocation,
  plannedLocations,
  handlers,
  showMoveButton,
  keepBedActive,
  onKeepBedActiveChange,
  reservedLocations,
}: CurrentLocationsListProps) {
  const { t } = useTranslation();
  const {
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
    onAddBed,
  } = handlers;
  const renderLocationCard = (
    location: LocationAssociationRead,
    status: LocationAssociationStatus,
  ) => (
    <LocationCardWrapper
      key={location.id}
      location={location}
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
            location={location}
            onMove={onMove}
            onAddBed={onAddBed}
            onComplete={
              status === "active" || status === "reserved"
                ? onComplete
                : undefined
            }
            onUpdateTime={onUpdateTime}
            onCancelBed={() =>
              onCancelBed(status as "planned" | "active", location)
            }
            onAssignNow={
              status === "reserved"
                ? () => onAssignNowReserved(location)
                : status === "planned"
                  ? () => onAssignNowPlanned(location)
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
      {reservedLocations && reservedLocations.length > 0 && (
        <>
          <h3 className="text-base font-semibold">{t("linked_locations")}</h3>
          {reservedLocations.map((location) =>
            renderLocationCard(location, location.status),
          )}
        </>
      )}
      {plannedLocations &&
        plannedLocations.map((location) =>
          renderLocationCard(location, "planned"),
        )}
    </>
  );
}
