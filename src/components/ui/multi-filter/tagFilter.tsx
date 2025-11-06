import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Component } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import useKeyboardShortcut from "use-keyboard-shortcut";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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

import FilterHeader from "./filterHeader";
import {
  COLOR_PALETTE,
  FilterConfig,
  FilterDateRange,
  TagFilterMeta,
} from "./utils/Utils";

function TreeViewItem({
  tag,
  selectedTags,
  onTagToggle,
  resource,
  getColorForTag,
  level = 0,
  facilityId,
}: {
  tag: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  getColorForTag: (tagId: string, index: number) => string;
  level?: number;
  facilityId?: string;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: children } = useQuery({
    queryKey: ["tags", resource, "parent", tag.id],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: tag.id,
        status: "active",
        facility: facilityId,
      },
    }),
    enabled: tag.has_children && expanded,
  });

  const isSelected = selectedTags.some((t) => t.id === tag.id);
  const isRootLevel = tag.has_children;
  const allChildrenSelected =
    children?.results?.every((childTag: TagConfig) =>
      selectedTags.some((t) => t.id === childTag.id),
    ) ?? false;

  return (
    <div>
      <DropdownMenuItem
        disabled={isRootLevel && allChildrenSelected}
        onSelect={(e) => {
          e.preventDefault();
          if (isRootLevel) {
            setExpanded(!expanded);
          } else {
            onTagToggle(tag);
          }
        }}
        className="flex items-center gap-2 px-2 py-1 cursor-pointer"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        <div className="flex items-center gap-2 flex-1">
          {isRootLevel ? (
            <Component className="h-4 w-4 text-black/80" strokeWidth={1.25} />
          ) : (
            <Checkbox checked={isSelected} className="h-4 w-4" />
          )}
          <div
            className={cn(
              "h-3 w-3 rounded-full flex-shrink-0 border",
              getColorForTag(tag.id, 0),
            )}
          />
          <span className="text-sm truncate flex-1">{tag.display}</span>
          {tag.has_children && (
            <Badge variant="secondary" className="text-xs p-0.5 ml-auto">
              {t("group")}
            </Badge>
          )}
          {isRootLevel && !allChildrenSelected && (
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-90",
              )}
            />
          )}
        </div>
      </DropdownMenuItem>
      {expanded && isRootLevel && (
        <div>
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
                  getColorForTag={getColorForTag}
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
  placeholder: _placeholder,
  facilityId,
  handleBack,
}: {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  placeholder?: string;
  handleBack?: () => void;
  facilityId?: string;
}) {
  const [search, setSearch] = useState("");
  const { t } = useTranslation();
  const isMobile = useBreakpoints({
    default: true,
    md: false,
  });

  // Fetch root-level tags
  const { data: rootTags, isLoading } = useQuery({
    queryKey: ["tags", resource, search],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent_is_null: true,
        status: "active",
        ...(facilityId ? { facility: facilityId } : {}),
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

  const [hasOpenSubmenu, setHasOpenSubmenu] = useState(false);

  useKeyboardShortcut(
    ["ArrowLeft"],
    () => {
      if (!hasOpenSubmenu) {
        handleBack?.();
      }
    },
    {
      overrideSystem: true,
    },
  );

  return (
    <div className="p-3 max-h-[30vh] overflow-y-auto">
      <Input
        placeholder="Search tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-sm mb-3"
      />
      <div>
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("selected_tags")}
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
                <Checkbox
                  checked={true}
                  className="data-[state=checked]:border-primary-700 text-white"
                />
                <div className="flex items-center gap-2 max-w-xs truncate">
                  {tag.parent && (
                    <Component
                      className="h-3 w-3 text-black/80"
                      strokeWidth={1.25}
                    />
                  )}
                  <span className="text-sm flex flex-row items-center gap-1 min-w-0">
                    {tag.parent && (
                      <span className="flex gap-1 items-center flex-shrink-0">
                        <span className="text-gray-700 truncate">
                          {tag.parent.display}
                        </span>
                        <ChevronRight className="h-3 w-3 flex-shrink-0" />
                      </span>
                    )}
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full flex-shrink-0 border",
                        getColorForTag(tag.id, index),
                      )}
                    />
                    <span className="truncate">{tag.display}</span>
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
              {t("tag_groups")}
            </div>
            {isMobile
              ? // Mobile tree view
                rootLevelGroupTags.map((group) => (
                  <TreeViewItem
                    key={group.id}
                    tag={group}
                    selectedTags={selectedTags}
                    onTagToggle={handleTagToggle}
                    resource={resource}
                    getColorForTag={getColorForTag}
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
                    getColorForTag={getColorForTag}
                    facilityId={facilityId}
                    onSubMenuOpen={(open) => {
                      setHasOpenSubmenu(open);
                    }}
                  />
                ))}
            <DropdownMenuSeparator />
          </>
        )}

        {/* Other Tags */}
        {nonSelectedRootLevelTags.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
              {t("other_tags")}
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
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0 border",
                      getColorForTag(tag.id, index),
                    )}
                  />
                  <span className="text-sm truncate">{tag.display}</span>
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

function GroupSubmenu({
  group,
  selectedTags,
  onTagToggle,
  resource,
  getColorForTag,
  facilityId,
  onSubMenuOpen,
}: {
  group: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  getColorForTag: (tagId: string, index: number) => string;
  facilityId?: string;
  onSubMenuOpen: (isOpen: boolean) => void;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: children, isLoading: loadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", group.id],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: group.id,
        status: "active",
        ...(facilityId ? { facility: facilityId } : {}),
      },
    }),
    enabled: true,
  });

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        onSubMenuOpen(false);
      }, 100);
    } else {
      onSubMenuOpen(true);
    }
  }, [open, onSubMenuOpen]);

  const allChildrenSelected =
    children?.results?.every((childTag: TagConfig) =>
      selectedTags.some((t) => t.id === childTag.id),
    ) ?? false;

  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DropdownMenuSubTrigger
        className={cn(
          "flex items-center gap-2 px-2 py-1",
          allChildrenSelected && "opacity-50 [&>svg:last-child]:hidden",
        )}
        disabled={allChildrenSelected}
      >
        <div className="flex items-center gap-2 flex-1 justify-between">
          <div className="flex items-center gap-1">
            <Component className="h-4 w-4 text-black/80" strokeWidth={1.25} />
            <span className="text-sm">{group.display}</span>
          </div>
          <Badge variant="secondary" className="text-xs p-0.5">
            {t("group")}
          </Badge>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
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
                      "h-3 w-3 rounded-full flex-shrink-0 border",
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

export default function RenderTagFilter({
  filter,
  selectedTags,
  onFilterChange,
  handleBack,
  facilityId,
}: {
  filter: FilterConfig;
  selectedTags: TagConfig[];
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
  facilityId?: string;
}) {
  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <TagFilterDropdown
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          onFilterChange(filter.key, tags);
        }}
        resource={(filter.meta as TagFilterMeta).resource}
        placeholder={filter.placeholder}
        handleBack={handleBack}
        facilityId={facilityId}
      />
    </div>
  );
}

export const SelectedTagBadge = ({ selected }: { selected: TagConfig[] }) => {
  const { t } = useTranslation();
  const firstColor = COLOR_PALETTE[0];
  const secondColor = COLOR_PALETTE[1];
  return (
    <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
      {selected.length === 1 ? (
        <span
          className={cn(
            firstColor,
            "rounded-full w-2 h-2 border flex-shrink-0",
          )}
        ></span>
      ) : (
        <div className="relative w-4 h-2 flex-shrink-0">
          <span
            className={cn(
              firstColor,
              "rounded-full w-2 h-2 absolute left-0 opacity-75 border",
            )}
          />
          <span
            className={cn(
              secondColor,
              "rounded-full w-2 h-2 absolute left-1 opacity-75 border",
            )}
          />
        </div>
      )}
      <Tooltip>
        <TooltipTrigger>
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
