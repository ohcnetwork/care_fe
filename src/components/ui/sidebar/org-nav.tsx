import { NavigationLink, NavMain } from "@/components/ui/sidebar/nav-main";

import { Organization, OrgType } from "@/types/organization/organization";

function generateOrganizationLinks(
  organizations: Organization[],
): NavigationLink[] {
  // Only show govt organizations in the org sidebar nav
  return organizations
    .filter((org) => org.org_type === OrgType.GOVT)
    .map((org) => ({
      name: org.name,
      url: `/organization/${org.id}`,
    }));
}

export function OrgNav({ organizations }: { organizations: Organization[] }) {
  return <NavMain links={generateOrganizationLinks(organizations)} />;
}
