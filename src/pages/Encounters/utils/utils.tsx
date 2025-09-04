export const buildEncounterUrl = (
  patientId: string,
  subPath: string,
  facilityId?: string,
) => {
  if (facilityId) {
    return `/facility/${facilityId}/patient/${patientId}${subPath}`;
  }
  return `/organization/organizationId/patient/${patientId}${subPath}`;
};
