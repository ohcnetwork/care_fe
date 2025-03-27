import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Menubar, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import OrganizationLayoutSkeleton from "@/pages/Organization/components/OrganizationLayoutSkeleton";
import {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface Props {
  // NavOrganizationId is used to show the organization switcher in the sidebar, it may not the parent organization
  navOrganizationId?: string;
  id: string;
  children: (props: { orgPermissions: string[] }) => React.ReactNode;
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    return <OrganizationLayoutSkeleton />;
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

  const visibleNavItems = navItems.filter((item) => item.visibility);
  const activeNavItem = visibleNavItems.find((item) => path === item.path);

  const orgParents: OrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <Page title={`${org.name}`}>
      {orgParents.length > 0 && (
        <div className="flex items-center gap-2 mt-4">
          <Breadcrumb>
            <BreadcrumbList>
              {orgParents.reverse().map((parent) => (
                <React.Fragment key={parent.id}>
                  <BreadcrumbItem>
                    <BreadcrumbLink
                      asChild
                      className="text-sm text-gray-900 hover:underline hover:underline-offset-2"
                    >
                      <Link href={path.replace(id, parent.id)}>
                        {parent.name}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem>
                    <BreadcrumbSeparator />
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
              <BreadcrumbItem key={org.id}>
                <span className="text-sm font-semibold text-gray-900">
                  {org.name}
                </span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="mt-4 min-w-0 hidden lg:block">
        <Menubar className="w-full h-full overflow-x-auto">
          {navItems
            .filter((item) => item.visibility)
            .map((item) => (
              <MenubarMenu key={item.path}>
                <MenubarTrigger
                  data-cy={`org-nav-${item.title.toLowerCase()}`}
                  className={`${
                    path === item.path
                      ? "font-medium text-primary-700 bg-gray-100"
                      : "hover:text-primary-500 hover:bg-gray-100 text-gray-700"
                  }`}
                  asChild
                >
                  <Link href={item.path} className="cursor-pointer">
                    <CareIcon icon={item.icon} className="mr-2 size-4" />
                    {item.title}
                  </Link>
                </MenubarTrigger>
              </MenubarMenu>
            ))}
        </Menubar>
      </div>

      {/* Mobile Navigation */}
      <div className="mt-4">
        <div className="block lg:hidden">
          <DropdownMenu
            open={isMobileMenuOpen}
            onOpenChange={setIsMobileMenuOpen}
          >
            <DropdownMenuTrigger asChild className="py-2">
              <Button
                variant="outline"
                className="w-full flex justify-between items-center py-3 px-4"
              >
                <div className="flex items-center py-2">
                  {activeNavItem && (
                    <CareIcon
                      icon={activeNavItem.icon}
                      className="mr-2 size-5"
                    />
                  )}
                  <span className="font-medium text-base">
                    {activeNavItem ? activeNavItem.title : t("navigation")}
                  </span>
                </div>
                <CareIcon
                  icon={isMobileMenuOpen ? "l-angle-up" : "l-angle-down"}
                  className="ml-2 size-4"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              sideOffset={5}
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              {visibleNavItems.map((item) => (
                <DropdownMenuItem
                  key={item.path}
                  className={cn(
                    "flex justify-between items-center py-3",
                    path === item.path
                      ? "font-medium text-primary-700 bg-gray-100"
                      : "text-gray-700",
                  )}
                  asChild
                >
                  <Link
                    href={item.path}
                    className="flex items-center w-full"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div className="flex items-center text-base">
                      <CareIcon icon={item.icon} className="mr-2 size-4" />
                      {item.title}
                    </div>
                    {path === item.path && (
                      <DropdownMenuCheckboxItem
                        checked
                        className="pointer-events-none pr-1"
                      />
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Page Content */}
      <div className="mt-4">
        {children({ orgPermissions: org.permissions })}
      </div>
    </Page>
  );
}
