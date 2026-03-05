import {
  HasPermissionFn,
  Permissions,
  getPermissions,
} from "@/common/Permissions";
import { InternalType } from "@/types/healthcareService/healthcareService";

interface LocationUrl {
  path: string;
  textKey: string;
  visibility: (perms: Permissions, facilityPerms: Permissions) => boolean;
}

export interface LocationUrlResult {
  url: string;
  textKey: string;
}

const pharmacyUrls: LocationUrl[] = [
  {
    path: "/medication_requests",
    textKey: "view_prescriptions",
    visibility: (_p, fp) => fp.canViewAsPharmacist,
  },
  {
    path: "/medication_dispense",
    textKey: "dispense",
    visibility: (p, fp) => fp.canViewAsPharmacist || p.canReadSupplyDelivery,
  },
  {
    path: "/medication_return",
    textKey: "medication_return",
    visibility: (p) => p.canReadSupplyDelivery,
  },
  {
    path: "/inventory/summary",
    textKey: "inventory",
    visibility: (p) => p.canReadInventory,
  },
];

const labUrls: LocationUrl[] = [
  {
    path: "/service_requests",
    textKey: "view_requests",
    visibility: (p) => p.canReadServiceRequest,
  },
  {
    path: "/laboratory",
    textKey: "laboratory",
    visibility: (p) => p.canReadServiceRequest,
  },
];

const scheduleUrls: LocationUrl[] = [
  {
    path: "/schedule",
    textKey: "schedule",
    visibility: (p) => p.canViewSchedule,
  },
  {
    path: "/appointments",
    textKey: "view_appointments",
    visibility: (p) => p.canViewAppointments,
  },
  {
    path: "/queues",
    textKey: "queues",
    visibility: (p) => p.canListTokens,
  },
];

const candidatesByType: Record<string, LocationUrl[]> = {
  [InternalType.pharmacy]: pharmacyUrls,
  [InternalType.lab]: labUrls,
  [InternalType.scheduling]: scheduleUrls,
};

export function getLocationUrl(options: {
  facilityId: string;
  locationId: string;
  serviceType: InternalType | undefined;
  hasPermission: HasPermissionFn;
  locationPermissions: string[];
  facilityPermissions: string[];
}): LocationUrlResult | null {
  const {
    facilityId,
    locationId,
    serviceType,
    hasPermission,
    locationPermissions,
    facilityPermissions,
  } = options;

  console.log(locationPermissions, facilityPermissions);

  const perms = getPermissions(hasPermission, locationPermissions);
  const facilityPerms = getPermissions(hasPermission, facilityPermissions);

  const candidates = candidatesByType[serviceType ?? ""] ?? scheduleUrls;

  const baseUrl = `/facility/${facilityId}/locations/${locationId}`;

  for (const candidate of candidates) {
    if (candidate.visibility(perms, facilityPerms)) {
      return {
        url: `${baseUrl}${candidate.path}`,
        textKey: candidate.textKey,
      };
    }
  }

  return null;
}
