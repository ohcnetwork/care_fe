import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { Organization, OrgType } from "@/types/organization/organization";
import { Building2 } from "lucide-react";
import { useTranslation } from "react-i18next";

function generateOrganizationLinks(
  organizations: Organization[],
): NavigationLink[] {
  // Only show govt organizations in the org sidebar nav
  return organizations
    .filter((org) => org.org_type === OrgType.GOVT)
    .map((org) => ({
      name: org.name,
      url: `/organization/${org.id}`,
      icon: <Building2 />,
    }));
}

export function OrgNav({ organizations }: { organizations: Organization[] }) {
  const { t } = useTranslation();
  return (
    <NavMain
      label={t("organizations")}
      links={generateOrganizationLinks(organizations)}
    />
  );
}
