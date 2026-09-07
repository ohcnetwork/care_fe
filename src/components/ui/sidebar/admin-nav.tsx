import { TFunction } from "i18next";
import {
  Blocks,
  Building2,
  ClipboardList,
  IdCard,
  ListOrdered,
  Settings2,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { useCareApps } from "@/hooks/useCareApps";

function generateAdminLinks(
  t: TFunction,
  pluginNavItems: NavigationLink[],
): NavigationLink[] {
  const baseUrl = "/admin";
  const links: NavigationLink[] = [
    {
      section: t("configuration"),
      name: t("questionnaire_other"),
      url: `${baseUrl}/questionnaires`,
      icon: <ClipboardList />,
    },
    {
      name: t("action_configurations"),
      url: `${baseUrl}/actions`,
      icon: <Settings2 />,
    },
    {
      name: t("admin_nav_valuesets"),
      url: `${baseUrl}/valuesets`,
      icon: <ListOrdered />,
    },
    {
      name: t("patient_identifier_config"),
      url: `${baseUrl}/patient_identifier_config`,
      icon: <IdCard />,
    },
    {
      name: t("admin_nav_tag_config"),
      url: `${baseUrl}/tag_config`,
      icon: <Tags />,
    },
    {
      section: t("administration"),
      name: t("admin_nav_rbac"),
      url: `${baseUrl}/rbac`,
      icon: <ShieldCheck />,
      children: [
        {
          name: t("permissions"),
          url: `${baseUrl}/rbac/permissions`,
        },
        {
          name: t("roles"),
          url: `${baseUrl}/rbac/roles`,
        },
      ],
    },
    {
      name: t("organizations"),
      url: `${baseUrl}/organizations`,
      icon: <Building2 />,
      children: [
        {
          name: t("admin_nav_governance"),
          url: `${baseUrl}/organizations/govt`,
        },
        {
          name: t("suppliers"),
          url: `${baseUrl}/organizations/product_supplier`,
        },
        {
          name: t("responsibilities"),
          url: `${baseUrl}/organizations/role`,
        },
      ],
    },
    {
      name: t("admin_nav_apps"),
      url: `${baseUrl}/apps`,
      icon: <Blocks />,
    },
    ...pluginNavItems.map((item, index) => ({
      ...item,
      section: index === 0 ? (item.section ?? null) : item.section,
    })),
  ];

  return links;
}

export function AdminNav() {
  const { t } = useTranslation();

  const careApps = useCareApps();
  const pluginNavItems = careApps.flatMap((c) =>
    !c.isLoading && c.adminNavItems ? c.adminNavItems : [],
  ) as NavigationLink[];

  return <NavMain links={generateAdminLinks(t, pluginNavItems)} />;
}
