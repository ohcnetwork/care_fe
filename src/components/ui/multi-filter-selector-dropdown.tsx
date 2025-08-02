import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Folder, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import {
  ENCOUNTER_CLASS,
  ENCOUNTER_STATUS,
  ENCOUNTER_STATUS_COLORS,
} from "@/types/emr/encounter/encounter";
import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

// Generic color palette for cycling through options
const COLOR_PALETTE = [
  "bg-blue-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-orange-100",
  "bg-red-100",
  "bg-purple-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-teal-100",
  "bg-cyan-100",
  "bg-emerald-100",
  "bg-violet-100",
] as const;

const BADGE_BORDER_COLORS = [
  "border-blue-300",
  "border-green-300",
  "border-yellow-300",
  "border-orange-300",
  "border-red-300",
  "border-purple-300",
  "border-pink-300",
  "border-indigo-300",
  "border-teal-300",
  "border-cyan-300",
  "border-emerald-300",
  "border-violet-300",
] as const;

const BADGE_TEXT_COLORS = [
  "text-blue-500",
  "text-green-500",
  "text-yellow-500",
  "text-orange-500",
  "text-red-500",
  "text-purple-500",
  "text-pink-500",
  "text-indigo-500",
  "text-teal-500",
  "text-cyan-500",
  "text-emerald-500",
  "text-violet-500",
] as const;

interface FilterOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

interface FilterConfig {
  key: string;
  label: string;
  options: FilterOption[];
  placeholder?: string;
  type?: "command" | "tag";
  resource?: TagResource;
  icon?: React.ReactNode;
  renderSelected?: (selected: string[] | TagConfig[]) => React.ReactNode;
  getOperations?: (selected: string[] | TagConfig[]) => string[];
}

interface MultiFilterSelectorDropdownProps {
  selectedFilters: Record<string, FilterState>;
  onFilterChange: (filterKey: string, values: string[] | TagConfig[]) => void;
  onOperationChange: (filterKey: string, operation: string) => void;
  onClearAll: () => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export interface OperationConfig {
  selectedOperation: string | null;
  availableOperations: string[];
}

export interface FilterState {
  filter: FilterConfig;
  operation: OperationConfig;
  selected: string[] | TagConfig[];
}

export function MultiFilterSelectorDropdown({
  selectedFilters,
  onFilterChange,
  onOperationChange,
  onClearAll,
  placeholder = "Filter",
  className,
  disabled = false,
}: MultiFilterSelectorDropdownProps) {
  const [open, setOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  const totalSelectedCount = Object.values(selectedFilters).reduce(
    (sum, filterState) => sum + filterState.selected.length,
    0,
  );

  const hasAnyFilters = totalSelectedCount > 0;

  const handleFilterSelect = (filterKey: string) => {
    setActiveFilter(filterKey);
    setOpen(true);
  };

  const handleSelectedFilterClick = (filterKey: string) => {
    setActiveFilter(filterKey);
    setOpenStates((prev) => ({ ...prev, [filterKey]: true }));
  };

  const handleBack = () => {
    setActiveFilter(null);
  };

  const handleClearAll = () => {
    onClearAll();
    setOpen(false);
  };

  useEffect(() => {
    if (!open) {
      setActiveFilter(null);
    }
  }, [open]);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "justify-between min-w-[200px]",
              hasAnyFilters && "border-blue-300 bg-blue-50",
              className,
            )}
            disabled={disabled}
          >
            <span className="truncate">{placeholder}</span>
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] p-0" align="start">
          <RenderFilterContent
            activeFilter={activeFilter}
            handleFilterSelect={handleFilterSelect}
            selectedFilters={selectedFilters}
            handleBack={handleBack}
            onFilterChange={onFilterChange}
          />
        </DropdownMenuContent>
      </DropdownMenu>
      {Object.entries(selectedFilters).map(([key, _]) => {
        const filterState = selectedFilters[key];
        if (filterState.selected.length === 0 || !filterState) {
          return <></>;
        }
        return (
          <SelectedFilterBar
            key={key}
            filter={filterState.filter}
            selected={filterState.selected}
            onClick={() => handleSelectedFilterClick(key)}
            clearFilter={() => handleClearAll()}
            openState={openStates[key] || false}
            setOpenState={(isOpen) =>
              setOpenStates((prev) => ({ ...prev, [key]: isOpen }))
            }
            handleBack={handleBack}
            onFilterChange={onFilterChange}
            filterState={filterState}
            onOperationChange={onOperationChange}
          />
        );
      })}
    </>
  );
}

function RenderFilterList({
  handleFilterSelect,
  selectedFilters,
}: {
  handleFilterSelect: (filterKey: string) => void;
  selectedFilters: Record<string, FilterState>;
}) {
  const { t } = useTranslation();

  return (
    <div className="p-2">
      {Object.values(selectedFilters).map(({ filter }) => (
        <DropdownMenuItem
          key={filter.key}
          onSelect={(e) => {
            e.preventDefault();
            handleFilterSelect(filter.key);
          }}
          className="flex items-center justify-between px-3 py-2 cursor-pointer"
        >
          <span className="text-sm">{t(filter.label)}</span>
          <div className="flex items-center gap-2">
            {selectedFilters[filter.key]?.selected.length > 0 && (
              <span className="text-xs text-gray-500">
                {selectedFilters[filter.key]?.selected.length}
              </span>
            )}
            <ChevronRight className="h-4 w-4" />
          </div>
        </DropdownMenuItem>
      ))}
    </div>
  );
}

function RenderTagFilter({
  filter,
  selectedTags,
  onFilterChange,
  handleBack,
}: {
  filter: FilterConfig;
  selectedTags: TagConfig[];
  onFilterChange: (filterKey: string, values: string[] | TagConfig[]) => void;
  handleBack: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="p-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <span className="text-sm font-medium">{t(filter.label)}</span>
      </div>
      <TagFilterDropdown
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          onFilterChange(filter.key, tags);
        }}
        resource={filter.resource!}
        placeholder={filter.placeholder}
      />
    </div>
  );
}

function RenderFilterContent({
  activeFilter,
  handleFilterSelect,
  selectedFilters,
  handleBack,
  onFilterChange,
}: {
  activeFilter: string | null;
  handleFilterSelect: (filterKey: string) => void;
  selectedFilters: Record<string, FilterState>;
  handleBack: () => void;
  onFilterChange: (filterKey: string, values: string[] | TagConfig[]) => void;
}) {
  const { t } = useTranslation();

  if (!activeFilter) {
    return (
      <RenderFilterList
        handleFilterSelect={handleFilterSelect}
        selectedFilters={selectedFilters}
      />
    );
  }

  const filterState = selectedFilters[activeFilter];
  const filter = filterState?.filter;
  if (!filter) return null;

  const selected = selectedFilters[filter.key].selected || [];

  // Handle tag filters
  if (filter.type === "tag" && filter.resource) {
    return (
      <RenderTagFilter
        filter={filter}
        selectedTags={selected as TagConfig[]}
        onFilterChange={onFilterChange}
        handleBack={handleBack}
      />
    );
  }

  // Handle regular filters
  const selectedValues = selected.filter((value) => typeof value === "string");

  return (
    <div className="p-0">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="h-6 w-6 p-0"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
        </Button>
        <span className="text-sm font-medium">{t(filter.label)}</span>
      </div>
      <FilterOptionsDropdown
        filterOptions={filter.options}
        selectedValues={selectedValues}
        onValueChange={(values) => {
          // Convert labels back to values
          const selectedValues = values.map((label) => {
            const option = filter.options.find((opt) => opt.label === label);
            return option?.value || label;
          });
          onFilterChange(filter.key, selectedValues);
        }}
        showColorIndicators={true}
      />
    </div>
  );
}

// Component for regular filter options
function FilterOptionsDropdown({
  filterOptions,
  selectedValues = [],
  onValueChange,
  showColorIndicators = false,
}: {
  filterOptions: FilterOption[];
  selectedValues?: string[];
  onValueChange?: (values: string[]) => void;
  showColorIndicators?: boolean;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  const handleCheckboxChange = (value: string, checked: boolean) => {
    if (!onValueChange) return;

    if (checked) {
      onValueChange([...selectedValues, value]);
    } else {
      onValueChange(selectedValues.filter((v) => v !== value));
    }
  };

  const getColorForOption = (index: number) => {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const filteredOptions = filterOptions.filter((option) =>
    option.value.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-3">
      <Input
        placeholder="Search options..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm mb-3"
      />
      <div className="max-h-[300px] overflow-y-auto">
        {filteredOptions.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-4">
            No results found
          </div>
        ) : (
          <div>
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  checked={selectedValues.includes(option.value)}
                  onCheckedChange={(checked) =>
                    handleCheckboxChange(option.value, checked as boolean)
                  }
                  className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                {showColorIndicators && (
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForOption(index),
                    )}
                  />
                )}
                <span className="text-sm text-gray-700 flex-1">
                  {t(option.label)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for tag filter dropdown
function TagFilterDropdown({
  selectedTags,
  onTagsChange,
  resource,
  _placeholder = "Filter tags",
}: {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  placeholder?: string;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  // Fetch root-level tags
  const { data: rootTags, isLoading } = useQuery({
    queryKey: ["tags", resource, search],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent_is_null: true,
        status: "active",
        ordering: "priority",
        ...(search ? { search } : {}),
      },
    }),
    enabled: true,
  });

  const getColorForTag = (tagId: string, index: number) => {
    return COLOR_PALETTE[index % COLOR_PALETTE.length];
  };

  const handleTagToggle = (tag: TagConfig) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const filteredTags =
    rootTags?.results?.filter((tag) =>
      tag.display.toLowerCase().includes(search.toLowerCase()),
    ) || [];

  // Separate tags into groups
  const rootLevelGroupTags = filteredTags.filter((tag) => tag.has_children);
  const nonSelectedRootLevelTags = filteredTags.filter(
    (tag) => !tag.has_children && !selectedTags.some((t) => t.id === tag.id),
  );

  return (
    <div className="p-3">
      <Input
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm mb-3"
      />
      <div className="max-h-[300px] overflow-y-auto">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selected tags
            </div>
            {selectedTags.map((tag, index) => (
              <DropdownMenuItem
                key={tag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleTagToggle(tag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={true} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id, index),
                    )}
                  />
                  <span className="text-sm">
                    {tag.parent ? `${tag.parent.display} > ` : ""}
                    {tag.display}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Groups */}
        {rootLevelGroupTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Groups
            </div>
            {rootLevelGroupTags.map((group) => (
              <GroupSubmenu
                key={group.id}
                group={group}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                resource={resource}
                getColorForTag={getColorForTag}
              />
            ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Other Tags */}
        {nonSelectedRootLevelTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Other tags
            </div>
            {nonSelectedRootLevelTags.map((tag, index) => (
              <DropdownMenuItem
                key={tag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  handleTagToggle(tag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={false} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id, index),
                    )}
                  />
                  <span className="text-sm">{tag.display}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredTags.length === 0 && (
          <div className="px-2 py-4 text-sm text-gray-500 text-center">
            {t("no_tags_group")}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for group submenu with children
function GroupSubmenu({
  group,
  selectedTags,
  onTagToggle,
  resource,
  getColorForTag,
}: {
  group: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  getColorForTag: (tagId: string, index: number) => string;
}) {
  const { t } = useTranslation();
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", group.id],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: group.id,
        status: "active",
        ordering: "priority",
      },
    }),
    enabled: true,
  });

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{group.display}</span>
          <Badge variant="outline" className="text-xs">
            Group
          </Badge>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-[280px]">
        <div className="p-2 border-b border-gray-200">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {group.display}
          </div>
        </div>
        {loadingChildren ? (
          <div className="p-2 text-sm text-gray-500">{t("loading")}</div>
        ) : children?.results?.length ? (
          children.results.map((childTag: TagConfig, index: number) => {
            const isSelected = selectedTags.some((t) => t.id === childTag.id);
            return (
              <DropdownMenuItem
                key={childTag.id}
                onSelect={(e) => {
                  e.preventDefault();
                  onTagToggle(childTag);
                }}
                className="flex items-center gap-2 px-2 py-1 cursor-pointer"
              >
                <Checkbox checked={isSelected} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(childTag.id, index),
                    )}
                  />
                  <span className="text-sm">{childTag.display}</span>
                </div>
              </DropdownMenuItem>
            );
          })
        ) : (
          <div className="p-2 text-sm text-gray-500">{t("no_tags")}</div>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function createFilterConfig(
  key: string,
  label: string,
  type: "command" | "tag",
  options: FilterOption[],
  resource?: TagResource,
  renderSelected?: (selected: string[] | TagConfig[]) => React.ReactNode,
  getOperations?: (selected: string[] | TagConfig[]) => string[],
): FilterConfig {
  return {
    key,
    label,
    type,
    options,
    resource,
    renderSelected,
    getOperations,
  };
}

function SubMenuFilter({
  selectedOption,
  setSelectedOption,
  availableOptions,
}: {
  selectedOption: string;
  setSelectedOption: (option: string) => void;
  availableOptions: string[];
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 underline cursor-pointer text-xs">
          {t(selectedOption ?? "")}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        {availableOptions.map((option) => (
          <DropdownMenuItem
            key={option}
            onSelect={() => setSelectedOption(option)}
          >
            {t(option)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SelectedFilterBar({
  filter,
  selected,
  onClick,
  clearFilter,
  openState,
  setOpenState,
  handleBack,
  onFilterChange,
  filterState,
  onOperationChange,
}: {
  filter: FilterConfig;
  selected: string[] | TagConfig[];
  onClick: () => void;
  clearFilter: () => void;
  openState: boolean;
  setOpenState: (open: boolean) => void;
  handleBack: () => void;
  onFilterChange: (filterKey: string, values: string[] | TagConfig[]) => void;
  filterState: FilterState;
  onOperationChange: (filterKey: string, operation: string) => void;
}) {
  const { t } = useTranslation();
  const { operation } = filterState;
  const { selectedOperation, availableOperations } = operation;
  console.log(selectedOperation, availableOperations);

  return (
    <DropdownMenu
      open={openState || false}
      onOpenChange={(isOpen) => setOpenState(isOpen)}
    >
      <div className="flex items-center bg-white rounded-md border border-gray-200 w-fit">
        <DropdownMenuTrigger asChild>
          <div
            className="flex items-center gap-2 px-3 py-2 border-r border-gray-200 text-sm"
            onClick={onClick}
          >
            {filter?.icon}
            {t(filter.label)}
          </div>
        </DropdownMenuTrigger>
        <SubMenuFilter
          selectedOption={selectedOperation ?? ""}
          setSelectedOption={(operation) =>
            onOperationChange(filter.key, operation)
          }
          availableOptions={availableOperations ?? []}
        />
        <div className="flex items-center gap-2 px-3 py-2 border-r border-gray-200">
          {filter.renderSelected?.(selected)}
        </div>
        <div>
          <Button
            variant="ghost"
            onClick={clearFilter}
            className="px-3 py-2 hover:bg-gray-50"
          >
            <X className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
      </div>
      <DropdownMenuContent className="w-[320px] p-0" align="start">
        {filter.type === "tag" && filter.resource ? (
          <RenderTagFilter
            filter={filter}
            selectedTags={selected as TagConfig[]}
            onFilterChange={onFilterChange}
            handleBack={handleBack}
          />
        ) : (
          <FilterOptionsDropdown
            filterOptions={filter.options}
            selectedValues={(selected as string[]) || []}
            onValueChange={(values) => onFilterChange(filter.key, values)}
            showColorIndicators={true}
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper functions

const RenderSelectedBadge = ({
  selectedValue,
  selectedLength,
  color,
  borderColor,
  textColor,
}: {
  selectedValue: string;
  selectedLength: number;
  color: string;
  borderColor: string;
  textColor: string;
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        className={cn("text-xs", color, borderColor, textColor)}
      >
        {t(selectedValue)}
      </Badge>
      {selectedLength > 1 && (
        <span className="text-xs bg-gray-100 text-gray-500 px-1 rounded-md">
          +{selectedLength - 1}
        </span>
      )}
    </div>
  );
};

const RenderSelectedTagBadge = ({ selected }: { selected: TagConfig[] }) => {
  const { t } = useTranslation();
  const firstColor = COLOR_PALETTE[0];
  const secondColor = COLOR_PALETTE[1];
  return (
    <div className="flex items-center gap-2">
      {selected.length === 1 ? (
        <span className={cn(firstColor, "rounded-full w-2 h-2")}></span>
      ) : (
        <div className="relative w-4 h-2">
          <span
            className={cn(
              firstColor,
              "rounded-full w-2 h-2 absolute left-0 opacity-75",
            )}
          />
          <span
            className={cn(
              secondColor,
              "rounded-full w-2 h-2 absolute left-1 opacity-75",
            )}
          />
        </div>
      )}
      <Tooltip>
        <TooltipTrigger>
          <span className="text-sm">
            {selected.length} {t("tags", { count: selected.length })}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {selected.map((tag) => (
            <div key={tag.id}>{getTagHierarchyDisplay(tag)}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export const encounterStatusFilter = createFilterConfig(
  "encounter_status",
  "status",
  "command",
  Object.entries(ENCOUNTER_STATUS).map(([key, value]) => ({
    value: key,
    label: value,
    color: ENCOUNTER_STATUS_COLORS[key as keyof typeof ENCOUNTER_STATUS_COLORS],
  })),
  undefined,
  (selected: string[] | TagConfig[]) => {
    if (typeof selected[0] === "string") {
      const option = ENCOUNTER_STATUS[
        selected[0] as keyof typeof ENCOUNTER_STATUS
      ] as string;
      const firstSelectedIndex = Object.values(ENCOUNTER_STATUS).findIndex(
        (o) => o === option,
      );
      const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
      const borderColor =
        BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
      const textColor =
        BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
      return (
        <RenderSelectedBadge
          selectedValue={option}
          selectedLength={selected.length}
          color={color}
          borderColor={borderColor}
          textColor={textColor}
        />
      );
    }
    return <></>;
  },
  () => ["is", "is_not"],
);

export const encounterClassFilter = createFilterConfig(
  "encounter_class",
  "class",
  "command",
  Object.entries(ENCOUNTER_CLASS).map(([key, value]) => ({
    value: key,
    label: `encounter_class__${value}`,
  })),
  undefined,
  (selected: string[] | TagConfig[]) => {
    if (typeof selected[0] === "string") {
      const option = ENCOUNTER_CLASS[
        selected[0] as keyof typeof ENCOUNTER_CLASS
      ] as string;
      const firstSelectedIndex = Object.values(ENCOUNTER_CLASS).findIndex(
        (o) => o === option,
      );
      const color = COLOR_PALETTE[firstSelectedIndex % COLOR_PALETTE.length];
      const borderColor =
        BADGE_BORDER_COLORS[firstSelectedIndex % BADGE_BORDER_COLORS.length];
      const textColor =
        BADGE_TEXT_COLORS[firstSelectedIndex % BADGE_TEXT_COLORS.length];
      return (
        <RenderSelectedBadge
          selectedValue={`encounter_class__${option}`}
          selectedLength={selected.length}
          color={color}
          borderColor={borderColor}
          textColor={textColor}
        />
      );
    }
    return <></>;
  },
  () => ["is", "is_not"],
);

export const tagFilter = createFilterConfig(
  "tags",
  "tags",
  "tag",
  [],
  TagResource.ENCOUNTER,
  (selected: string[] | TagConfig[]) => {
    return <RenderSelectedTagBadge selected={selected as TagConfig[]} />;
  },
  (selected: string[] | TagConfig[]) => {
    if (selected.length === 1) return ["includes", "does_not_include"];
    return ["has_all_of", "has_any_of", "exclude_if_any", "exclude_if_all"];
  },
);
