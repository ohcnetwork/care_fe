import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { EncounterNavItem } from "@/components/ui/sidebar/facility/encounter-nav-item";
import { FacilitySidebarIcon } from "@/components/ui/sidebar/facility/facility-sidebar-icon";
import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityBareMinimum } from "@/types/facility/facility";

interface FacilityNavProps {
  selectedFacility: FacilityBareMinimum | null;
}

function generateFacilityLinks(
  selectedFacility: FacilityBareMinimum | null,
  t: TFunction,
  permissions: {
    canViewAppointments: boolean;
    canListEncounters: boolean;
    canWriteAppointment: boolean;
    canCreateEncounter: boolean;
    canReadEncounter: boolean;
    canReadReferral: boolean;
  },
  pluginLinks: NavigationLink[],
  pluginBillingLinks: NavigationLink[],
) {
  if (!selectedFacility) return [];

  const canAccessEncounters =
    permissions.canWriteAppointment ||
    permissions.canListEncounters ||
    permissions.canCreateEncounter;

  const baseUrl = `/facility/${selectedFacility.id}`;

  const links: NavigationLink[] = [
    {
      name: t("overview"),
      url: `${baseUrl}/overview`,
      icon: <FacilitySidebarIcon name="overview" />,
    },
    {
      section: t("patient_management"),
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: <FacilitySidebarIcon name="calendarCheck" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("queues"),
      url: `${baseUrl}/queues`,
      icon: <FacilitySidebarIcon name="queues" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("search_patients"),
      url: `${baseUrl}/patients`,
      icon: <FacilitySidebarIcon name="patients" />,
      visibility: canAccessEncounters,
    },
    {
      section: t("encounters_and_locations"),
      name: t("encounters"),
      url: `${baseUrl}/encounters/patients`,
      visibility: canAccessEncounters,
      element: <EncounterNavItem facilityId={selectedFacility.id} />,
    },
    {
      name: t("search_by_location"),
      url: `${baseUrl}/encounters/locations`,
      icon: <FacilitySidebarIcon name="locations" />,
      visibility: canAccessEncounters,
    },
    {
      section: t("services"),
      name: t("services"),
      url: `${baseUrl}/services`,
      icon: <FacilitySidebarIcon name="services" />,
    },
    {
      name: t("referrals"),
      url: `${baseUrl}/referrals`,
      icon: <FacilitySidebarIcon name="referrals" />,
      visibility: permissions.canReadReferral,
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: <FacilitySidebarIcon name="resources" />,
    },
    {
      section: t("administration"),
      name: t("users"),
      url: `${baseUrl}/users`,
      icon: <FacilitySidebarIcon name="users" />,
    },
    {
      name: t("billing"),
      url: `${baseUrl}/billing`,
      icon: <FacilitySidebarIcon name="billing" />,
      children: [
        {
          name: t("accounts"),
          url: `${baseUrl}/billing/account`,
        },
        {
          name: t("invoices"),
          url: `${baseUrl}/billing/invoices`,
        },
        {
          name: t("payments"),
          url: `${baseUrl}/billing/payments`,
        },
        ...pluginBillingLinks.map((l) => ({
          ...l,
          url: `${baseUrl}${l.url}`,
        })),
      ],
    },
    {
      name: t("settings"),
      url: `${baseUrl}/settings/general`,
      icon: <FacilitySidebarIcon name="settings" />,
    },
  ];

  return [
    ...links,
    ...pluginLinks.map((l, index) => ({
      ...l,
      section: index === 0 ? (l.section ?? null) : l.section,
      url: `${baseUrl}/${l.url}`,
    })),
  ];
}

export function FacilityNav({ selectedFacility }: FacilityNavProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const careApps = useCareApps();
  const pluginNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.navItems ? c.navItems : [],
  ) as NavigationLink[];

  const pluginBillingNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.billingNavItems ? c.billingNavItems : [],
  ) as NavigationLink[];

  const { facility } = useCurrentFacility();

  const {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
    canReadReferral,
  } = getPermissions(hasPermission, facility?.permissions ?? []);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
    canReadReferral,
  };
  return (
    <NavMain
      links={generateFacilityLinks(
        selectedFacility,
        t,
        permissions,
        pluginNavItems,
        pluginBillingNavItems,
      )}
    />
  );
}
