import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { Organization, OrgType } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

interface OrganizationTreeNodeProps {
  organization: Organization;
  selectedOrganizationId: string | null;
  onSelect: (organization: Organization) => void;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  level?: number;
  organizationType: string;
}

function OrganizationTreeNode({
  organization,
  selectedOrganizationId,
  onSelect,
  expandedOrganizations,
  onToggleExpand,
  organizationType,
  level = 0,
}: OrganizationTreeNodeProps) {
  const isExpanded = expandedOrganizations.has(organization.id);
  const isSelected = organization.id === selectedOrganizationId;

  // Query for this node's children
  const { data: children, isLoading } = useQuery({
    queryKey: ["organization", "list", organizationType, organization.id],
    queryFn: query(organizationApi.list, {
      pathParams: { id: organization.id },
      queryParams: {
        parent: organization.id || "",
        org_type: organizationType,
      },
    }),
    enabled: isExpanded,
  });

  return (
    <div className="space-y-1">
      <div
        className={cn(
          "flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100",
          isSelected && "bg-blue-100 text-blue-800",
        )}
        style={{ paddingLeft: `${level}rem` }}
      >
        {organization.has_children ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(organization.id);
            }}
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            ) : isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ) : (
          <span className="w-6" />
        )}
        <div
          onClick={() => {
            onSelect(organization);
            if (organization.has_children) {
              onToggleExpand(organization.id);
            }
          }}
          className="flex items-center flex-1 text-sm gap-2 cursor-pointer"
        >
          <span className="truncate">{organization.name}</span>
        </div>
      </div>
      {isExpanded && children?.results && children.results.length > 0 && (
        <div className="pl-2">
          {children.results.map((child) => (
            <OrganizationTreeNode
              key={child.id}
              organization={child}
              selectedOrganizationId={selectedOrganizationId}
              onSelect={onSelect}
              expandedOrganizations={expandedOrganizations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              organizationType={organizationType}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface AdminOrganizationNavbarProps {
  organizationType: string;
  selectedOrganizationId: string | null;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  onOrganizationSelect: (organization: Organization) => void;
  compact?: boolean;
  showHeader?: boolean;
}

export default function AdminOrganizationNavbar({
  organizationType,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
  onOrganizationSelect,
  compact = false,
  showHeader = true,
}: AdminOrganizationNavbarProps) {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const isRoleOrganizationPage = organizationType === OrgType.ROLE;

  const { data: allOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["organization", "list", organizationType],
      queryFn: query(organizationApi.list, {
        queryParams: {
          parent: "",
          org_type: organizationType,
          limit: 100,
        },
      }),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  const topLevelOrganizations = (allOrganizations?.results || [])
    .slice()
    .sort((left, right) => left.name.localeCompare(right.name));
  const filteredRoleOrganizations = topLevelOrganizations.filter(
    (organization) =>
      organization.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      organization.description
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  const renderSearchBar = () => (
    <div
      className={cn("border-b border-gray-100", compact ? "px-4 py-3" : "p-4")}
    >
      {showHeader && (
        <p className="mb-2.5 text-sm font-medium text-gray-900">
          {t("role_organizations_admin_title")}
        </p>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
        <Input
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("search_role_organizations")}
          className="border-gray-200 bg-white pl-9"
        />
      </div>
    </div>
  );

  if (isRoleOrganizationPage) {
    return (
      <div className={cn("block", compact ? "" : "h-full min-w-72")}>
        <div
          className={cn(
            "overflow-hidden rounded-lg border border-gray-200 bg-white",
            !compact && "h-full",
          )}
        >
          {renderSearchBar()}

          <ScrollArea
            className={cn(
              compact ? "max-h-80" : "h-full min-h-[calc(100vh-14rem)]",
            )}
          >
            <div className={cn("space-y-1.5", compact ? "p-2.5" : "p-3")}>
              {isLoadingOrganizations ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <Skeleton key={index} className="h-14 w-full rounded-lg" />
                ))
              ) : filteredRoleOrganizations.length > 0 ? (
                filteredRoleOrganizations.map((organization) => {
                  const isSelected = organization.id === selectedOrganizationId;

                  return (
                    <button
                      key={organization.id}
                      type="button"
                      onClick={() => onOrganizationSelect(organization)}
                      className={cn(
                        "w-full rounded-lg border text-left transition-colors",
                        compact ? "px-3 py-2" : "px-3 py-2.5",
                        isSelected
                          ? "border-primary-200 bg-primary-50"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "truncate text-sm font-medium",
                              isSelected ? "text-primary-900" : "text-gray-900",
                            )}
                          >
                            {organization.name}
                          </p>
                          <p
                            className={cn(
                              "mt-0.5 line-clamp-1 text-xs",
                              isSelected ? "text-primary-700" : "text-gray-500",
                            )}
                          >
                            {organization.description ||
                              t("role_organization_record")}
                          </p>
                        </div>
                        <ChevronRight
                          className={cn(
                            "mt-0.5 size-4 shrink-0",
                            isSelected ? "text-primary-700" : "text-gray-400",
                          )}
                        />
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="flex flex-col items-center gap-1.5 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-4 py-6 text-center">
                  <p className="text-sm font-medium text-gray-600">
                    {t("no_role_organizations_found")}
                  </p>
                  <p className="text-xs text-gray-400">
                    {t("no_role_organizations_found_description")}
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white rounded-lg shadow-lg min-w-64 hidden md:block">
      <ScrollArea className="h-full min-h-[calc(100vh-14rem)]">
        <div className="p-4">
          {isLoadingOrganizations ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            topLevelOrganizations.map((organization) => (
              <OrganizationTreeNode
                key={organization.id}
                organization={organization}
                selectedOrganizationId={selectedOrganizationId}
                onSelect={onOrganizationSelect}
                expandedOrganizations={expandedOrganizations}
                onToggleExpand={onToggleExpand}
                organizationType={organizationType}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
