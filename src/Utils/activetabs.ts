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
    "/facility/:facilityId/encounters/locations": {
      parent: "patients",
      child: "locations",
    },
    "/facility/:facilityId/patients/search": {
      parent: "patients",
      child: "search_patients",
    },
    "/facility/:facilityId/resource": { parent: "resource" },
    "/facility/:facilityId/users": { parent: "users" },
    "/facility/:facilityId/settings/general": {
      parent: "settings",
      child: "general",
    },
    "/facility/:facilityId/settings/devices": {
      parent: "settings",
      child: "devices",
    },
    "/facility/:facilityId/settings/reportbuilder/": {
      parent: "settings",
      child: "report builder",
    },
    "/facility/:facilityId/settings/locations": {
      parent: "settings",
      child: "location",
    },
    "/facility/:facilityId/settings/departments": {
      parent: "settings",
      child: "departments",
    },
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
