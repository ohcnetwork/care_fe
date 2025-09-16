import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface OrganizationTreeNodeProps {
  organization: FacilityOrganizationRead;
  selectedOrganizationId: string | null;
  onSelect: (organization: FacilityOrganizationRead) => void;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  level?: number;
  facilityId: string;
}

function OrganizationTreeNode({
  organization,
  selectedOrganizationId,
  onSelect,
  expandedOrganizations,
  onToggleExpand,
  level = 0,
  facilityId,
}: OrganizationTreeNodeProps) {
  const isExpanded = expandedOrganizations.has(organization.id);
  const isSelected = organization.id === selectedOrganizationId;

  // Query for this node's children
  const { data: children, isLoading } = useQuery({
    queryKey: ["facilityOrganization", "list", facilityId, organization.id],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: organization.id,
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
          data-cy="organization-tree-node-parent"
          className="flex items-center flex-1 text-sm gap-2 cursor-pointer"
        >
          <span className="truncate">{organization.name}</span>
        </div>
      </div>
      {isExpanded && children?.results && children.results.length > 0 && (
        <div className="pl-2" data-cy="organization-tree-node-children">
          {children.results.map((child) => (
            <OrganizationTreeNode
              key={child.id}
              organization={child}
              selectedOrganizationId={selectedOrganizationId}
              onSelect={onSelect}
              expandedOrganizations={expandedOrganizations}
              onToggleExpand={onToggleExpand}
              level={level + 1}
              facilityId={facilityId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FacilityOrganizationNavbarProps {
  facilityId: string;
  selectedOrganizationId: string | null;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  onOrganizationSelect: (organization: FacilityOrganizationRead) => void;
}

export default function FacilityOrganizationNavbar({
  facilityId,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
  onOrganizationSelect,
}: FacilityOrganizationNavbarProps) {
  const { data: allOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["facilityOrganization", "list", facilityId],
      queryFn: query(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: "",
        },
      }),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
    });

  const topLevelOrganizations = allOrganizations?.results || [];

  return (
    <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block">
      <ScrollArea className="h-[calc(100vh-14rem)]">
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
                facilityId={facilityId}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
