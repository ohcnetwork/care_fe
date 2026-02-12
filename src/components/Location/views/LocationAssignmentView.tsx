import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { LocationAssociationRead } from "@/types/location/association";
import { LocationRead } from "@/types/location/location";

import { LocationNavigation } from "@/components/Location/LocationNavigation";
import {
  AssignmentHandlers,
  NavigationHandlers,
} from "@/components/Location/utils/locationHelpers";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";

interface LocationAssignmentViewProps {
  // Location data
  allLocations: LocationRead[];
  allBeds: LocationRead[];
  selectedLocation: LocationRead | null;
  selectedLinkedBed: LocationAssociationRead | null;
  locationHistory: LocationRead[];
  selectedBed: LocationRead | null;
  currentLocation?: LocationAssociationRead;
  plannedLocations: LocationAssociationRead[];
  activeLocations: LocationAssociationRead[];
  // Flags
  isPending: boolean;
  assignmentHandlers: AssignmentHandlers;
  navigationHandlers: NavigationHandlers;
}

export function LocationAssignmentView({
  allLocations,
  allBeds,
  selectedLocation,
  selectedLinkedBed,
  locationHistory,
  selectedBed,
  currentLocation,
  plannedLocations,
  activeLocations,
  assignmentHandlers,
  navigationHandlers,
}: LocationAssignmentViewProps) {
  const { t } = useTranslation();
  const {
    sheetState,
    isPending,
    editingState,
    setEditingState,
    keepBedActive,
    onKeepBedActiveChange,
    onMove,
    onComplete,
    onUpdateTime,
    onCancel,
    onCancelEdit,
    onConfirmEdit,
    onAssignLinkedBed,
  } = assignmentHandlers;
  const {
    onLocationClick,
    onBedSelect,
    onLinkedBedSelect,
    onCheckBedStatus,
    onSearchChange,
    onSearch,
    onShowAvailableChange,
    onLoadMore,
    onClearSelection,
    onGoBack,
    onAssignNowPlanned,
    onScheduleForLater,
    onAssignNow,
    showAvailableOnly,
    searchTerm,
    isLoadingLocations,
    isLoadingBeds,
    hasMore,
  } = navigationHandlers;

  const shouldShowNavigation =
    sheetState.action === "move" ||
    (!currentLocation && !plannedLocations.length);

  const isLinkedBed = selectedLinkedBed !== null;

  if (!shouldShowNavigation) {
    return (
      <div className="flex flex-col gap-2">
        <CurrentLocationsList
          currentLocation={currentLocation}
          plannedLocations={plannedLocations}
          editingState={editingState}
          setEditingState={setEditingState}
          isPending={isPending}
          showMoveButton={true}
          onMove={onMove}
          onComplete={onComplete}
          onUpdateTime={onUpdateTime}
          onCancel={onCancel}
          onAssignNow={onAssignNowPlanned}
          onCancelEdit={onCancelEdit}
          onConfirmEdit={onConfirmEdit}
          linkedLocations={activeLocations}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
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

      <LocationNavigation
        locations={allLocations}
        beds={allBeds}
        selectedLocation={selectedLocation}
        locationHistory={locationHistory}
        selectedBed={selectedBed}
        selectedLinkedBed={selectedLinkedBed ?? undefined}
        showAvailableOnly={showAvailableOnly}
        searchTerm={searchTerm}
        isLoadingLocations={isLoadingLocations}
        isLoadingBeds={isLoadingBeds}
        hasMore={hasMore}
        onLocationClick={onLocationClick}
        onLinkedBedSelect={onLinkedBedSelect}
        onBedSelect={onBedSelect}
        onCheckBedStatus={onCheckBedStatus}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
        onShowAvailableChange={onShowAvailableChange}
        onLoadMore={onLoadMore}
        onClearSelection={onClearSelection}
        onGoBack={onGoBack}
        linkedLocations={activeLocations}
      />

      <div className="mt-8 flex justify-end gap-2">
        <Button
          variant="outline"
          disabled={!selectedBed}
          onClick={onScheduleForLater}
        >
          {t("schedule_for_later")}
        </Button>
        <Button
          variant="primary"
          disabled={!selectedBed && !selectedLinkedBed}
          onClick={() => {
            isLinkedBed
              ? onAssignLinkedBed?.(selectedLinkedBed)
              : onAssignNow();
          }}
        >
          {t("assign_bed_now")}
        </Button>
      </div>
    </div>
  );
}
