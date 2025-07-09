import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { Organization } from "@/types/organization/organization";

function generateOrganizationLinks(
  organizations: Organization[],
): NavigationLink[] {
  return organizations.map((org) => ({
    name: org.name,
    url: `/organization/${org.id}`,
  }));
}

export function OrgNav({ organizations }: { organizations: Organization[] }) {
  return <NavMain links={generateOrganizationLinks(organizations)} />;
}
