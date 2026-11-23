import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

import { OrgSelect } from "@/components/Common/OrgSelect";
import { useInfiniteList } from "@/hooks/useInfiniteList";
import { cn } from "@/lib/utils";

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
  const { t } = useTranslation();
  const isExpanded = expandedOrganizations.has(organization.id);
  const isSelected = organization.id === selectedOrganizationId;
  const {
    data,
    isLoading,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    ref,
  } = useInfiniteList({
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
        className="flex items-center gap-1"
        style={{ paddingLeft: `${level * 0.75}rem` }}
      >
        {organization.has_children ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            aria-label={t(
              isExpanded ? "collapse_organization" : "expand_organization",
              { name: organization.name },
            )}
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(organization.id);
            }}
          >
            {isLoading ? (
              <Loader2 className="size-4 animate-spin" />
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
            if (organization.has_children && !isExpanded) {
              onToggleExpand(organization.id);
            }
          }}
          aria-pressed={isSelected}
          className={cn(
            "h-auto min-w-0 flex-1 justify-start truncate px-2 py-1.5 text-left text-sm",
            isSelected
              ? "bg-primary-100 font-medium text-primary-900 hover:bg-primary-100"
              : "text-gray-700",
          )}
        >
          <span className="truncate">{organization.name}</span>
        </Button>
      </div>
      {isExpanded && isError && children.length === 0 && (
        <div className="flex items-center gap-2 pl-8">
          <p className="text-xs text-gray-500">{t("something_went_wrong")}</p>
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => refetch()}
          >
            {t("retry")}
          </Button>
        </div>
      )}
      {isExpanded && children.length > 0 && (
        <div className="space-y-1">
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
          {hasNextPage &&
            (isFetchNextPageError ? (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="ml-8 h-auto p-0 text-xs"
                onClick={() => fetchNextPage()}
              >
                {t("retry")}
              </Button>
            ) : (
              <div ref={ref} />
            ))}
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
  /** The search selector can clear the current selection when shown. */
  onOrganizationSelect: (organization?: Organization) => void;
  showSearch?: boolean;
}

export default function AdminOrganizationNavbar({
  organizationType,
  selectedOrganizationId,
  expandedOrganizations,
  onToggleExpand,
  onOrganizationSelect,
  showSearch = false,
}: AdminOrganizationNavbarProps) {
  const { t } = useTranslation();
  const {
    data: allOrganizations,
    isLoading: isLoadingOrganizations,
    isError,
    isFetchNextPageError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch,
    ref,
  } = useInfiniteList({
    queryKey: ["organization", "list", organizationType, "roots"],
    ...query.infinite(organizationApi.list, {
      queryParams: {
        parent: "",
        org_type: organizationType,
      },
    }),
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const topLevelOrganizations = allOrganizations?.results ?? [];

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
      {showSearch && (
        <div className="border-b border-gray-200 p-3">
          <OrgSelect
            value={selectedOrganizationId ?? undefined}
            onChange={onOrganizationSelect}
            orgType={organizationType}
            placeholder={t("select_organization")}
            inputPlaceholder={t("search")}
            showClearButton
          />
        </div>
      )}
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-1 p-2">
          {isLoadingOrganizations ? (
            <div className="space-y-2 p-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-9 w-full rounded-md" />
              ))}
            </div>
          ) : isError && topLevelOrganizations.length === 0 ? (
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
          ) : topLevelOrganizations.length > 0 ? (
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
              {hasNextPage &&
                (isFetchNextPageError ? (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs"
                    onClick={() => fetchNextPage()}
                  >
                    {t("retry")}
                  </Button>
                ) : (
                  <div ref={ref} />
                ))}
              {isFetchingNextPage && <Skeleton className="h-8 w-full" />}
            </>
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
