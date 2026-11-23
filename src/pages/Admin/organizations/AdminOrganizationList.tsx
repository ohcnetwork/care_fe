import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { navigate } from "@/lib/router/navigate";
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
import { Skeleton } from "@/components/ui/skeleton";

import { OrgSelect } from "@/components/Common/OrgSelect";
import Page from "@/components/Common/Page";

import useBreakpoints from "@/hooks/useBreakpoints";
import { useInfiniteList } from "@/hooks/useInfiniteList";

import query from "@/Utils/request/query";
import AdminOrganizationNavbar from "@/pages/Admin/organizations/components/AdminOrganizationNavbar";
import { OrganizationReferralLinks } from "@/pages/Organization/components/OrganizationReferralLinks";
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

export default function AdminOrganizationList({
  organizationId,
  organizationType,
}: Props) {
  const { t } = useTranslation();
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
      navigate({
        href: organization
          ? `/admin/organizations/${organizationType}/${organization.id}`
          : `/admin/organizations/${organizationType}`,
      });
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
      navigate({
        href: `/admin/organizations/${organizationType}/${parentId}`,
      });
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
      <div className="container mx-auto space-y-4 md:flex md:h-[calc(100svh-6.75rem)] md:flex-col">
        <div className="mb-2 flex flex-col items-start justify-between sm:mb-4 sm:flex-row">
          <h3>{t(organizationType)}</h3>
        </div>

        <ResizablePanelGroup
          orientation="horizontal"
          className="min-h-[calc(100vh-14rem)] rounded-lg md:min-h-0 md:flex-1"
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
            <div className="relative space-y-3 overflow-hidden rounded-lg sm:space-y-4 md:h-full md:overflow-y-auto md:bg-white md:shadow-lg">
              {organizationId && (
                <div className="md:pt-4 flex items-center mx-auto max-w-4xl">
                  <Breadcrumb className="md:px-5 md:pt-5">
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink
                          asChild
                          className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                          onClick={() =>
                            navigate({
                              href: `/admin/organizations/${organizationType}`,
                            })
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
                  navigate({
                    href: `/admin/organizations/${organizationType}`,
                  })
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

function SupplierDirectory() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");

  const {
    data: suppliers,
    isLoading,
    isFetching,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    ref,
  } = useInfiniteList({
    queryKey: [
      "organization",
      "list",
      OrgType.PRODUCT_SUPPLIER,
      "directory",
      searchTerm,
    ],
    ...query.infinite(organizationApi.list, {
      debounceInterval: 300,
      queryParams: {
        parent: "",
        org_type: OrgType.PRODUCT_SUPPLIER,
        name: searchTerm || undefined,
      },
    }),
    refetchOnWindowFocus: false,
  });

  const organizations = suppliers?.results || [];

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
        ) : isError && !isFetchNextPageError ? (
          <div
            role="alert"
            className="flex flex-col items-center gap-3 p-8 text-center"
          >
            <p className="text-sm text-gray-600">{t("something_went_wrong")}</p>
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
          <>
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
            {hasNextPage &&
              (isFetchNextPageError ? (
                <div role="alert" className="flex items-center gap-2 p-4">
                  <p className="text-sm text-gray-600">
                    {t("something_went_wrong")}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fetchNextPage()}
                  >
                    {t("retry")}
                  </Button>
                </div>
              ) : (
                <div ref={ref} />
              ))}
            {isFetchingNextPage && <Skeleton className="m-4 h-16 rounded-md" />}
          </>
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
