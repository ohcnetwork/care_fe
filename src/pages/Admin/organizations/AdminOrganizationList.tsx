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
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

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
          <div className="flex flex-col sm:flex-row items-start justify-between mb-2 sm:mb-4">
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
              className="hidden md:flex"
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

            <ResizablePanel
              defaultSize={80}
              minSize={65}
              className="md:pl-4 flex"
            >
              <div className="flex-1 rounded-lg md:shadow-lg overflow-auto md:bg-white flex flex-col p-4 md:p-6">
                {organizationId && org && (
                  <>
                    <div className="flex items-center w-full flex-shrink-0 mb-4">
                      <Breadcrumb>
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
                              <button type="button">
                                {t("organizations")}
                              </button>
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
                    <div className="flex items-center mb-2">
                      <h2 className="text-xl font-semibold">{org.name}</h2>
                    </div>
                    {org.description && (
                      <p className="text-sm text-gray-500 break-all whitespace-normal mb-4">
                        {org.description}
                      </p>
                    )}
                  </>
                )}
                <div className="flex-1 flex flex-col">
                  <AdminOrganizationView
                    id={organizationId}
                    organizationType={organizationType}
                  />
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Page>
    </>
  );
}
