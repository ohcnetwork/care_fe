import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";
import { Skeleton } from "@/components/ui/skeleton";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  // NavOrganizationId is used to show the organization switcher in the sidebar, it may not the parent organization
  navOrganizationId?: string;
  id: string;
  children: React.ReactNode;
  setOrganization?: (org: Organization) => void;
}

interface NavItem {
  path: string;
  title: string;
  icon: IconName;
  visibility: boolean;
}

export default function OrganizationLayout({
  id,
  navOrganizationId,
  children,
  setOrganization,
}: Props) {
  const path = usePath() || "";
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();

  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}/children`
    : `/organization`;

  const { data: org, isLoading } = useQuery<Organization>({
    queryKey: ["organization", id],
    queryFn: query(organizationApi.get, {
      pathParams: { id },
    }),
    enabled: !!id,
  });

  useEffect(() => {
    if (org) {
      setOrganization?.(org);
    }
  }, [org, setOrganization]);

  if (isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex space-x-4 mb-4">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-8 w-24" />
          ))}
        </div>
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-8 w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-4">
                    <Skeleton className="h-6 w-1/2" />
                    <div className="flex space-x-4">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-1/3" />
                    </div>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <Skeleton className="h-6 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  // add loading state
  if (!org) {
    return <div>{t("organization_not_found")}</div>;
  }

  const navItems: NavItem[] = [
    {
      path: `${baseUrl}/${id}`,
      title: "Organizations",
      icon: "d-hospital",
      visibility: hasPermission("can_view_organization", org.permissions),
    },
    {
      path: `${baseUrl}/${id}/users`,
      title: "Users",
      icon: "d-people",
      visibility: hasPermission("can_list_organization_users", org.permissions),
    },
    {
      path: `${baseUrl}/${id}/patients`,
      title: "Patients",
      icon: "d-patient",
      visibility: hasPermission("can_list_patients", org.permissions),
    },
    {
      path: `${baseUrl}/${id}/facilities`,
      title: "Facilities",
      icon: "d-hospital",
      visibility: hasPermission("can_read_facility", org.permissions),
    },
  ];

  const orgParents: OrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <Page title={`${org.name}`} breadcrumbs={false}>
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
          {navItems
            .filter((item) => item.visibility)
            .map((item) => (
              <MenubarMenu key={item.path}>
                <MenubarTrigger
                  data-testid={`org-nav-${item.title.toLowerCase()}`}
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
