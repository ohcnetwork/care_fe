import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search } from "lucide-react";
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

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import AdminOrganizationNavbar from "@/pages/Admin/organizations/components/AdminOrganizationNavbar";
import { OrganizationReferralLinks } from "@/pages/Organization/components/OrganizationReferralLinks";
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
  const isGovernance = organizationType === OrgType.GOVT;
  const isSupplier = organizationType === OrgType.PRODUCT_SUPPLIER;
  const isMobile = useBreakpoints({ default: true, md: false });
  const [expandedOrganizations, setExpandedOrganizations] = useState<
    Set<string>
  >(new Set([]));

  const {
    data: org,
    isLoading: isLoadingOrganization,
    isError: isOrganizationError,
    isFetching: isFetchingOrganization,
    refetch: refetchOrganization,
  } = useQuery({
    queryKey: ["organization", organizationType, organizationId],
    queryFn: query(organizationApi.get, {
      pathParams: { id: organizationId! },
      queryParams: { org_type: organizationType },
    }),
    enabled: !!organizationId,
  });

  const handleOrganizationSelect = useCallback(
    (organization?: Organization) => {
      navigate(
        organization
          ? `/admin/organizations/${organizationType}/${organization.id}`
          : `/admin/organizations/${organizationType}`,
      );
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

  if (isGovernance || isSupplier) {
    const title = isSupplier ? t("suppliers") : t("admin_nav_governance");

    return (
      <Page
        title={title}
        hideTitleOnPage
        className="flex h-full min-h-0 flex-col overflow-hidden p-0"
      >
        <div className="container mx-auto flex min-h-0 flex-1 flex-col gap-4 py-4">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                {title}
              </h1>
              {isSupplier && (
                <p className="max-w-2xl text-sm text-gray-600">
                  {t("manage_suppliers_description")}
                </p>
              )}
            </div>
            <AdminOrganizationFormSheet organizationType={organizationType} />
          </header>

          {isSupplier ? (
            <SupplierDirectory />
          ) : isMobile ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
              <OrgSelect
                value={organizationId}
                onChange={handleOrganizationSelect}
                orgType={organizationType}
                placeholder={t("select_organization")}
                inputPlaceholder={t("search")}
                showClearButton
              />
              <OrganizationDetailPanel
                organizationId={organizationId}
                organization={org}
                organizationType={organizationType}
                isLoading={isLoadingOrganization}
                isError={isOrganizationError}
                isFetching={isFetchingOrganization}
                onRetry={refetchOrganization}
                onParentClick={handleParentClick}
              />
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(16rem,20rem)_minmax(0,1fr)] gap-4">
              <aside className="min-h-0">
                <AdminOrganizationNavbar
                  organizationType={organizationType}
                  selectedOrganizationId={organizationId || null}
                  expandedOrganizations={expandedOrganizations}
                  onToggleExpand={handleToggleExpand}
                  onOrganizationSelect={handleOrganizationSelect}
                  showSearch
                />
              </aside>
              <main className="min-h-0 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                <OrganizationDetailPanel
                  organizationId={organizationId}
                  organization={org}
                  organizationType={organizationType}
                  isLoading={isLoadingOrganization}
                  isError={isOrganizationError}
                  isFetching={isFetchingOrganization}
                  onRetry={refetchOrganization}
                  onParentClick={handleParentClick}
                />
              </main>
            </div>
          )}
        </div>
      </Page>
    );
  }

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
              onChange={handleOrganizationSelect}
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
            orientation="horizontal"
            className="min-h-[calc(100vh-14rem)] rounded-lg"
          >
            <ResizablePanel
              defaultSize="25%"
              minSize="18%"
              maxSize="35%"
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

            <ResizablePanel defaultSize="75%" className="pl-0 md:pl-4">
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
                    <OrganizationReferralLinks organization={org} />
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
          orientation="horizontal"
          className="min-h-[calc(100vh-14rem)] rounded-lg"
        >
          <ResizablePanel
            defaultSize="20%"
            minSize="15%"
            maxSize="30%"
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

          <ResizablePanel defaultSize="80%" className="pl-0 md:pl-4">
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
                          <Button
                            variant="link"
                            type="button"
                            className="h-auto p-0"
                          >
                            {t("organizations")}
                          </Button>
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
                              <Button
                                variant="link"
                                type="button"
                                className="h-auto p-0"
                              >
                                {parent.name}
                              </Button>
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
                    <div className="mt-3">
                      <OrganizationReferralLinks organization={org} />
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

function OrganizationDetailPanel({
  organizationId,
  organization,
  organizationType,
  isLoading,
  isError,
  isFetching,
  onRetry,
  onParentClick,
}: {
  organizationId?: string;
  organization?: Organization;
  organizationType: string;
  isLoading: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
  onParentClick: (parentId: string) => void;
}) {
  const { t } = useTranslation();

  if (!organizationId) {
    return (
      <div className="flex min-h-[22rem] flex-col items-center justify-center gap-3 p-6 text-center">
        <Building2 className="size-8 text-gray-400" aria-hidden="true" />
        <p className="max-w-sm text-sm text-gray-600">
          {t("select_organization_prompt_description")}
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !organization) {
    return (
      <div
        role="alert"
        className="flex min-h-[22rem] flex-col items-center justify-center gap-3 p-6 text-center"
      >
        <p className="text-sm text-gray-600">{t("something_went_wrong")}</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          disabled={isFetching}
        >
          {isFetching ? t("loading") : t("retry")}
        </Button>
      </div>
    );
  }

  const organizationParents: OrganizationParent[] = [];
  let currentParent = organization.parent;
  while (currentParent) {
    if (currentParent.id) organizationParents.push(currentParent);
    currentParent = currentParent.parent;
  }

  return (
    <div className="space-y-5 p-4 sm:p-5">
      {organizationType === OrgType.GOVT && (
        <Breadcrumb>
          <BreadcrumbList className="flex-wrap">
            <BreadcrumbItem>
              <BreadcrumbLink
                asChild
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={() =>
                  navigate(`/admin/organizations/${organizationType}`)
                }
              >
                <Button variant="link" type="button" className="h-auto p-0">
                  {t("organizations")}
                </Button>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {organizationParents.reverse().map((parent) => (
              <React.Fragment key={parent.id}>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="text-sm text-gray-600 hover:text-gray-900"
                    onClick={() => onParentClick(parent.id)}
                  >
                    <Button variant="link" type="button" className="h-auto p-0">
                      {parent.name}
                    </Button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </React.Fragment>
            ))}
            <BreadcrumbItem>
              <span className="max-w-48 truncate text-sm font-medium text-gray-900">
                {organization.name}
              </span>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <section className="space-y-5">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {organization.name}
            </h2>
            {organization.description && (
              <p className="mt-1 max-w-3xl break-words text-sm text-gray-600">
                {organization.description}
              </p>
            )}
          </div>
          <AdminOrganizationFormSheet
            organizationType={organizationType}
            org={organization}
          />
        </header>

        {organizationType !== OrgType.PRODUCT_SUPPLIER && (
          <OrganizationReferralLinks organization={organization} />
        )}
        {organizationType === OrgType.GOVT && (
          <AdminOrganizationView
            id={organization.id}
            organizationType={organizationType}
          />
        )}
      </section>
    </div>
  );
}

/** Flat sidebar list for role organizations */
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
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const {
    data: allOrganizations,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "organization",
      "list",
      organizationType,
      "all",
      debouncedSearchTerm,
    ],
    queryFn: query.paginated(organizationApi.list, {
      pageSize: 100,
      queryParams: {
        parent: "",
        org_type: organizationType,
        name: debouncedSearchTerm || undefined,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const filtered = (allOrganizations?.results || [])
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="space-y-3 border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            {t("organizations")}
          </h2>
          {isFetching && (
            <Loader2
              className="size-4 animate-spin text-gray-500"
              aria-label={t("loading")}
            />
          )}
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {isLoading || (isFetching && filtered.length === 0) ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : isError && filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 p-4 text-center">
              <p className="text-sm text-gray-600">
                {t("something_went_wrong")}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
              >
                {t("retry")}
              </Button>
            </div>
          ) : filtered.length > 0 ? (
            <div className="space-y-1">
              {filtered.map((org) => {
                const isSelected = org.id === selectedOrganizationId;
                return (
                  <Button
                    key={org.id}
                    type="button"
                    variant="ghost"
                    onClick={() => onSelect(org)}
                    aria-current={isSelected ? "page" : undefined}
                    aria-pressed={isSelected}
                    className={cn(
                      "h-auto w-full justify-start whitespace-normal rounded-md px-3 py-2 text-left text-sm transition-colors",
                      isSelected
                        ? "bg-primary-100 font-medium text-primary-900 hover:bg-primary-100"
                        : "text-gray-700 hover:bg-gray-50",
                    )}
                  >
                    <span className="flex min-w-0 flex-1 flex-col items-start">
                      <span className="block w-full truncate">{org.name}</span>
                      {org.description && (
                        <span
                          className={cn(
                            "block w-full truncate text-xs",
                            isSelected ? "text-primary-700" : "text-gray-500",
                          )}
                        >
                          {org.description}
                        </span>
                      )}
                    </span>
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="px-3 py-6 text-center text-sm text-gray-500">
              {t("no_organizations_found")}
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SupplierDirectory() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timeoutId = window.setTimeout(
      () => setDebouncedSearchTerm(searchTerm),
      300,
    );
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  const {
    data: suppliers,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: [
      "organization",
      "list",
      OrgType.PRODUCT_SUPPLIER,
      "directory",
      debouncedSearchTerm,
    ],
    queryFn: query.paginated(organizationApi.list, {
      pageSize: 100,
      queryParams: {
        parent: "",
        org_type: OrgType.PRODUCT_SUPPLIER,
        name: debouncedSearchTerm || undefined,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const organizations = (suppliers?.results || [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <section
      aria-label={t("suppliers")}
      className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex flex-col gap-3 border-b border-gray-200 p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="relative w-full sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
            className="pl-9"
          />
        </div>
        {isFetching && (
          <Loader2
            className="hidden size-4 animate-spin text-gray-500 sm:block"
            aria-label={t("loading")}
          />
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : isError && organizations.length === 0 ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 p-8 text-center"
          >
            <p className="text-sm text-gray-600">
              {t("something_went_wrong")}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              {t("retry")}
            </Button>
          </div>
        ) : organizations.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {organizations.map((supplier) => (
              <li
                key={supplier.id}
                data-slot="supplier-row"
                className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-semibold text-gray-900">
                    {supplier.name}
                  </h2>
                  {supplier.description && (
                    <p className="mt-1 break-words text-sm text-gray-600">
                      {supplier.description}
                    </p>
                  )}
                </div>
                <AdminOrganizationFormSheet
                  organizationType={OrgType.PRODUCT_SUPPLIER}
                  org={supplier}
                />
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Building2 className="size-7 text-gray-400" aria-hidden="true" />
            <p className="text-sm text-gray-600">
              {t("no_organizations_found")}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
