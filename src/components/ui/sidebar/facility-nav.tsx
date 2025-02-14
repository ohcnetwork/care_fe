import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { UserFacilityModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { usePermissions } from "@/context/PermissionContext";

interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
  visibility?: boolean;
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
      name: t("search_patients"),
      url: `${baseUrl}/patients`,
      icon: "d-patient",
      visibility:
        permissions.canCreateAppointment ||
        permissions.canListEncounters ||
        permissions.canCreateEncounter,
    },
    {
      name: t("encounters"),
      url: `${baseUrl}/encounters`,
      icon: "d-patient",
      visibility: permissions.canListEncounters,
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
    },
  ];

  return links;
}

export function FacilityNav({ selectedFacility }: FacilityNavProps) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { hasPermission } = usePermissions();

  const {
    canViewAppointments,
    canListEncounters,
    canCreateAppointment,
    canCreateEncounter,
    canViewEncounter,
  } = getPermissions(hasPermission, authUser.permissions);
  const permissions = {
    canViewAppointments,
    canListEncounters,
    canCreateAppointment,
    canCreateEncounter,
    canViewEncounter,
  };
  return (
    <NavMain links={generateFacilityLinks(selectedFacility, t, permissions)} />
  );
}
