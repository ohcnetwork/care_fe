/** The flat subject view structured inputs read their context from —
 *  `fill/subject.ts` derives it from the richer `FillSubject` union, and
 *  `form/types.ts` re-exports it as the canvas prop type. */
export interface RendererSubject {
  patientId?: string;
  encounterId?: string;
  facilityId?: string;
  resourceId?: string;
}
