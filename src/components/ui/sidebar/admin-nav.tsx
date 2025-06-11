import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

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
      name: "Patient Identifier Config",
      url: `${baseUrl}/patient_identifier_config`,
      icon: <CareIcon icon="l-setting" />,
    },
    {
      name: "Tag Config",
      url: `${baseUrl}/tag_config`,
      icon: <CareIcon icon="l-tag-alt" />,
    },
    {
      name: "Roles",
      url: `${baseUrl}/roles`,
      icon: <CareIcon icon="d-people" />,
    },
    {
      name: "Organizations",
      url: `${baseUrl}/organizations`,
      icon: <CareIcon icon="l-building" />,
      children: [
        {
          name: "Governance",
          url: `${baseUrl}/organizations/govt`,
        },
        {
          name: "Suppliers",
          url: `${baseUrl}/organizations/product_supplier`,
        },
        {
          name: "Roles",
          url: `${baseUrl}/organizations/role`,
        },
      ],
    },
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();
  return <NavMain links={generateAdminLinks(t)} />;
}
