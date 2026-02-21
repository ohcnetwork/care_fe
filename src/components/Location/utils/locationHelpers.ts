import { EncounterRead } from "@/types/emr/encounter/encounter";
import {
  LocationAssociationRead,
  LocationAssociationStatus,
} from "@/types/location/association";
import { LocationRead, OperationalStatus } from "@/types/location/location";

export type LocationScreen = "view" | "assign" | "modify";
export type LocationAction = "move" | "complete" | "cancel" | "new";

export interface LocationSheetState {
  screen: LocationScreen;
  action: LocationAction;
  timeConfig: LocationTimeConfig;
}

export interface EditingState {
  locationId: string | null;
  timeConfig: LocationTimeConfig;
}

export interface LocationTimeConfig {
  start: Date;
  end?: Date;
  status: LocationAssociationStatus;
}

export interface CurrentLocations {
  currentLocation: LocationAssociationRead | undefined;
  activeLocations: LocationAssociationRead[];
  plannedLocations: LocationAssociationRead[];
}

/**
 * Gets the current, active (non-current), and planned locations from encounter history
 */
export function getCurrentLocations(
  encounter: EncounterRead,
): CurrentLocations {
  const currentEncounterLocation = encounter.current_location;
  const currentLocation = encounter.location_history.find(
    (loc) =>
      loc.status === "active" &&
      currentEncounterLocation &&
      loc.location.id === currentEncounterLocation.id,
  );

  const activeLocations = encounter.location_history.filter(
    (loc) =>
      (loc.status === "active" || loc.status === "reserved") &&
      currentEncounterLocation &&
      loc.location.id !== currentEncounterLocation.id,
  );

  const plannedLocations = encounter.location_history.filter(
    (loc) => loc.status === "planned",
  );

  return { currentLocation, activeLocations, plannedLocations };
}

/**
 * Transforms a selected bed into LocationHistory format for preview
 */
export function createLocationHistoryFromBed(
  bed: LocationRead,
  timeConfig: LocationTimeConfig,
): LocationAssociationRead {
  return {
    id: bed.id,
    location: bed,
    start_datetime: timeConfig.start.toISOString(),
    end_datetime: timeConfig.end ? timeConfig.end.toISOString() : undefined,
    status: timeConfig.status,
  };
}

/**
 * Creates a location update request for batch API
 */
export function createLocationAssociationUpdateRequest(
  location: LocationAssociationRead,
  config: LocationTimeConfig,
  facilityId: string,
  encounterId: string,
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${location.location.id}/association/${location.id}/`,
    method: "PUT" as const,
    reference_id: "updateLocationAssociation",
    body: {
      encounter: encounterId,
      start_datetime: config.start.toISOString(),
      ...(config.status === "active" || config.status === "reserved"
        ? { end_datetime: null }
        : config.end
          ? {
              end_datetime: config.end.toISOString(),
            }
          : {}),
      status: config.status,
    },
  };
}

/**
 * Creates a new location association request for batch API
 */
export function createLocationAssociationRequest(
  bedId: string,
  timeConfig: LocationTimeConfig,
  facilityId: string,
  encounterId: string,
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${bedId}/association/`,
    method: "POST" as const,
    reference_id: "createLocationAssociation",
    body: {
      encounter: encounterId,
      start_datetime: timeConfig.start.toISOString(),
      ...(timeConfig.end && {
        end_datetime: timeConfig.end.toISOString(),
      }),
      status: timeConfig.status,
    },
  };
}

export function createLocationUpdateOperationalStatusRequest(
  location: LocationRead,
  facilityId: string,
  operationalStatus: OperationalStatus,
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${location.id}/`,
    method: "PUT" as const,
    reference_id: "updateOperationalStatus",
    body: {
      ...location,
      location_type: location.location_type?.code
        ? location.location_type
        : undefined,
      operational_status: operationalStatus,
    },
  };
}

/**
 * Creates a request to complete (mark as completed) a location
 */
export function completeCurrentLocationAssociation(
  location: LocationAssociationRead,
  facilityId: string,
  encounterId: string,
  endTime: Date = new Date(),
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${location.location.id}/association/${location.id}/`,
    method: "PUT" as const,
    reference_id: "completeCurrentLocationAssociation",
    body: {
      encounter: encounterId,
      end_datetime: endTime.toISOString(),
      status: "completed" as LocationAssociationStatus,
      start_datetime: location.start_datetime,
    },
  };
}

/**
 * Creates a request to delete a location association for batch API
 */
export function createDeleteLocationAssociationRequest(
  locationId: string,
  associationId: string,
  facilityId: string,
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${locationId}/association/${associationId}/`,
    method: "DELETE" as const,
    reference_id: "deleteLocationAssociation",
    body: {},
  };
}

export interface AssignmentHandlers {
  sheetState: LocationSheetState;
  setSheetState: React.Dispatch<React.SetStateAction<LocationSheetState>>;
  isPending: boolean;
  editingState: EditingState;
  setEditingState: React.Dispatch<React.SetStateAction<EditingState>>;
  keepBedActive?: boolean;
  onKeepBedActiveChange?: (value: boolean) => void;
  onMove: () => void;
  onComplete: (location: LocationAssociationRead) => void;
  onUpdateTime: (location: LocationAssociationRead) => void;
  onCancel: (
    status: "active" | "planned",
    location: LocationAssociationRead,
  ) => void;
  onCancelEdit: () => void;
  onConfirmEdit: (location: LocationAssociationRead) => void;
  onConfirmTime: (plannedLocation?: LocationAssociationRead) => void;
  onAssignLinkedBed?: (location: LocationAssociationRead) => void;
}

export interface NavigationHandlers {
  onLocationClick: (location: LocationRead) => void;
  onBedSelect: (bed: LocationRead) => void;
  onLinkedBedSelect: (bed: LocationAssociationRead) => void;
  onCheckBedStatus: (bed: LocationRead) => void;
  onSearchChange: (value: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onShowAvailableChange: (value: boolean) => void;
  onLoadMore: () => void;
  onClearSelection: () => void;
  onGoBack: () => void;
  onAssignNowPlanned: (location: LocationAssociationRead) => void;
  onScheduleForLater: () => void;
  onAssignNow: () => void;
  showAvailableOnly: boolean;
  searchTerm: string;
  isLoadingLocations: boolean;
  isLoadingBeds: boolean;
  hasMore: boolean;
}
