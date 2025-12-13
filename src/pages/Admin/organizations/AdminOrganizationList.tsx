import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Badge } from "@/components/ui/badge";

import Page from "@/components/Common/Page";

import query from "@/Utils/request/query";
import AdminOrganizationNavbar from "@/pages/Admin/organizations/components/AdminOrganizationNavbar";
import {
  Organization,
  OrganizationParent,
} from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import AdminOrganizationView from "./AdminOrganizationView";

interface Props {
  organizationId?: string;
  organizationType: string;
}

export default function AdminOrganizationList({
  organizationId,
  organizationType,
}: Props) {
  const { t } = useTranslation();
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

  const handleToggleExpand = useCallback((organizationId: string) => {
    setExpandedOrganizations((prev) => {
      const next = new Set(prev);
      if (next.has(organizationId)) {
        next.delete(organizationId);
      } else {
        next.add(organizationId);
      }
      return next;
    });
  }, []);

  // Auto-expand parent organizations when a child is selected
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

  const orgParents: OrganizationParent[] = [];
  let currentParent = org?.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <>
      <Page title={t(organizationType)} hideTitleOnPage className="p-0">
        <div className="container mx-auto">
          <div className="bg-gray-50 -mx-4 md:-mx-0 px-4 md:px-10">
            <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4">
              <h3>{t(organizationType)}</h3>
            </div>

            <div className="flex">
              <AdminOrganizationNavbar
                organizationType={organizationType}
                selectedOrganizationId={organizationId || null}
                expandedOrganizations={expandedOrganizations}
                onToggleExpand={handleToggleExpand}
                onOrganizationSelect={handleOrganizationSelect}
              />

              <div className="flex-1 space-y-3 sm:space-y-4 rounded-lg md:shadow-lg overflow-hidden ml-0 md:ml-4 md:bg-white md:min-h-[calc(100vh-14rem)] transition-all duration-150 ease-in-out">
                {organizationId && org && (
                  <div className="md:pt-4 flex items-center mx-auto max-w-4xl">
                    <Breadcrumb className="md:px-5 md:pt-5">
                      <BreadcrumbList>
                        <BreadcrumbItem>
                          <BreadcrumbLink
                            asChild
                            className="text-sm text-gray-900 cursor-pointer hover:underline hover:underline-offset-2"
                            onClick={() =>
                              navigate(
                                `/admin/organizations/${organizationType}`,
                              )
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
                  className="mx-auto max-w-4xl md:px-2"
                >
                  {organizationId && org && (
                    <>
                      <div className="flex items-center">
                        <h2 className="text-xl font-semibold">{org.name}</h2>
                        {org.org_type && (
                          <Badge variant="indigo" className="ml-2 w-auto">
                            {t(`SYSTEM__org_type__${org.org_type}`)}
                          </Badge>
                        )}
                      </div>

                      {org.description && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 break-all whitespace-normal">
                            {org.description}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="mt-4 md:pb-2">
                    <AdminOrganizationView
                      id={organizationId}
                      organizationType={organizationType}
                    />
                  </div>
                </Page>
              </div>
            </div>
          </div>
        </div>
      </Page>
    </>
  );
}
