import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { LocationHistory } from "@/types/emr/encounter/encounter";
import { LocationList } from "@/types/location/location";

import { LocationNavigation } from "@/components/Location/LocationNavigation";
import {
  EditingState,
  LocationSheetState,
} from "@/components/Location/hooks/useLocationAssignment";
import { CurrentLocationsList } from "@/components/Location/views/CurrentLocationsList";

interface LocationAssignmentViewProps {
  // Location data
  allLocations: LocationList[];
  allBeds: LocationList[];
  selectedLocation: LocationList | null;
  selectedLinkedBed: LocationHistory | null;
  locationHistory: LocationList[];
  selectedBed: string | null;
  currentLocation?: LocationHistory;
  plannedLocations: LocationHistory[];
  activeLocations: LocationHistory[];
  // Flags
  isPending: boolean;
  assignmentHandlers: assignmentHandlers;
  navigationHandlers: navigationHandlers;
}

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

export interface navigationHandlers {
  onLocationClick: (location: LocationList) => void;
  onBedSelect: (bedId: string) => void;
  onLinkedBedSelect: (bed: LocationHistory) => void;
  onCheckBedStatus: (bed: LocationList) => void;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onShowAvailableChange: (value: boolean) => void;
  onLoadMore: () => void;
  onClearSelection: () => void;
  onGoBack: () => void;
  onAssignNowPlanned: (location: LocationHistory) => void;
  onScheduleForLater: () => void;
  onAssignNow: () => void;
  showAvailableOnly: boolean;
  searchTerm: string;
  isLoadingLocations: boolean;
  isLoadingBeds: boolean;
  hasMore: boolean;
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

  if (!shouldShowNavigation) {
    return (
      <div className="space-y-2">
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
          disabled={!selectedBed && !selectedLinkedBed}
          onClick={onScheduleForLater}
        >
          {t("schedule_for_later")}
        </Button>
        <Button
          variant="primary"
          disabled={!selectedBed && !selectedLinkedBed}
          onClick={onAssignNow}
        >
          {t("assign_bed_now")}
        </Button>
      </div>
    </div>
  );
}
