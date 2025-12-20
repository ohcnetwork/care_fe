import type { ObservationListRead } from "./observation";

/**
 * Base observation type for general observation data.
 * Note: All observations include user attribution fields (created_by, updated_by, data_entered_by)
 * to track data provenance. Use this as the canonical observation type name in business logic.
 */
export type Observation = ObservationListRead;

/**
 * Observation type with user context (created_by, updated_by, data_entered_by).
 * Use when rendering observations with user attribution or when user metadata is required.
 */
export type ObservationWithUser = ObservationListRead;

export * from "./observation";
export * from "./observationApi";
