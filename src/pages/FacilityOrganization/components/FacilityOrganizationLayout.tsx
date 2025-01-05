import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationParent,
} from "@/types/facilityOrganization/facilityOrganization";

interface Props {
  id: string;
  children: React.ReactNode;
  facilityId: string;
}

interface NavItem {
  path: string;
  title: string;
  icon: IconName;
}

export default function FacilityOrganizationLayout({
  id,
  facilityId,
  children,
}: Props) {
  const path = usePath() || "";

  const navItems: NavItem[] = [
    {
      path: `/facility/${facilityId}/organization/${id}`,
      title: "Organizations",
      icon: "d-hospital",
    },
    {
      path: `/facility/${facilityId}/organization/${id}/users`,
      title: "Users",
      icon: "d-people",
    },
  ];

  const { data: org, isLoading } = useQuery<FacilityOrganization>({
    queryKey: ["facilityOrganization", id],
    queryFn: query(routes.facilityOrganization.get, {
      pathParams: { facilityId, organizationId: id },
    }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  // add loading state
  if (!org) {
    return <div>Not found</div>;
  }

  const orgParents: FacilityOrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <Page title={`${org.name} `} breadcrumbs={false}>
      {/* Since we have links to all parent organizations, we can show the breadcrumb here */}
      <Breadcrumb className="mt-1">
        <BreadcrumbList>
          {/* Org has parent and each parent may have another parent, so we need to show all the parents */}

          {orgParents.reverse().map((parent) => (
            <>
              <BreadcrumbItem key={parent.id}>
                <BreadcrumbLink
                  href={`/facility/${facilityId}/organization/${parent.id}`}
                >
                  {parent.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem key={`ellipsis-${parent.id}`}>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            </>
          ))}
          <BreadcrumbItem key={org.id}>
            <BreadcrumbLink asChild>
              <Link href={`/facility/${facilityId}/organization/${org.id}`}>
                {org.name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      {/* Navigation */}
      <div className="mt-4">
        <Menubar>
          {navItems.map((item) => (
            <MenubarMenu key={item.path}>
              <MenubarTrigger
                className={`${
                  path === item.path
                    ? "font-medium text-primary-700 bg-gray-100"
                    : "hover:text-primary-500 hover:bg-gray-100 text-gray-700"
                }`}
                asChild
              >
                <Link href={item.path} className="cursor-pointer">
                  <CareIcon icon={item.icon} className="mr-2 h-4 w-4" />
                  {item.title}
                </Link>
              </MenubarTrigger>
            </MenubarMenu>
          ))}
        </Menubar>
      </div>
      {/* Page Content */}
      <div className="mt-4">{children}</div>
    </Page>
  );
}
