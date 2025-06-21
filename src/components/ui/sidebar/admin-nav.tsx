import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain } from "@/components/ui/sidebar/nav-main";

import { NavigationLink } from "./facility-nav";

function generateAdminLinks(t: TFunction) {
  const baseUrl = "/admin";
  const links: NavigationLink[] = [
    {
      name: t("questionnaire_one"),
      url: `${baseUrl}/questionnaire`,
      icon: <CareIcon icon="d-book-open" />,
    },
    {
      name: "Valuesets",
      url: `${baseUrl}/valuesets`,
      icon: <CareIcon icon="l-list-ol-alt" />,
    },
    {
      name: "Roles",
      url: `${baseUrl}/roles`,
      icon: <CareIcon icon="d-people" />,
    },
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();
  return <NavMain links={generateAdminLinks(t)} />;
}
