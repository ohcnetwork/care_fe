import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

function generateAdminLinks(t: TFunction) {
  const baseUrl = "/admin";
  const links: NavigationLink[] = [
    {
      name: t("questionnaire_one"),
      url: `${baseUrl}/questionnaire`,
      icon: "d-book-open",
    },
    {
      name: "Valuesets",
      url: `${baseUrl}/valuesets`,
      icon: "l-list-ol-alt",
    },
    {
      name: "Roles",
      url: `${baseUrl}/roles`,
      icon: "d-people",
    },
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();
  return <NavMain links={generateAdminLinks(t)} />;
}
