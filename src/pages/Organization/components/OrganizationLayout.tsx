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

import query from "@/Utils/request/query";
import {
  Organization,
  OrganizationParent,
  getOrgLevel,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  // NavOrganizationId is used to show the organization switcher in the sidebar, it may not the parent organization
  navOrganizationId?: string;
  id: string;
  children: React.ReactNode;
}

interface NavItem {
  path: string;
  title: string;
  icon: IconName;
}

export default function OrganizationLayout({
  id,
  navOrganizationId,
  children,
}: Props) {
  const path = usePath() || "";

  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}/children`
    : `/organization`;
  const navItems: NavItem[] = [
    {
      path: `${baseUrl}/${id}`,
      title: "Organizations",
      icon: "d-hospital",
    },
    {
      path: `${baseUrl}/${id}/users`,
      title: "Users",
      icon: "d-people",
    },
    {
      path: `${baseUrl}/${id}/patients`,
      title: "Patients",
      icon: "d-patient",
    },
    {
      path: `${baseUrl}/${id}/facilities`,
      title: "Facilities",
      icon: "d-hospital",
    },
  ];

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: query(organizationApi.get, {
      pathParams: { id },
    }),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }
  // add loading state
  if (!org) {
    return <div>Not found</div>;
  }

  const orgParents: OrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <Page
      title={`${org.name} ${getOrgLevel(org.org_type, org.level_cache)}`}
      breadcrumbs={false}
    >
      {/* Since we have links to all parent organizations, we can show the breadcrumb here */}
      <Breadcrumb className="mt-1">
        <BreadcrumbList>
          {/* Org has parent and each parent may have another parent, so we need to show all the parents */}

          {orgParents.reverse().map((parent) => (
            <>
              <BreadcrumbItem key={parent.id}>
                <BreadcrumbLink href={`${baseUrl}/${parent.id}`}>
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
              <Link href={`${baseUrl}/${id}`}>{org.name}</Link>
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
