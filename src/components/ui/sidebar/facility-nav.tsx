import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { UserFacilityModel, UserModel } from "@/components/Users/models";

import { conditionalArrayAttribute } from "@/Utils/utils";

interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
}

interface FacilityNavProps {
  selectedFacility: UserFacilityModel | null;
  user?: UserModel;
}

function generateFacilityLinks(
  selectedFacility: UserFacilityModel | null,
  t: TFunction,
  user?: UserModel,
) {
  if (!selectedFacility) return [];

  const baseUrl = `/facility/${selectedFacility.id}`;
  const links: NavigationLink[] = [
    { name: t("facility"), url: baseUrl, icon: "d-hospital" },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: "d-calendar",
    },
    {
      name: t("search_patients"),
      url: `${baseUrl}/patients`,
      icon: "d-patient",
    },
    { name: t("encounters"), url: `${baseUrl}/encounters`, icon: "d-patient" },
    { name: t("resource"), url: "/resource", icon: "d-book-open" },
    { name: t("users"), url: `${baseUrl}/users`, icon: "d-people" },
    ...conditionalArrayAttribute(!!user, [
      {
        name: t("my_schedules"),
        url: `${baseUrl}/users/${user?.username}/availability`,
        icon: "d-calendar",
      },
    ]),
    {
      name: t("settings"),
      url: `${baseUrl}/settings`,
      icon: "l-setting",
    },
  ];

  return links;
}

export function FacilityNav({ selectedFacility, user }: FacilityNavProps) {
  const { t } = useTranslation();
  return <NavMain links={generateFacilityLinks(selectedFacility, t, user)} />;
}
