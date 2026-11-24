import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Component } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import TagColorDot from "@/components/Tags/TagColorDot";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import { FilterChoiceItem } from "./filterChoiceItem";
import FilterHeader from "./filterHeader";
import {
  FilterMenuList,
  FilterMenuSearch,
  useFilterMenuSearch,
} from "./filterMenuSearch";
import {
  FilterMenuItem,
  FilterMenuLabel,
  FilterMenuSeparator,
  useFilterSurface,
} from "./filterSurface";
import {
  COLOR_PALETTE,
  FilterConfig,
  FilterDateRange,
  TagFilterMeta,
  getColorForOption,
} from "./utils/Utils";

interface TagFilterItemProps {
  tag: TagConfig;
  checked: boolean;
  onToggle: (tag: TagConfig) => void;
  colorIndex?: number;
  showParent?: boolean;
}

function TagFilterItem({
  tag,
  checked,
  onToggle,
  colorIndex = 0,
  showParent,
}: TagFilterItemProps) {
  return (
    <FilterChoiceItem multiple checked={checked} onChoose={() => onToggle(tag)}>
      {showParent && tag.parent && (
        <>
          <Component />
          <span className="truncate text-muted-foreground">
            {tag.parent.display}
          </span>
          <ChevronRight />
        </>
      )}
      <TagColorDot
        tag={tag}
        fallbackColorClass={getColorForOption(colorIndex)}
      />
      <span className="truncate">{tag.display}</span>
    </FilterChoiceItem>
  );
}

function TreeViewItem({
  tag,
  selectedTags,
  onTagToggle,
  resource,
  level = 0,
  facilityId,
}: {
  tag: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  level?: number;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", tag.id, facilityId],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: tag.id,
        status: "active",
        facility: facilityId,
      },
    }),
    enabled: tag.has_children && (level === 0 || expanded),
  });

  if (!tag.has_children) {
    return (
      <TagFilterItem
        tag={tag}
        checked={selectedTags.some((t) => t.id === tag.id)}
        onToggle={onTagToggle}
      />
    );
  }

  const hasActiveChildren = (children?.results?.length ?? 0) > 0;
  const allChildrenSelected =
    children?.results?.every((childTag: TagConfig) =>
      selectedTags.some((t) => t.id === childTag.id),
    ) ?? false;

  if ((level === 0 || expanded) && !loadingChildren && !hasActiveChildren) {
    return null;
  }

  return (
    <div>
      <FilterMenuItem
        disabled={allChildrenSelected}
        aria-expanded={expanded}
        onSelect={() => setExpanded(!expanded)}
      >
        <Component />
        <TagColorDot tag={tag} fallbackColorClass={getColorForOption(0)} />
        <span className="flex-1 truncate">{tag.display}</span>
        <Badge variant="secondary" size="sm">
          {t("group")}
        </Badge>
        {!allChildrenSelected && (
          <ChevronRight
            className={cn("transition-transform", expanded && "rotate-90")}
          />
        )}
      </FilterMenuItem>
      {expanded && (
        <div className="ps-4">
          {children?.results?.map((childTag: TagConfig) => {
            const childSelected = selectedTags.some(
              (t) => t.id === childTag.id,
            );
            if (!childSelected) {
              return (
                <TreeViewItem
                  key={childTag.id}
                  tag={childTag}
                  selectedTags={selectedTags}
                  onTagToggle={onTagToggle}
                  resource={resource}
                  level={level + 1}
                  facilityId={facilityId}
                />
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

function TagFilterDropdown({
  selectedTags,
  onTagsChange,
  resource,
  facilityId,
  onBack,
}: {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  facilityId?: string;
  onBack?: () => void;
}) {
  const { search } = useFilterMenuSearch();
  const { t } = useTranslation();
  const isMobile = useBreakpoints({
    default: true,
    md: false,
  });
  // Submenus need a menu popup; elsewhere groups are expandable rows.
  const inline = useFilterSurface() !== "menu";

  // Fetch root-level tags
  const { data: rootTags, isLoading } = useQuery({
    queryKey: ["tags", resource, search, facilityId],
    queryFn: query.debounced(tagConfigApi.list, {
      queryParams: {
        resource,
        status: "active",
        facility: facilityId,
        display: search || undefined,
        parent_is_null: search ? undefined : true,
      },
    }),
    enabled: true,
  });

  const handleTagToggle = (tag: TagConfig) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const filteredTags = rootTags?.results || [];
  const isSearching = !!search;
  const filteredSelectedTags = selectedTags.filter(
    (tag) =>
      !isSearching ||
      tag.display.toLowerCase().includes(search.toLowerCase()) ||
      tag.parent?.display.toLowerCase().includes(search.toLowerCase()),
  );

  // Separate tags into groups
  const rootLevelGroupTags = filteredTags.filter((tag) => tag.has_children);
  const nonSelectedRootLevelTags = filteredTags.filter(
    (tag) => !selectedTags.some((t) => t.id === tag.id) && !tag.has_children,
  );

  return (
    <div>
      <div className="p-3 border-b">
        <FilterMenuSearch placeholder={t("search_tags")} onBack={onBack} />
      </div>
      <FilterMenuList className="p-3 max-h-[30vh] overflow-y-auto">
        {/* Selected Tags */}
        {filteredSelectedTags.length > 0 && (
          <>
            <FilterMenuLabel>{t("selected_tags")}</FilterMenuLabel>
            {filteredSelectedTags.map((tag, index) => (
              <TagFilterItem
                key={tag.id}
                tag={tag}
                checked
                onToggle={handleTagToggle}
                colorIndex={index}
                showParent
              />
            ))}
            <FilterMenuSeparator />
          </>
        )}

        {/* Groups */}
        {rootLevelGroupTags.length > 0 && !isSearching && (
          <>
            <FilterMenuLabel>{t("tag_groups")}</FilterMenuLabel>
            {isMobile || inline
              ? // Mobile tree view
                rootLevelGroupTags.map((group) => (
                  <TreeViewItem
                    key={group.id}
                    tag={group}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    resource={resource}
                    facilityId={facilityId}
                  />
                ))
              : // Desktop submenu view
                rootLevelGroupTags.map((group) => (
                  <GroupSubmenu
                    key={group.id}
                    group={group}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    resource={resource}
                    facilityId={facilityId}
                  />
                ))}
            <FilterMenuSeparator />
          </>
        )}

        {/* Other Tags */}
        {nonSelectedRootLevelTags.length > 0 && (
          <>
            <FilterMenuLabel>{t("other_tags")}</FilterMenuLabel>
            {nonSelectedRootLevelTags.map((tag, index) => (
              <TagFilterItem
                key={tag.id}
                tag={tag}
                checked={false}
                onToggle={handleTagToggle}
                colorIndex={index}
                showParent
              />
            ))}
          </>
        )}

        {isLoading && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredTags.length === 0 && (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t("no_tags_group")}
          </div>
        )}
      </FilterMenuList>
    </div>
  );
}

function GroupSubmenu({
  group,
  selectedTags,
  onTagToggle,
  resource,
  facilityId,
}: {
  group: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", group.id, facilityId],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: group.id,
        status: "active",
        facility: facilityId,
      },
    }),
    enabled: true,
  });

  const hasActiveChildren = (children?.results?.length ?? 0) > 0;
  const allChildrenSelected =
    children?.results?.every((childTag: TagConfig) =>
      selectedTags.some((t) => t.id === childTag.id),
    ) ?? false;

  if (!loadingChildren && !hasActiveChildren) {
    return null;
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="data-disabled:opacity-50 data-disabled:[&>svg:last-child]:hidden"
        disabled={allChildrenSelected}
      >
        <Component />
        <span className="flex-1 truncate">{group.display}</span>
        <Badge variant="secondary" size="sm">
          {t("group")}
        </Badge>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuLabel>{group.display}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loadingChildren ? (
          <div className="p-2 text-sm text-muted-foreground">
            {t("loading")}
          </div>
        ) : children?.results?.length ? (
          children.results.map((childTag, index) => (
            <TagFilterItem
              key={childTag.id}
              tag={childTag}
              checked={selectedTags.some((t) => t.id === childTag.id)}
              onToggle={onTagToggle}
              colorIndex={index}
            />
          ))
        ) : (
          <div className="p-2 text-sm text-muted-foreground">
            {t("no_tags")}
          </div>
        )}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export default function RenderTagFilter({
  filter,
  selectedTags,
  onFilterChange,
  handleBack,
  handleClose,
  facilityId,
}: {
  filter: FilterConfig;
  selectedTags: TagConfig[];
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
  handleClose?: () => void;
  facilityId?: string;
}) {
  const { t } = useTranslation();
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
      <TagFilterDropdown
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          onFilterChange(filter.key, tags);
        }}
        resource={(filter.meta as TagFilterMeta).resource}
        facilityId={facilityId}
        onBack={handleBack}
      />
    </div>
  );
}

export const SelectedTagBadge = ({ selected }: { selected: TagConfig[] }) => {
  const { t } = useTranslation();
  const firstColor = COLOR_PALETTE[0];
  const secondColor = COLOR_PALETTE[1];
  return (
    <div className="flex items-center gap-2 min-w-0 shrink-0">
      {selected.length === 1 ? (
        <TagColorDot
          tag={selected[0]}
          fallbackColorClass={firstColor}
          className="w-2 h-2"
        />
      ) : (
        <div className="relative w-4 h-2 shrink-0">
          <TagColorDot
            tag={selected[0]}
            fallbackColorClass={firstColor}
            className="w-2 h-2 absolute left-0 opacity-75"
          />
          <TagColorDot
            tag={selected[1]}
            fallbackColorClass={secondColor}
            className="w-2 h-2 absolute left-1 opacity-75"
          />
        </div>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm whitespace-nowrap">
            {selected.length} {t("tags", { count: selected.length })}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {selected.map((tag) => (
            <div key={tag.id}>{getTagHierarchyDisplay(tag, " > ")}</div>
          ))}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
