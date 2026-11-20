import { useQuery } from "@tanstack/react-query";
import { Link, usePath } from "raviger";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
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
import { NavigationLink } from "@/components/ui/sidebar/nav-main";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CareUIPageTitle } from "@/components/ui/typography";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import {
  hasResponsibilityUsersAccessViaNullRoleAssignment,
  useAccessibleRoleOrganizationsList,
} from "@/hooks/useAccessibleRoleOrganizationsList";
import { useCareApps } from "@/hooks/useCareApps";
import OrganizationLayoutSkeleton from "@/pages/Organization/components/OrganizationLayoutSkeleton";
import {
  Organization,
  OrganizationParent,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { Bot, GitPullRequestArrow, Settings2 } from "lucide-react";

export type RouteContext = "responsibility" | "organization";

interface Props {
  // NavOrganizationId is used to show the organization switcher in the sidebar, it may not the parent organization
  navOrganizationId?: string;
  id: string;
  children: (props: { orgPermissions: string[] }) => React.ReactNode;
  setOrganization?: (org: Organization) => void;
  routeContext?: RouteContext;
}

export default function OrganizationLayout({
  id,
  navOrganizationId,
  children,
  setOrganization,
  routeContext,
}: Props) {
  const path = usePath() || "";
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const careApps = useCareApps();
  const { data: accessibleRoleData } = useAccessibleRoleOrganizationsList();

  const organizationTabs = careApps.flatMap(
    (c) => (!c.isLoading && c.organizationTabs) || [],
  );

  const { data: org, isLoading } = useQuery({
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

  const isRoleOrg = org.org_type === OrgType.ROLE;

  // Determine route context from prop or org type
  const effectiveContext: RouteContext =
    routeContext || (isRoleOrg ? "responsibility" : "organization");

  const canShowUsersForNullRoleResponsibility =
    effectiveContext === "responsibility" &&
    hasResponsibilityUsersAccessViaNullRoleAssignment(
      id,
      accessibleRoleData?.results,
    );

  const baseUrl = navOrganizationId
    ? `/organization/${navOrganizationId}/children`
    : effectiveContext === "responsibility"
      ? `/responsibilities`
      : `/organization`;

  const navItems: NavigationLink[] = [
    {
      url: `${baseUrl}/${id}`,
      name: t("organizations"),
      icon: <CareIcon icon="d-hospital" />,
      // Role orgs are flat — no child organizations
      visibility:
        !isRoleOrg && hasPermission("can_view_organization", org.permissions),
    },
    {
      url: `${baseUrl}/${id}/users`,
      name: t("users"),
      icon: <CareIcon icon="d-people" />,
      visibility:
        hasPermission("can_list_organization_users", org.permissions) ||
        canShowUsersForNullRoleResponsibility,
    },
    {
      url: `${baseUrl}/${id}/patients`,
      name: t("patients"),
      icon: <CareIcon icon="d-people" />,
      visibility: hasPermission("can_list_patients", org.permissions),
    },
    {
      url: `${baseUrl}/${id}/referrals`,
      name: t("referrals"),
      icon: <GitPullRequestArrow className="size-4" />,
      visibility: hasPermission("can_read_referral", org.permissions),
    },
    {
      url: `${baseUrl}/${id}/settings/referrals`,
      name: t("referral_availability_settings"),
      icon: <Settings2 className="size-4" />,
      visibility: hasPermission(
        "can_manage_referral_availability",
        org.permissions,
      ),
    },
    {
      url: `${baseUrl}/${id}/facilities`,
      name: t("facilities"),
      icon: <CareIcon icon="d-hospital" />,
      visibility:
        org.org_type === OrgType.GOVT &&
        hasPermission("can_read_facility", org.permissions),
    },
    {
      url: `${baseUrl}/${id}/service_accounts`,
      name: t("service_accounts"),
      icon: <Bot className="size-4" />,
      // Role orgs don't have service accounts
      visibility:
        !isRoleOrg &&
        hasPermission("can_list_organization_users", org.permissions),
    },
    ...organizationTabs.map((tab) => ({
      url: `${baseUrl}/${id}/${tab.slug}`,
      name: tab.name,
      icon: tab.icon,
      visibility:
        org.org_type === OrgType.GOVT &&
        hasPermission("can_read_facility", org.permissions),
    })),
  ];

  const visibleNavItems = navItems.filter((item) => item.visibility);
  const currentPath = path.replace(/\/+$/, "");
  // /responsibilities/:id has no tab URL of its own; it renders the Users tab
  const activeNavItem =
    visibleNavItems.find((item) => currentPath === item.url) ??
    (effectiveContext === "responsibility" && currentPath === `${baseUrl}/${id}`
      ? visibleNavItems.find((item) => item.url === `${baseUrl}/${id}/users`)
      : undefined);
  const orgParents: OrganizationParent[] = [];
  let currentParent = org.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.unshift(currentParent);
    }
    currentParent = currentParent.parent;
  }

  const breadcrumbLinkClass =
    "inline-flex min-h-8 items-center rounded-sm underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <Page
      title={
        activeNavItem ? `${activeNavItem.name} · ${org.name}` : `${org.name}`
      }
      hideTitleOnPage
    >
      <CareUIPageTitle className="wrap-break-word">{org.name}</CareUIPageTitle>
      {orgParents.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList className="text-sm text-foreground">
            {orgParents.map((parent) => (
              <React.Fragment key={parent.id}>
                <BreadcrumbItem className="min-w-0">
                  <BreadcrumbLink asChild>
                    <Link
                      href={currentPath.replace(
                        `${baseUrl}/${id}`,
                        `${baseUrl}/${parent.id}`,
                      )}
                      className={breadcrumbLinkClass}
                    >
                      {parent.name}
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbPage className="font-medium text-foreground">
                {org.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Desktop Navigation — hide when only one tab visible */}
      {visibleNavItems.length > 1 && (
        <Tabs
          value={activeNavItem?.url ?? null}
          activationMode="manual"
          className="mt-2 hidden lg:flex"
        >
          <div className="min-w-0 max-w-full overflow-x-auto pb-1">
            <TabsList
              variant="line"
              className="w-full justify-start border-b border-border"
            >
              {visibleNavItems.map((item) => (
                <TabsTrigger key={item.url} value={item.url} asChild>
                  <Link href={item.url}>{item.name}</Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </Tabs>
      )}

      {/* Mobile Navigation */}
      {visibleNavItems.length > 1 && (
        <div>
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
                      <div className="mr-2 size-5">{activeNavItem.icon}</div>
                    )}
                    <span className="font-medium text-base">
                      {activeNavItem ? activeNavItem.name : t("navigation")}
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
                className="w-[var(--anchor-width)]"
              >
                {visibleNavItems.map((item) => (
                  <DropdownMenuItem
                    key={item.url}
                    className={cn(
                      "flex justify-between items-center py-3",
                      activeNavItem?.url === item.url
                        ? "font-medium text-primary-700 bg-gray-100"
                        : "text-gray-700",
                    )}
                    asChild
                  >
                    <Link
                      href={item.url}
                      className="flex items-center w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center text-base">
                        <div className="mr-2">{item.icon}</div>
                        {item.name}
                      </div>
                      {activeNavItem?.url === item.url && (
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
      )}

      {/* Page Content */}
      <div className="mt-4">
        {children({ orgPermissions: org.permissions })}
      </div>
    </Page>
  );
}
