import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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
    canCreateAppointment: boolean;
    canCreateEncounter: boolean;
    canViewEncounter: boolean;
  },
  pluginLinks: NavigationLink[],
) {
  if (!selectedFacility) return [];

  const encounterClasses = careConfig.encounterClasses;

  const baseUrl = `/facility/${selectedFacility.id}`;

  const links: NavigationLink[] = [
    {
      name: t("overview"),
      url: `${baseUrl}/overview`,
      icon: <CareIcon icon="d-hospital" />,
    },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: <CareIcon icon="d-calendar" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("patients"),
      url: `${baseUrl}/patients`,
      icon: <CareIcon icon="d-patient" />,
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
      name: t("services"),
      url: `${baseUrl}/services`,
      icon: <CareIcon icon="d-microscope" />,
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: <CareIcon icon="d-book-open" />,
    },
    {
      name: t("users"),
      url: `${baseUrl}/users`,
      icon: <CareIcon icon="d-people" />,
    },
    {
      name: t("billing"),
      url: `${baseUrl}/billing`,
      icon: <CareIcon icon="d-notice-board" />,
      children: [
        {
          name: t("accounts"),
          url: `${baseUrl}/billing/accounts`,
        },
        {
          name: t("invoices"),
          url: `${baseUrl}/billing/invoices`,
        },
        {
          name: t("payments"),
          url: `${baseUrl}/billing/payments`,
        },
      ],
    },
    {
      name: t("settings"),
      url: `${baseUrl}/settings/general`,
      icon: <CareIcon icon="l-setting" />,
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
        {
          name: t("specimen_definitions"),
          url: `${baseUrl}/settings/specimen_definitions`,
        },
        {
          name: t("observation_definitions"),
          url: `${baseUrl}/settings/observation_definitions`,
        },
        {
          name: t("activity_definitions"),
          url: `${baseUrl}/settings/activity_definitions`,
        },
        {
          name: t("billing"),
          url: `${baseUrl}/settings/billing/discount_codes`,
        },
        {
          name: t("charge_item_definitions"),
          url: `${baseUrl}/settings/charge_item_definitions`,
        },
        {
          name: t("healthcare_services"),
          url: `${baseUrl}/settings/healthcare_services`,
        },
        {
          name: t("product_knowledge"),
          url: `${baseUrl}/settings/product_knowledge`,
        },
        {
          name: t("product"),
          url: `${baseUrl}/settings/product`,
        },
        // {
        //   name: t("patient_identifier_config"),
        //   url: `${baseUrl}/settings/patient_identifier_config`,
        // },
        // {
        //   name: t("tag_config"),
        //   url: `${baseUrl}/settings/tag_config`,
        // },
        // {
        //   name: t("report_builder"),
        //   url: `${baseUrl}/settings/report_builder/`,
        // },
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

  const { facility } = useCurrentFacility();

  const {
    canViewAppointments,
    canListEncounters,
    canCreateAppointment,
    canCreateEncounter,
    canViewEncounter,
  } = getPermissions(hasPermission, facility?.permissions ?? []);
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
