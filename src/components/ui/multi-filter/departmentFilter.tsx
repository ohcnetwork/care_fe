import { useQuery } from "@tanstack/react-query";
import { Building, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import FilterHeader from "./filterHeader";
import { COLOR_PALETTE, FilterConfig, FilterDateRange } from "./utils/Utils";

function TreeViewItem({
  org,
  selectedOrgs,
  onOrgToggle,
  getColorForOrg,
  level = 0,
  facilityId,
}: {
  org: FacilityOrganizationRead;
  selectedOrgs: FacilityOrganizationRead[];
  onOrgToggle: (org: FacilityOrganizationRead) => void;
  getColorForOrg: (orgId: string, index: number) => string;
  level?: number;
  facilityId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: children } = useQuery({
    queryKey: ["facilityOrganizations", facilityId, "parent", org.id],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: org.id,
      },
    }),
    enabled: org.has_children && expanded,
  });

  const isSelected = selectedOrgs.some((o) => o.id === org.id);
  const hasChildren = org.has_children;

  return (
    <div>
      <DropdownMenuItem
        onSelect={(e) => {
          e.preventDefault();
          if (hasChildren) {
            setExpanded(!expanded);
          }
          onOrgToggle(org);
        }}
        className="flex items-center gap-2 px-2 py-1 cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1">
          <Checkbox checked={isSelected} className="h-4 w-4" />
          <div
            className={cn(
              "h-3 w-3 rounded-full shrink-0 border",
              getColorForOrg(org.id, 0),
            )}
          />
          <span className="text-sm truncate flex-1">{org.name}</span>
          {hasChildren && (
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-90",
              )}
            />
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
              getColorForOrg={getColorForOrg}
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

  // Fetch root-level organizations
  const { data: rootOrgs, isLoading } = useQuery({
    queryKey: ["facilityOrganizations", facilityId, "root", search],
    queryFn: query(facilityOrganizationApi.list, {
      pathParams: { facilityId },
      queryParams: {
        parent: "",
        ...(search ? { name: search } : {}),
      },
    }),
    enabled: !!facilityId,
  });

  const getColorForOrg = (orgId: string, index: number) => {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const handleOrgToggle = (org: FacilityOrganizationRead) => {
    const isSelected = selectedOrgs.some((o) => o.id === org.id);
    if (isSelected) {
      // Deselect if already selected
      onOrgsChange([]);
    } else {
      // Single selection - replace any existing selection
      onOrgsChange([org]);
    }
  };

  const filteredOrgs =
    rootOrgs?.results?.filter((org) =>
      org.name.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Separate orgs into selected and non-selected
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
        {selectedOrgs.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("selected_departments")}
            </div>
            {selectedOrgs.map((org) => (
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
                  className="data-[state=checked]:border-primary-700 text-white"
                />
                <div className="flex items-center gap-2 max-w-xs truncate">
                  <Building className="h-3 w-3 text-gray-600" />
                  <span className="text-sm truncate">{org.name}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <div className="my-2 border-t border-gray-200" />
          </>
        )}

        {/* Available Departments */}
        {nonSelectedOrgs.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("available_departments")}
            </div>
            {nonSelectedOrgs.map((org) => (
              <TreeViewItem
                key={org.id}
                org={org}
                selectedOrgs={selectedOrgs}
                onOrgToggle={handleOrgToggle}
                getColorForOrg={getColorForOrg}
                facilityId={facilityId}
              />
            ))}
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
  const firstColor = COLOR_PALETTE[0];

  if (selected.length === 0) return null;

  const org = selected[0];

  return (
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      <span
        className={cn(firstColor, "rounded-full w-2 h-2 border shrink-0")}
      />
      <span className="text-sm whitespace-nowrap truncate max-w-[150px]">
        {org.name}
      </span>
    </div>
  );
};
