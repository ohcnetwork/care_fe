import { useQuery } from "@tanstack/react-query";
import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { UserFacilityModel } from "@/components/Users/models";

import { useCareApps } from "@/hooks/useCareApps";

import { getPermissions } from "@/common/Permissions";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";

export interface NavigationLink {
  name: string;
  url: string;
  icon?: React.ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
  key?: string;
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
  pluginLinks: NavigationLink[],
) {
  if (!selectedFacility) return [];

  const baseUrl = `/facility/${selectedFacility.id}`;
  const links: NavigationLink[] = [
    {
      key: "overview",
      name: t("overview"),
      url: `${baseUrl}/overview`,
      icon: <CareIcon icon="d-hospital" />,
    },
    {
      key: "appointments",
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: <CareIcon icon="d-calendar" />,
      visibility: permissions.canViewAppointments,
    },
    {
      key: "patients",
      name: t("patients"),
      url: `${baseUrl}/patients`,
      icon: <CareIcon icon="d-patient" />,
      visibility:
        permissions.canCreateAppointment ||
        permissions.canListEncounters ||
        permissions.canCreateEncounter,
      children: [
        {
          key: "search_patients",
          name: t("search_patients"),
          url: `${baseUrl}/patients/search`,
        },
        {
          key: "encounters",
          name: t("encounters"),
          url: `${baseUrl}/encounters/patients`,
        },
        {
          key: "locations",
          name: t("locations"),
          url: `${baseUrl}/encounters/locations`,
        },
      ],
    },
    {
      key: "resource",
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: <CareIcon icon="d-book-open" />,
    },
    {
      key: "users",
      name: t("users"),
      url: `${baseUrl}/users`,
      icon: <CareIcon icon="d-people" />,
    },
    {
      key: "settings",
      name: t("settings"),
      url: `${baseUrl}/settings/general`,
      icon: <CareIcon icon="l-setting" />,
      children: [
        {
          key: "general",
          name: t("general"),
          url: `${baseUrl}/settings/general`,
        },
        {
          key: "departments",
          name: t("departments"),
          url: `${baseUrl}/settings/departments`,
        },
        {
          key: "locations",
          name: t("locations"),
          url: `${baseUrl}/settings/locations`,
        },
        {
          key: "devices",
          name: t("devices"),
          url: `${baseUrl}/settings/devices`,
        },
        {
          key: "report builder",
          name: t("report_builder"),
          url: `${baseUrl}/settings/reportbuilder/`,
        },
      ],
    },
  ];

  return [
    ...links,
    ...pluginLinks.map((l) => ({
      ...l,
      url: `${baseUrl}/${l.url}`,
    })),
  ];
}

export function FacilityNav({ selectedFacility }: FacilityNavProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const careApps = useCareApps();
  const pluginNavItems = careApps
    .filter((c) => !!c.navItems)
    .flatMap((c) => c.navItems) as NavigationLink[];

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
        pluginNavItems,
      )}
    />
  );
}
