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
import { Logs } from "lucide-react";

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
    canListTokenCategories: boolean;
    canListTemplate: boolean;
    canReadHealthcareService: boolean;
    canReadResourceCategory: boolean;
    canReadAccount: boolean;
    canReadInvoice: boolean;
    canReadPaymentReconciliation: boolean;
    canViewFacilityOrganizations: boolean;
    canListFacilityLocations: boolean;
    canListDevices: boolean;
    canReadSpecimenDefinition: boolean;
    canReadObservationDefinition: boolean;
    canReadActivityDefinition: boolean;
    canReadChargeItemDefinition: boolean;
    canReadProductKnowledge: boolean;
    canReadProduct: boolean;
    canReadTagConfig: boolean;
    canUpdateFacility: boolean;
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
      icon: <CareIcon icon="d-hospital" />,
    },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: <CareIcon icon="d-calendar" />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("queues"),
      url: `${baseUrl}/queues`,
      icon: <Logs />,
      visibility: permissions.canViewAppointments,
    },
    {
      name: t("patients"),
      url: `${baseUrl}/patients`,
      icon: <CareIcon icon="d-patient" />,
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
      name: t("services"),
      url: `${baseUrl}/services`,
      icon: <CareIcon icon="d-microscope" />,
      visibility: permissions.canReadHealthcareService,
    },
    {
      name: t("resource"),
      url: `${baseUrl}/resource`,
      icon: <CareIcon icon="d-book-open" />,
      visibility: permissions.canReadResourceCategory,
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
          url: `${baseUrl}/billing/account`,
          visibility: permissions.canReadAccount,
        },
        {
          name: t("invoices"),
          url: `${baseUrl}/billing/invoices`,
          visibility: permissions.canReadInvoice,
        },
        {
          name: t("payments"),
          url: `${baseUrl}/billing/payments`,
          visibility: permissions.canReadPaymentReconciliation,
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
      icon: <CareIcon icon="l-setting" />,
      children: [
        {
          name: t("general"),
          url: `${baseUrl}/settings/general`,
          visibility: permissions.canUpdateFacility,
        },
        {
          name: t("departments"),
          url: `${baseUrl}/settings/departments`,
          visibility: permissions.canViewFacilityOrganizations,
        },
        {
          name: t("locations"),
          url: `${baseUrl}/settings/locations`,
          visibility: permissions.canListFacilityLocations,
        },
        {
          name: t("devices"),
          url: `${baseUrl}/settings/devices`,
          visibility: permissions.canListDevices,
        },
        {
          name: t("specimen_definitions"),
          url: `${baseUrl}/settings/specimen_definitions`,
          visibility: permissions.canReadSpecimenDefinition,
        },
        {
          name: t("observation_definitions"),
          url: `${baseUrl}/settings/observation_definitions`,
          visibility: permissions.canReadObservationDefinition,
        },
        {
          name: t("activity_definitions"),
          url: `${baseUrl}/settings/activity_definitions`,
          visibility: permissions.canReadActivityDefinition,
        },
        {
          name: t("billing"),
          url: `${baseUrl}/settings/billing`,
          visibility: permissions.canReadChargeItemDefinition,
        },
        {
          name: t("charge_item_definitions"),
          url: `${baseUrl}/settings/charge_item_definitions`,
          visibility: permissions.canReadChargeItemDefinition,
        },
        {
          name: t("healthcare_services"),
          url: `${baseUrl}/settings/healthcare_services`,
          visibility: permissions.canReadHealthcareService,
        },
        {
          name: t("product_knowledge"),
          url: `${baseUrl}/settings/product_knowledge`,
          visibility: permissions.canReadProductKnowledge,
        },
        {
          name: t("product"),
          url: `${baseUrl}/settings/product`,
          visibility: permissions.canReadProduct,
        },
        {
          name: t("token_category"),
          url: `${baseUrl}/settings/token_category`,
          visibility: permissions.canListTokenCategories,
        },
        // {
        //   name: t("patient_identifier_config"),
        //   url: `${baseUrl}/settings/patient_identifier_config`,
        // },
        {
          name: t("tag_config"),
          url: `${baseUrl}/settings/tag_config`,
          visibility: permissions.canReadTagConfig,
        },
        {
          name: t("templates"),
          url: `${baseUrl}/template`,
          visibility: permissions.canListTemplate,
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
    canListTokenCategories,
    canListTemplate,
    canReadHealthcareService,
    canReadResourceCategory,
    canReadAccount,
    canReadInvoice,
    canReadPaymentReconciliation,
    canViewFacilityOrganizations,
    canListFacilityLocations,
    canListDevices,
    canReadSpecimenDefinition,
    canReadObservationDefinition,
    canReadActivityDefinition,
    canReadChargeItemDefinition,
    canReadProductKnowledge,
    canReadProduct,
    canReadTagConfig,
    canUpdateFacility,
  } = getPermissions(hasPermission, facility?.permissions ?? []);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canWriteAppointment,
    canCreateEncounter,
    canReadEncounter,
    canListTokenCategories,
    canListTemplate,
    canReadHealthcareService,
    canReadResourceCategory,
    canReadAccount,
    canReadInvoice,
    canReadPaymentReconciliation,
    canViewFacilityOrganizations,
    canListFacilityLocations,
    canListDevices,
    canReadSpecimenDefinition,
    canReadObservationDefinition,
    canReadActivityDefinition,
    canReadChargeItemDefinition,
    canReadProductKnowledge,
    canReadProduct,
    canReadTagConfig,
    canUpdateFacility,
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
