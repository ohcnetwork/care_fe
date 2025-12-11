import {
  EncounterRead,
  LocationHistory,
} from "@/types/emr/encounter/encounter";
import { LocationAssociationStatus } from "@/types/location/association";
import { LocationList } from "@/types/location/location";

export interface LocationTimeConfig {
  start: Date;
  end?: Date;
  status: LocationAssociationStatus;
}

export interface CurrentLocations {
  currentLocation: LocationHistory | undefined;
  activeLocations: LocationHistory[];
  plannedLocations: LocationHistory[];
}

/**
 * Gets the current, active (non-current), and planned locations from encounter history
 */
export function getCurrentLocations(
  encounter: EncounterRead,
): CurrentLocations {
  const currentLocation = encounter.location_history.find(
    (loc) =>
      loc.status === "active" &&
      loc.location.id === encounter.current_location.id,
  );

  const activeLocations = encounter.location_history.filter(
    (loc) =>
      loc.status === "active" ||
      (loc.status === "reserved" &&
        loc.location.id !== encounter.current_location.id),
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
  bed: LocationList,
  timeConfig: LocationTimeConfig,
): LocationHistory {
  return {
    id: bed.id,
    location: bed,
    start_datetime: new Date(timeConfig.start).toISOString(),
    end_datetime: timeConfig.end
      ? new Date(timeConfig.end).toISOString()
      : undefined,
    status: timeConfig.status,
  };
}

/**
 * Creates a location update request for batch API
 */
export function createLocationUpdateRequest(
  location: LocationHistory,
  config: LocationTimeConfig,
  facilityId: string,
  encounterId: string,
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${location.location.id}/association/${location.id}/`,
    method: "PUT" as const,
    reference_id: "updateLocation",
    body: {
      encounter: encounterId,
      start_datetime: new Date(config.start).toISOString(),
      ...(config.status === "active" || config.status === "reserved"
        ? { end_datetime: null }
        : config.end
          ? {
              end_datetime: new Date(config.end).toISOString(),
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
      start_datetime: new Date(timeConfig.start).toISOString(),
      ...(timeConfig.end && {
        end_datetime: new Date(timeConfig.end).toISOString(),
      }),
      status: timeConfig.status,
    },
  };
}

/**
 * Creates a request to complete (mark as completed) a location
 */
export function createCompleteLocationRequest(
  location: LocationHistory,
  facilityId: string,
  encounterId: string,
  endTime: Date = new Date(),
) {
  return {
    url: `/api/v1/facility/${facilityId}/location/${location.location.id}/association/${location.id}/`,
    method: "PUT" as const,
    reference_id: "completeCurrentLocation",
    body: {
      encounter: encounterId,
      end_datetime: endTime.toISOString(),
      status: "completed" as LocationAssociationStatus,
      start_datetime: location.start_datetime,
    },
  };
}
