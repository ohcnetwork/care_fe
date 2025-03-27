import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import Page from "@/components/Common/Page";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import {
  FacilityOrganization,
  FacilityOrganizationParent,
} from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import FacilityOrganizationUsers from "./FacilityOrganizationUsers";
import FacilityOrganizationView from "./FacilityOrganizationView";
import FacilityOrganizationNavbar from "./components/FacilityOrganizationNavbar";

interface Props {
  facilityId: string;
  organizationId?: string;
  currentTab?: string;
}

export default function FacilityOrganizationList({
  facilityId,
  organizationId,
  currentTab = "departments",
}: Props) {
  const { t } = useTranslation();
  const [expandedOrganizations, setExpandedOrganizations] = useState<
    Set<string>
  >(new Set([]));

  const { data: facilityData } = useQuery({
    queryKey: ["facility", facilityId],
    queryFn: query(routes.getPermittedFacility, {
      pathParams: { id: facilityId },
    }),
  });

  const { data: org } = useQuery<FacilityOrganization>({
    queryKey: ["facilityOrganization", organizationId],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: { facilityId, organizationId: organizationId! },
    }),
    enabled: !!organizationId,
  });

  const handleOrganizationSelect = useCallback(
    (organization: FacilityOrganization) => {
      navigate(
        `/facility/${facilityId}/settings/departments/${organization.id}/${currentTab}`,
      );
    },
    [facilityId, currentTab],
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

  const navItems = [
    ...(organizationId
      ? [
          {
            path: `/facility/${facilityId}/settings/departments/${organizationId}/users`,
            title: t("users"),
            value: "users",
          },
        ]
      : []),
    {
      path: organizationId
        ? `/facility/${facilityId}/settings/departments/${organizationId}/departments`
        : `/facility/${facilityId}/settings/departments`,
      title: t("departments_or_teams"),
      value: "departments",
    },
  ];

  const handleTabChange = useCallback(
    (tab: string) => {
      if (organizationId) {
        navigate(
          `/facility/${facilityId}/settings/departments/${organizationId}/${tab}`,
        );
      } else {
        navigate(`/facility/${facilityId}/settings/departments`);
      }
    },
    [facilityId, organizationId],
  );

  const handleParentClick = useCallback(
    (parentId: string) => {
      navigate(
        `/facility/${facilityId}/settings/departments/${parentId}/${currentTab}`,
      );
    },
    [facilityId, currentTab],
  );

  const orgParents: FacilityOrganizationParent[] = [];
  let currentParent = org?.parent;
  while (currentParent) {
    if (currentParent.id) {
      orgParents.push(currentParent);
    }
    currentParent = currentParent.parent;
  }

  return (
    <div className="flex gap-4">
      <FacilityOrganizationNavbar
        facilityId={facilityId}
        selectedOrganizationId={organizationId || null}
        expandedOrganizations={expandedOrganizations}
        onToggleExpand={handleToggleExpand}
        onOrganizationSelect={handleOrganizationSelect}
      />
      <div className="flex-1 md:bg-white md:rounded-lg md:shadow-lg pt-4">
        {organizationId && (
          <div className="md:px-6 py-2 flex items-center gap-2 mx-auto max-w-4xl">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    asChild
                    className="hover:text-primary cursor-pointer font-medium text-primary"
                    onClick={() =>
                      navigate(`/facility/${facilityId}/settings/departments`)
                    }
                  >
                    <button type="button">{t("departments")}</button>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbItem>
                  <BreadcrumbSeparator />
                </BreadcrumbItem>
                {orgParents.reverse().map((parent) => (
                  <React.Fragment key={parent.id}>
                    <BreadcrumbItem>
                      <BreadcrumbLink
                        asChild
                        className="hover:text-primary cursor-pointer font-medium text-primary"
                        onClick={() => handleParentClick(parent.id)}
                      >
                        <button type="button">{parent.name}</button>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbItem key={`ellipsis-${parent.id}`}>
                      <BreadcrumbSeparator />
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
                <BreadcrumbItem key={org?.id}>
                  <span className="text-sm">{org?.name}</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        )}
        <Page
          title={org?.name || t("departments_or_teams")}
          componentRight={
            org && (
              <Badge
                variant="outline"
                className="border border-transparent ml-2 text-indigo-800 bg-indigo-100 px-2 py-1 w-max"
              >
                {t(`facility_organization_type__${org.org_type}`)}
              </Badge>
            )
          }
          className="mx-auto max-w-4xl"
        >
          <div className="mt-2">
            {org?.description && (
              <p className="text-sm text-gray-500 break-all whitespace-normal">
                {org.description}
              </p>
            )}
            <Tabs
              defaultValue={currentTab}
              className="w-full mt-2"
              value={currentTab}
              onValueChange={handleTabChange}
            >
              <TabsList className="w-full justify-start border-b border-gray-300 bg-transparent p-0 h-auto rounded-none">
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.value}
                    value={item.value}
                    className="border-b-2 border-transparent px-2 py-2 text-gray-600 hover:text-gray-900 data-[state=active]:text-primary-800  data-[state=active]:border-primary-700 data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none"
                  >
                    {item.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="mt-4">
            {currentTab === "users" && organizationId ? (
              <FacilityOrganizationUsers
                id={organizationId}
                facilityId={facilityId}
                permissions={facilityData?.permissions ?? []}
              />
            ) : (
              <FacilityOrganizationView
                id={organizationId}
                facilityId={facilityId}
                permissions={facilityData?.permissions ?? []}
              />
            )}
          </div>
        </Page>
      </div>
    </div>
  );
}
