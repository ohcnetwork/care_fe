import { useQuery } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Spinner } from "@/components/ui/spinner";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import { FilterChoiceItem } from "./filterChoiceItem";
import FilterHeader from "./filterHeader";
import {
  FilterMenuList,
  FilterMenuSearch,
  useFilterMenuSearch,
} from "./filterMenuSearch";
import { FilterOptionIndicator } from "./filterOptionIndicator";
import {
  FilterMenuItem,
  FilterMenuLabel,
  FilterMenuSeparator,
} from "./filterSurface";
import { COLOR_PALETTE, FilterConfig, FilterDateRange } from "./utils/Utils";

const getColorForOrg = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return COLOR_PALETTE[hash % COLOR_PALETTE.length];
};

function TreeViewItem({
  org,
  selectedOrgs,
  onOrgToggle,
  level = 0,
  facilityId,
}: {
  org: FacilityOrganizationRead;
  selectedOrgs: FacilityOrganizationRead[];
  onOrgToggle: (org: FacilityOrganizationRead) => void;
  level?: number;
  facilityId: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["facilityOrganizations", facilityId, "parent", org.id],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: org.id,
      },
    }),
    enabled: org.has_children && (level === 0 || expanded),
  });

  const isSelected = selectedOrgs.some((o) => o.id === org.id);
  const hasChildren = org.has_children;
  const hasActiveChildren = (children?.results?.length ?? 0) > 0;

  if (
    !isSelected &&
    level === 0 &&
    hasChildren &&
    !loadingChildren &&
    !hasActiveChildren
  ) {
    return null;
  }

  return (
    <div>
      <div className="flex items-center">
        <FilterChoiceItem
          checked={isSelected}
          onChoose={() => onOrgToggle(org)}
          className="min-w-0 flex-1"
        >
          <FilterOptionIndicator color={getColorForOrg(org.id)} />
          <span className="truncate">{org.name}</span>
        </FilterChoiceItem>
        {hasChildren && (
          <FilterMenuItem
            aria-label={`${t(expanded ? "collapse" : "expand")} ${org.name}`}
            aria-expanded={expanded}
            onSelect={() => setExpanded(!expanded)}
          >
            <ChevronRight
              className={cn("transition-transform", expanded && "rotate-90")}
            />
          </FilterMenuItem>
        )}
      </div>
      {expanded && hasChildren && (
        <div className="ps-4">
          {children?.results
            ?.filter(
              (child) => !selectedOrgs.some((org) => org.id === child.id),
            )
            .map((child) => (
              <TreeViewItem
                key={child.id}
                org={child}
                selectedOrgs={selectedOrgs}
                onOrgToggle={onOrgToggle}
                level={level + 1}
                facilityId={facilityId}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function DepartmentFilterDropdown({
  selectedOrgs,
  onOrgsChange,
  facilityId,
  onBack,
}: {
  selectedOrgs: FacilityOrganizationRead[];
  onOrgsChange: (orgs: FacilityOrganizationRead[]) => void;
  facilityId: string;
  onBack?: () => void;
}) {
  const { search } = useFilterMenuSearch();
  const { t } = useTranslation();

  // Fetch root-level organizations (or search all when searching)
  const { data: rootOrgs, isLoading } = useQuery({
    queryKey: ["facilityOrganizations", facilityId, "root", search],
    queryFn: query.debounced(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        name: search || undefined,
        parent: search ? undefined : "",
      },
    }),
    enabled: !!facilityId,
  });

  const handleOrgSelect = (org: FacilityOrganizationRead) =>
    onOrgsChange([org]);

  const filteredOrgs = rootOrgs?.results || [];
  const isSearching = !!search;

  // Non-selected orgs for the available section
  const nonSelectedOrgs = filteredOrgs.filter(
    (org) => !selectedOrgs.some((o) => o.id === org.id),
  );

  const filteredSelectedOrgs = selectedOrgs.filter(
    (org) =>
      !isSearching ||
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.parent?.name.toLowerCase().includes(search.toLowerCase()),
  );
  const renderOrg = (org: FacilityOrganizationRead, checked: boolean) =>
    org.has_children && !isSearching ? (
      <TreeViewItem
        key={org.id}
        org={org}
        selectedOrgs={selectedOrgs}
        onOrgToggle={handleOrgSelect}
        facilityId={facilityId}
      />
    ) : (
      <FilterChoiceItem
        key={org.id}
        checked={checked}
        onChoose={() => handleOrgSelect(org)}
      >
        <FilterOptionIndicator color={getColorForOrg(org.id)} />
        <span className="min-w-0">
          <span className="block truncate">{org.name}</span>
          {org.parent?.name &&
            (checked ||
              isSearching ||
              (org.parent.org_type !== "root" &&
                org.parent.level_cache > 0)) && (
              <span className="block truncate text-xs text-muted-foreground">
                {org.parent.name}
              </span>
            )}
        </span>
      </FilterChoiceItem>
    );

  return (
    <div>
      <div className="p-3 border-b">
        <FilterMenuSearch
          placeholder={t("search_departments_placeholder")}
          onBack={onBack}
        />
      </div>
      <FilterMenuList className="p-3 max-h-[30vh] overflow-y-auto">
        {/* Selected Departments */}
        {filteredSelectedOrgs.length > 0 && (
          <>
            <FilterMenuLabel>{t("selected_departments")}</FilterMenuLabel>
            {filteredSelectedOrgs.map((org) => renderOrg(org, true))}
            <FilterMenuSeparator />
          </>
        )}

        {/* Available Departments */}
        {nonSelectedOrgs.length > 0 && (
          <>
            <FilterMenuLabel>{t("available_departments")}</FilterMenuLabel>
            {nonSelectedOrgs.map((org) => renderOrg(org, false))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Spinner className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredOrgs.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_departments_found")}
          </div>
        )}
      </FilterMenuList>
    </div>
  );
}

export default function RenderDepartmentFilter({
  filter,
  selectedOrgs,
  onFilterChange,
  handleBack,
  handleClose,
  facilityId,
}: {
  filter: FilterConfig;
  selectedOrgs: FacilityOrganizationRead[];
  onFilterChange: (
    filterKey: string,
    values: string[] | FacilityOrganizationRead[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
  handleClose?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();

  if (!facilityId) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        {t("facility_required_for_department_filter")}
      </div>
    );
  }

  return (
    <div className="p-0">
      {(handleBack || handleClose) && (
        <FilterHeader
          label={t(filter.label)}
          icon={filter.icon}
          onBack={handleBack}
          onClose={handleClose}
        />
      )}
      <DepartmentFilterDropdown
        selectedOrgs={selectedOrgs}
        onOrgsChange={(orgs) => {
          onFilterChange(filter.key, orgs);
        }}
        facilityId={facilityId}
        onBack={handleBack}
      />
    </div>
  );
}

export const SelectedDepartmentBadge = ({
  selected,
}: {
  selected: FacilityOrganizationRead[];
}) => {
  if (selected.length === 0) return null;

  const org = selected[0];
  const color = getColorForOrg(org.id);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden">
      <span className={cn(color, "rounded-full size-2 border shrink-0")} />
      <span className="block min-w-0 flex-1 truncate text-sm whitespace-nowrap">
        {org.name}
      </span>
    </div>
  );
};
