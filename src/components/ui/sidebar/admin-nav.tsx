import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

function generateAdminLinks(
  t: TFunction,
  pluginNavItems: NavigationLink[],
): NavigationLink[] {
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
      name: "RBAC",
      url: `${baseUrl}/rbac`,
      icon: <CareIcon icon="l-shield-check" />,
      children: [
        {
          name: "Permissions",
          url: `${baseUrl}/rbac/permissions`,
        },
        {
          name: "Roles",
          url: `${baseUrl}/rbac/roles`,
        },
      ],
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
    ...pluginNavItems,
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();

  const careApps = useCareApps();
  const pluginNavItems = careApps
    .filter((c) => !!c.adminNavItems)
    .flatMap((c) => c.adminNavItems) as NavigationLink[];

  return <NavMain links={generateAdminLinks(t, pluginNavItems)} />;
}
