import { useQuery } from "@tanstack/react-query";
import { TFunction } from "i18next";
import { usePath } from "raviger";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { UserFacilityModel } from "@/components/Users/models";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";

export interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
  visibility?: boolean;
  children?: NavigationLink[];
}

interface FacilityNavProps {
  selectedFacility: UserFacilityModel | null;
}

function generateFacilityLinks(
  selectedFacility: UserFacilityModel | null,
  t: TFunction,
  permissions: {
    canViewAppointments: boolean;
    canListEncounters: boolean;
    canCreateAppointment: boolean;
    canCreateEncounter: boolean;
    canViewEncounter: boolean;
  },
  patientId?: string,
  encounterId?: string,
) {
  if (!selectedFacility) return [];

  const baseUrl = `/facility/${selectedFacility.id}`;
  const links: NavigationLink[] = [
    { name: t("overview"), url: `${baseUrl}/overview`, icon: "d-hospital" },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: "d-calendar",
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("patients"),
      url: `${baseUrl}/patient/${patientId}`,
      icon: "d-patient",
      visibility:
        permissions.canCreateAppointment ||
        permissions.canListEncounters ||
        permissions.canCreateEncounter,
      children: [
        {
          name: t("search_patients"),
          url: `${baseUrl}/patients`,
        },
        {
          name: t("encounters"),
          url: `${baseUrl}/encounters/patients`,
          children: [
            patientId && encounterId
              ? {
                  name: t("encounter"),
                  url: `${baseUrl}/patient/${patientId}/encounter/${encounterId}`,
                }
              : null,
          ].filter(Boolean) as NavigationLink[],
        },
        {
          name: t("locations"),
          url: `${baseUrl}/encounters/locations`,
        },
      ],
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: "d-book-open",
    },
    { name: t("users"), url: `${baseUrl}/users`, icon: "d-people" },
    {
      name: t("settings"),
      url: `${baseUrl}/settings/general`,
      icon: "l-setting",
      children: [
        {
          name: t("general"),
          url: `${baseUrl}/settings/general`,
        },
        {
          name: t("departments"),
          url: `${baseUrl}/settings/departments`,
        },
        {
          name: t("locations"),
          url: `${baseUrl}/settings/locations`,
        },
        {
          name: t("devices"),
          url: `${baseUrl}/settings/devices`,
        },
      ],
    },
  ];

  return links;
}

export function FacilityNav({ selectedFacility }: FacilityNavProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const currentPath = usePath();

  const pathMatch = currentPath?.match(
    /\/facility\/[^/]+\/patient\/([^/]+)(?:\/encounter\/([^/]+))?/,
  );
  const patientId = pathMatch?.[1];
  const encounterId = pathMatch?.[2];

  const { data: facilityData } = useQuery({
    queryKey: ["facility", selectedFacility?.id],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: selectedFacility?.id ?? "" },
    }),
    enabled: !!selectedFacility?.id,
  });

  const {
    canViewAppointments,
    canListEncounters,
    canCreateAppointment,
    canCreateEncounter,
    canViewEncounter,
  } = getPermissions(hasPermission, facilityData?.permissions ?? []);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canCreateAppointment,
    canCreateEncounter,
    canViewEncounter,
  };
  return (
    <NavMain
      links={generateFacilityLinks(
        selectedFacility,
        t,
        permissions,
        patientId,
        encounterId,
      )}
    />
  );
}
