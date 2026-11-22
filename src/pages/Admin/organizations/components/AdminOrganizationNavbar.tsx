import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { useInfiniteList } from "@/hooks/useInfiniteList";

import query from "@/Utils/request/query";
import { Organization } from "@/types/organization/organization";
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
  const { data, isLoading, hasNextPage, isFetchingNextPage, ref } =
    useInfiniteList({
      queryKey: ["organization", "list", organizationType, organization.id],
      ...query.infinite(organizationApi.list, {
        queryParams: {
          parent: organization.id || "",
          org_type: organizationType,
        },
      }),
      enabled: isExpanded,
    });

  const children = data?.results ?? [];

  return (
    <div className="space-y-1">
      <div
        className={`flex items-center py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 ${isSelected ? "bg-blue-100 text-blue-800" : ""}`}
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
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            onSelect(organization);
            if (organization.has_children) {
              onToggleExpand(organization.id);
            }
          }}
          className="h-auto min-w-0 justify-start p-0 text-left flex items-center flex-1 text-sm gap-2 cursor-pointer"
        >
          <span className="truncate">{organization.name}</span>
        </Button>
      </div>
      {isExpanded && children.length > 0 && (
        <div className="pl-2">
          {children.map((child) => (
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
          {hasNextPage && <div ref={ref} />}
          {isFetchingNextPage && <Skeleton className="h-8 w-full" />}
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
}

export default function AdminOrganizationNavbar({
  organizationType,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
  onOrganizationSelect,
}: AdminOrganizationNavbarProps) {
  const {
    data,
    isLoading: isLoadingOrganizations,
    hasNextPage,
    isFetchingNextPage,
    ref,
  } = useInfiniteList({
    queryKey: ["organization", "list", organizationType],
    ...query.infinite(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: organizationType,
      },
    }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const topLevelOrganizations = data?.results ?? [];

  return (
    <div className="h-full bg-white rounded-lg shadow-lg min-w-64 hidden md:block">
      <ScrollArea className="h-full">
        <div className="p-4">
          {isLoadingOrganizations ? (
            <div className="p-4">
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <>
              {topLevelOrganizations.map((organization) => (
                <OrganizationTreeNode
                  key={organization.id}
                  organization={organization}
                  selectedOrganizationId={selectedOrganizationId}
                  onSelect={onOrganizationSelect}
                  expandedOrganizations={expandedOrganizations}
                  onToggleExpand={onToggleExpand}
                  organizationType={organizationType}
                />
              ))}
              {hasNextPage && <div ref={ref} />}
              {isFetchingNextPage && <Skeleton className="h-8 w-full" />}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
