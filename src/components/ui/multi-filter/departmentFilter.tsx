import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import { Button } from "@/components/ui/button";
import FilterHeader from "./filterHeader";
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

  if (level === 0 && hasChildren && !loadingChildren && !hasActiveChildren) {
    return null;
  }

  return (
    <div>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          onOrgToggle(org);
        }}
        className="flex items-center gap-2 px-2 py-1 cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Checkbox
            checked={isSelected}
            className="data-[state=checked]:border-primary-700 text-white shrink-0"
          />
          <div
            className={cn("size-3 rounded-full border", getColorForOrg(org.id))}
          />
          <span className="text-sm truncate flex-1">{org.name}</span>
          {hasChildren && (
            <Button
              variant="ghost"
              size="xs"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="w-12 justify-center -mr-2"
            >
              <ChevronRight
                className={cn("transition-transform", expanded && "rotate-90")}
              />
            </Button>
          )}
        </div>
      </DropdownMenuItem>
      {expanded && hasChildren && (
        <div>
          {children?.results?.map((childOrg: FacilityOrganizationRead) => (
            <TreeViewItem
              key={childOrg.id}
              org={childOrg}
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
  handleBack,
}: {
  selectedOrgs: FacilityOrganizationRead[];
  onOrgsChange: (orgs: FacilityOrganizationRead[]) => void;
  facilityId: string;
  handleBack?: () => void;
}) {
  const [search, setSearch] = useState("");
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

  const handleOrgToggle = (org: FacilityOrganizationRead) => {
    const isSelected = selectedOrgs.some((o) => o.id === org.id);
    if (isSelected) {
      onOrgsChange([]);
    } else {
      onOrgsChange([org]);
    }
  };

  const filteredOrgs = rootOrgs?.results || [];
  const isSearching = !!search;

  // Non-selected orgs for the available section
  const nonSelectedOrgs = filteredOrgs.filter(
    (org) => !selectedOrgs.some((o) => o.id === org.id),
  );

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      handleBack?.();
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div>
      <div className="p-3 border-b">
        <Input
          placeholder={t("search_departments_placeholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="h-8 text-base sm:text-sm"
        />
      </div>
      <div className="p-3 max-h-[30vh] overflow-y-auto">
        {/* Selected Departments */}
        {(() => {
          const filteredSelectedOrgs = selectedOrgs.filter(
            (org) =>
              !isSearching ||
              org.name.toLowerCase().includes(search.toLowerCase()) ||
              org.parent?.name.toLowerCase().includes(search.toLowerCase()),
          );
          return (
            filteredSelectedOrgs.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                  {t("selected_departments")}
                </div>
                {filteredSelectedOrgs.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onSelect={(e) => {
                      e.preventDefault();
                      handleOrgToggle(org);
                    }}
                    className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                  >
                    <Checkbox
                      checked={true}
                      className="data-[state=checked]:border-primary-700 text-white shrink-0"
                    />
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div
                        className={cn(
                          "size-3 rounded-full shrink-0 border",
                          getColorForOrg(org.id),
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <span className="text-sm truncate block">
                          {org.name}
                        </span>
                        {org.parent && org.parent.name && (
                          <span className="text-xs text-gray-400 truncate block">
                            {org.parent.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )
          );
        })()}

        {/* Available Departments */}
        {nonSelectedOrgs.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("available_departments")}
            </div>
            {nonSelectedOrgs.map((org) =>
              org.has_children && !isSearching ? (
                <TreeViewItem
                  key={org.id}
                  org={org}
                  selectedOrgs={selectedOrgs}
                  onOrgToggle={handleOrgToggle}
                  facilityId={facilityId}
                />
              ) : (
                <DropdownMenuItem
                  key={org.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleOrgToggle(org);
                  }}
                  className="flex items-center gap-2 px-2 py-1 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedOrgs.some((o) => o.id === org.id)}
                    className="data-[state=checked]:border-primary-700 text-white shrink-0"
                  />
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div
                      className={cn(
                        "size-3 rounded-full shrink-0 border",
                        getColorForOrg(org.id),
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-sm truncate block">{org.name}</span>
                      {org.parent &&
                        org.parent.name &&
                        (isSearching ||
                          (org.parent.org_type !== "root" &&
                            org.parent.level_cache > 0)) && (
                          <span className="text-xs text-gray-400 truncate block">
                            {org.parent.name}
                          </span>
                        )}
                    </div>
                  </div>
                </DropdownMenuItem>
              ),
            )}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredOrgs.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_departments_found")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RenderDepartmentFilter({
  filter,
  selectedOrgs,
  onFilterChange,
  handleBack,
  facilityId,
}: {
  filter: FilterConfig;
  selectedOrgs: FacilityOrganizationRead[];
  onFilterChange: (
    filterKey: string,
    values: string[] | FacilityOrganizationRead[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
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
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <DepartmentFilterDropdown
        selectedOrgs={selectedOrgs}
        onOrgsChange={(orgs) => {
          onFilterChange(filter.key, orgs);
        }}
        facilityId={facilityId}
        handleBack={handleBack}
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
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      <span className={cn(color, "rounded-full size-2 border shrink-0")} />
      <span className="text-sm whitespace-nowrap truncate max-w-[150px]">
        {org.name}
      </span>
    </div>
  );
};
