import { TFunction } from "i18next";
import {
  Box,
  CalendarDays,
  CreditCard,
  House,
  Package,
  Search,
  Settings2,
  UserCog,
  Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { FacilityBareMinimum } from "@/types/facility/facility";
import careConfig from "@careConfig";

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
  },
  pluginLinks: NavigationLink[],
  pluginBillingLinks: NavigationLink[],
) {
  if (!selectedFacility) return [];

  const encounterClasses = careConfig.encounterClasses;

  const baseUrl = `/facility/${selectedFacility.id}`;

  const links: NavigationLink[] = [
    {
      name: t("overview"),
      url: `${baseUrl}/overview`,
      icon: <House />,
    },
    {
      section: t("patient_management"),
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: <CalendarDays />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("queues"),
      url: `${baseUrl}/queues`,
      icon: <Users />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("patients"),
      url: `${baseUrl}/patients`,
      icon: <Search />,
      visibility:
        permissions.canWriteAppointment ||
        permissions.canListEncounters ||
        permissions.canCreateEncounter,
      children: [
        {
          name: t("search_patients"),
          url: `${baseUrl}/patients`,
        },
        {
          name: t("all_encounters"),
          url: `${baseUrl}/encounters/patients/all`,
          visibility: encounterClasses.length > 1,
        },
        ...encounterClasses.map((encounterClass) => ({
          name: t(`encounter_class_encounters`, {
            encounterClassName: t(`encounter_class__${encounterClass}`),
          }),
          url: `${baseUrl}/encounters/patients/${encounterClass}`,
        })),
        {
          name: t("locations"),
          url: `${baseUrl}/encounters/locations`,
        },
      ],
    },
    {
      section: t("services"),
      name: t("services"),
      url: `${baseUrl}/services`,
      icon: <Package />,
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: <Box />,
    },
    {
      section: t("administration"),
      name: t("users"),
      url: `${baseUrl}/users`,
      icon: <UserCog />,
    },
    {
      name: t("billing"),
      url: `${baseUrl}/billing`,
      icon: <CreditCard />,
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
      icon: <Settings2 />,
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
  } = getPermissions(hasPermission, facility?.permissions ?? []);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
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
