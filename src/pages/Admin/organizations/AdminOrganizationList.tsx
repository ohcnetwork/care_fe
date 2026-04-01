import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { navigate } from "raviger";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { OrgSelect } from "@/components/Common/OrgSelect";
import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import AdminOrganizationNavbar from "@/pages/Admin/organizations/components/AdminOrganizationNavbar";
import RoleOrganizationConnections from "@/pages/Organization/components/RoleOrganizationConnections";
import {
  Organization,
  OrganizationParent,
  OrgType,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import AdminOrganizationView from "./AdminOrganizationView";
import AdminOrganizationFormSheet from "./components/AdminOrganizationFormSheet";

interface Props {
  organizationId?: string;
  organizationType: string;
}

/** Org types that are flat (no hierarchy) and use sidebar layout */
const FLAT_ORG_TYPES = new Set<string>([
  OrgType.ROLE,
  OrgType.PRODUCT_SUPPLIER,
]);

export default function AdminOrganizationList({
  organizationId,
  organizationType,
}: Props) {
  const { t } = useTranslation();
  const isFlatOrgType = FLAT_ORG_TYPES.has(organizationType);
  const isRoleOrg = organizationType === OrgType.ROLE;
  const [expandedOrganizations, setExpandedOrganizations] = useState<
    Set<string>
  >(new Set([]));

  const { data: org } = useQuery({
    queryKey: ["organization", organizationType, organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId! },
      queryParams: { org_type: organizationType },
    }),
    enabled: !!organizationId,
  });

  const handleOrganizationSelect = useCallback(
    (organization: Organization) => {
      navigate(`/admin/organizations/${organizationType}/${organization.id}`);
    },
    [organizationType],
  );

  const handleToggleExpand = useCallback((orgId: string) => {
    setExpandedOrganizations((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) {
        next.delete(orgId);
      } else {
        next.add(orgId);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (org?.parent?.id) {
      setExpandedOrganizations((prev) => {
        const next = new Set(prev);
        let currentParent = org.parent;
        while (currentParent?.id) {
          next.add(currentParent.id);
          currentParent = currentParent.parent;
        }
        return next;
      });
    }
  }, [org?.parent]);

  const handleParentClick = useCallback(
    (parentId: string) => {
      navigate(`/admin/organizations/${organizationType}/${parentId}`);
    },
    [organizationType],
  );

  // Flat org types (role, supplier): sidebar list + detail panel
  if (isFlatOrgType) {
    return (
      <Page title={t(organizationType)} hideTitleOnPage className="p-0">
        <div className="container mx-auto space-y-4">
          <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isRoleOrg
                  ? t("role_organizations_admin_title")
                  : t("suppliers")}
              </h3>
              <p className="text-sm text-gray-500">
                {isRoleOrg
                  ? t("role_organizations_admin_description")
                  : t("manage_suppliers_description")}
              </p>
            </div>
            <AdminOrganizationFormSheet organizationType={organizationType} />
          </div>

          {/* Mobile org selector */}
          <div className="md:hidden">
            <OrgSelect
              value={organizationId}
              onChange={(selectedOrg) => {
                if (selectedOrg) handleOrganizationSelect(selectedOrg);
              }}
              orgType={organizationType as OrgType}
              placeholder={
                isRoleOrg
                  ? t("select_role_organization")
                  : t("select_organization")
              }
              inputPlaceholder={t("search")}
            />
          </div>

          <ResizablePanelGroup
            direction="horizontal"
            className="min-h-[calc(100vh-14rem)] rounded-lg"
          >
            <ResizablePanel
              defaultSize={25}
              minSize={18}
              maxSize={35}
              className="h-full hidden md:block"
            >
              <FlatOrgSidebar
                organizationType={organizationType}
                selectedOrganizationId={organizationId || null}
                onSelect={handleOrganizationSelect}
              />
            </ResizablePanel>

            <ResizableHandle
              withHandle
              className="hidden md:flex items-center justify-center"
            />

            <ResizablePanel defaultSize={75} className="pl-0 md:pl-4">
              <div className="h-full rounded-lg bg-white md:shadow-lg">
                {organizationId && org ? (
                  <div className="space-y-6 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          {org.name}
                        </h2>
                        {org.description && (
                          <p className="mt-1 max-w-2xl text-sm text-gray-500">
                            {org.description}
                          </p>
                        )}
                      </div>
                      <AdminOrganizationFormSheet
                        organizationType={organizationType}
                        org={org}
                      />
                    </div>
                    {/* Role orgs show connections; suppliers just show the org info */}
                    {isRoleOrg && (
                      <RoleOrganizationConnections organization={org} />
                    )}
                  </div>
                ) : (
                  <div className="flex h-full items-center justify-center p-8">
                    <p className="text-sm text-gray-400">
                      {t("select_organization_prompt_description")}
                    </p>
                  </div>
                )}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Page>
    );
  }

  // Hierarchical org types (govt, team): tree sidebar + detail panel
  const orgParents: OrganizationParent[] = [];
  let currentParent = org?.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <Page title={t(organizationType)} hideTitleOnPage className="p-0">
      <div className="container mx-auto space-y-4">
        <div className="mb-2 flex flex-col items-start justify-between sm:mb-4 sm:flex-row">
          <h3>{t(organizationType)}</h3>
        </div>

        <ResizablePanelGroup
          direction="horizontal"
          className="min-h-[calc(100vh-14rem)] rounded-lg"
        >
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className="h-full hidden md:block"
          >
            <AdminOrganizationNavbar
              organizationType={organizationType}
              selectedOrganizationId={organizationId || null}
              expandedOrganizations={expandedOrganizations}
              onToggleExpand={handleToggleExpand}
              onOrganizationSelect={handleOrganizationSelect}
            />
          </ResizablePanel>

          <ResizableHandle
            withHandle
            className="hidden md:flex items-center justify-center"
          />

          <ResizablePanel defaultSize={80} className="pl-0 md:pl-4">
            <div className="space-y-3 overflow-hidden rounded-lg md:bg-white md:shadow-lg sm:space-y-4">
              {organizationId && (
                <div className="md:pt-4 flex items-center mx-auto max-w-4xl">
                  <Breadcrumb className="md:px-5 md:pt-5">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          asChild
                          className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                          onClick={() =>
                            navigate(`/admin/organizations/${organizationType}`)
                          }
                        >
                          <button type="button">{t("organizations")}</button>
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      {orgParents.reverse().map((parent) => (
                        <React.Fragment key={parent.id}>
                          <BreadcrumbItem>
                            <BreadcrumbLink
                              asChild
                              className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                              onClick={() => handleParentClick(parent.id)}
                            >
                              <button type="button">{parent.name}</button>
                            </BreadcrumbLink>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                        </React.Fragment>
                      ))}
                      <BreadcrumbItem key={org?.id}>
                        <span className="font-semibold text-gray-900">
                          {org?.name}
                        </span>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              )}
              <Page
                hideTitleOnPage
                title={org?.name || ""}
                className={cn("mx-auto", "max-w-4xl")}
              >
                {organizationId && org && (
                  <>
                    <div className="flex items-center">
                      <h2 className="text-xl font-semibold">{org.name}</h2>
                    </div>
                    <div className="mt-2">
                      {org.description && (
                        <p className="text-sm text-gray-500 break-all whitespace-normal">
                          {org.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
                <div className="mt-4">
                  <AdminOrganizationView
                    id={organizationId}
                    organizationType={organizationType}
                  />
                </div>
              </Page>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </Page>
  );
}

/** Flat sidebar list for role organizations and suppliers */
function FlatOrgSidebar({
  organizationType,
  selectedOrganizationId,
  onSelect,
}: {
  organizationType: string;
  selectedOrganizationId: string | null;
  onSelect: (org: Organization) => void;
}) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: allOrganizations,
    isLoading,
    isFetching,
  } = useQuery({
    queryKey: ["organization", "list", organizationType, searchTerm],
    queryFn: query.debounced(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: organizationType,
        name: searchTerm || undefined,
        limit: 100,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const filtered = (allOrganizations?.results || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-white shadow-lg">
      <div className="border-b border-gray-100 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search")}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading || (isFetching && filtered.length === 0) ? (
            <div className="space-y-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-md" />
              ))}
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-0.5">
              {filtered.map((org) => {
                const isSelected = org.id === selectedOrganizationId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => onSelect(org)}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary-100 font-medium text-primary-900"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span className="block truncate">{org.name}</span>
                    {org.description && (
                      <span
                        className={cn(
                          "block truncate text-xs",
                          isSelected ? "text-primary-600" : "text-gray-400",
                        )}
                      >
                        {org.description}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-4 text-center text-sm text-gray-400">
              {t("no_organizations_found")}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
