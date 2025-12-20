import type { ObservationListRead } from "./observation";

/**
 * Base observation type for general observation data.
 * Use this type when user attribution (created_by, updated_by) is not the primary concern.
 */
export type Observation = ObservationListRead;

/**
 * Observation type with user context (created_by, updated_by, data_entered_by).
 * Use when rendering observations with user attribution or when user metadata is required.
 */
export type ObservationWithUser = ObservationListRead;

export * from "./observation";
export * from "./observationApi";
