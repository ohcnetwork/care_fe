import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { UserFacilityModel } from "@/components/Users/models";

interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
}

interface FacilityNavProps {
  selectedFacility: UserFacilityModel | null;
}

function generateFacilityLinks(
  selectedFacility: UserFacilityModel | null,
  t: TFunction,
) {
  if (!selectedFacility) return [];

  const baseUrl = `/facility/${selectedFacility.id}`;
  const links: NavigationLink[] = [
    { name: t("overview"), url: `${baseUrl}/overview`, icon: "d-hospital" },
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
    {
      name: t("encounters"),
      url: `${baseUrl}/encounters`,
      icon: "d-patient",
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
  return <NavMain links={generateFacilityLinks(selectedFacility, t)} />;
}
