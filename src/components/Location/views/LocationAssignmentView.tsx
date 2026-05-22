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
    onMove,
    onAddBed,
    onComplete,
    onUpdateTime,
    onCancelBed,
    onCancelEdit,
    onConfirmEdit,
    onAssignNowPlanned,
    onAssignNowReserved,
    resetScreen,
  } = assignmentHandlers;
  const {
    onLocationClick,
    onBedSelect,
    onCheckBedStatus,
    onSearchChange,
    onSearch,
    onShowAvailableChange,
    onLoadMore,
    onClearSelection,
    onGoBack,
    onScheduleForLater,
    onAddReservedBed,
    onAssignNow,
    showAvailableOnly,
    searchTerm,
    isLoadingLocations,
    isLoadingBeds,
    hasMore,
  } = navigationHandlers;

  const hasLocations =
    !!currentLocation ||
    plannedLocations.length > 0 ||
    activeLocations.length > 0;
  const isOverview = sheetState.screen === "overview";

  const showAddAnotherBedForReservedPlanned =
    isOverview && hasLocations && !currentLocation;

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
    onAddBed: showAddAnotherBedForReservedPlanned ? onAddBed : undefined,
  };

  if (isOverview && hasLocations) {
    return (
      <div className="flex flex-col gap-2">
        <CurrentLocationsList
          currentLocation={currentLocation}
          plannedLocations={plannedLocations}
          handlers={handlers}
          showMoveButton={true}
          linkedLocations={activeLocations}
        />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CurrentLocationsList
        currentLocation={currentLocation}
        handlers={handlers}
        showMoveButton={false}
      />

      <LocationNavigation
        locations={allLocations}
        beds={allBeds}
        selectedLocation={selectedLocation}
        locationHistory={locationHistory}
        selectedBed={selectedBed}
        showAvailableOnly={showAvailableOnly}
        searchTerm={searchTerm}
        isLoadingLocations={isLoadingLocations}
        isLoadingBeds={isLoadingBeds}
        hasMore={hasMore}
        onLocationClick={onLocationClick}
        onBedSelect={onBedSelect}
        onCheckBedStatus={onCheckBedStatus}
        onSearchChange={onSearchChange}
        onSearch={onSearch}
        onShowAvailableChange={onShowAvailableChange}
        onLoadMore={onLoadMore}
        onClearSelection={onClearSelection}
        onGoBack={onGoBack}
      />

      <div className="mt-8 flex justify-end gap-2">
        {!isOverview && (
          <Button variant="outline" onClick={resetScreen}>
            {t("cancel")}
          </Button>
        )}
        <Button
          variant="outline"
          disabled={!selectedBed}
          onClick={onScheduleForLater}
        >
          {t("schedule_for_later")}
        </Button>
        <Button
          variant="outline"
          disabled={!selectedBed}
          onClick={onAddReservedBed}
        >
          {t("add_reserved_bed")}
        </Button>
        <Button variant="primary" disabled={!selectedBed} onClick={onAssignNow}>
          {t("assign_bed_now")}
        </Button>
      </div>
    </div>
  );
}
