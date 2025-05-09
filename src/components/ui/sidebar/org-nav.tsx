import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { Organization } from "@/types/organization/organization";

interface OrgNavProps {
  organizations: Organization[];
}

function generateOrganizationLinks(
  organizations: Organization[],
): NavigationLink[] {
  return organizations.map((org) => ({
    name: org.name,
    url: `/organization/${org.id}`,
  }));
}

export function OrgNav({ organizations }: OrgNavProps) {
  return <NavMain links={generateOrganizationLinks(organizations)} />;
}
