import { match } from "path-to-regexp";

export const ROUTE_TO_TAB: Record<string, { parent: string; child?: string }> =
  {
    "/facility/:facilityId/overview": { parent: "overview" },
    "/facility/:facilityId/appointments": { parent: "appointments" },
    "/facility/:facilityId/patient/:patientId/encounter/:encounterId/:rest*": {
      parent: "patients",
      child: "encounters",
    },
    "/facility/:facilityId/patient/create": {
      parent: "patients",
      child: "search_patients",
    },
    "/facility/:facilityId/patient/:patientId/:rest*": { parent: "patients" },
    "/facility/:facilityId/encounters/patients": {
      parent: "patients",
      child: "encounters",
    },
    "/facility/:facilityId/encounters/locations": { parent: "patients" },
    "/facility/:facilityId/patients/search": {
      parent: "patients",
      child: "search_patients",
    },
    "/facility/:facilityId/resource": { parent: "resource" },
    "/facility/:facilityId/users": { parent: "users" },
    "/facility/:facilityId/settings/:rest*": { parent: "settings" },
  };

export const resolveTabKey = (
  pathname: string,
): { parent: string; child?: string } | null => {
  for (const [pattern, tabInfo] of Object.entries(ROUTE_TO_TAB)) {
    try {
      const matcher = match(pattern, {
        decode: decodeURIComponent,
        end: false,
      });
      if (matcher(pathname)) {
        return tabInfo;
      }
    } catch (err) {
      console.error("Failed to compile pattern:", pattern, err);
    }
  }
  return null;
};
