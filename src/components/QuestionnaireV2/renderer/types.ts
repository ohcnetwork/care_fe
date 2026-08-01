export type RendererMode = "preview" | "readonly";

export interface RendererSubject {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  resourceId?: string;
}
