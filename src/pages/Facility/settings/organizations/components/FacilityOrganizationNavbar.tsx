import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import query from "@/Utils/request/query";
import { FacilityOrganization } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

interface OrganizationTreeNodeProps {
  organization: FacilityOrganization;
  selectedOrganizationId: string | null;
  expandedOrganizations: Set<string>;
  onToggleExpand: (organizationId: string) => void;
  level?: number;
  facilityId: string;
}

function OrganizationTreeNode({
  organization,
  selectedOrganizationId,
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
          onClick={() =>
            navigate(
              `/facility/${facilityId}/settings/departments/${organization.id}/users`,
            )
          }
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
}

export default function FacilityOrganizationNavbar({
  facilityId,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
}: FacilityOrganizationNavbarProps) {
  const { t } = useTranslation();

  const { data: allOrganizations, isLoading: isLoadingOrganizations } =
    useQuery({
      queryKey: ["facilityOrganization", "list", facilityId],
      queryFn: query(facilityOrganizationApi.list, {
        pathParams: { facilityId },
        queryParams: {
          parent: "",
        },
      }),
    });

  const topLevelOrganizations = allOrganizations?.results || [];

  if (topLevelOrganizations.length === 0) {
    return null;
  }

  return (
    <div className="w-64 shadow-lg bg-white rounded-lg hidden md:block min-h-[calc(100vh-10rem)]">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{t("departments_or_teams")}</h2>
      </div>
      <ScrollArea>
        <div className="p-2">
          {isLoadingOrganizations ? (
            <div className="p-4">
              <CardGridSkeleton count={3} />
            </div>
          ) : (
            topLevelOrganizations.map((organization) => (
              <OrganizationTreeNode
                key={organization.id}
                organization={organization}
                selectedOrganizationId={selectedOrganizationId}
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
