import { useQuery } from "@tanstack/react-query";
import { Folder } from "lucide-react";
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

import query from "@/Utils/request/query";
import {
  TagConfig,
  TagResource,
  getTagHierarchyDisplay,
} from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

import FilterHeader from "./filter-header";
import { COLOR_PALETTE, FilterConfig, FilterDateRange } from "./utils/utils";

function TagFilterDropdown({
  selectedTags,
  onTagsChange,
  resource,
  placeholder: _placeholder,
  handleBack,
}: {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  placeholder?: string;
  handleBack?: () => void;
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
    <div className="p-3 max-h-[calc(100vh-28rem)] overflow-y-auto">
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
              {t("tag_groups")}
            </div>
            {rootLevelGroupTags.map((group) => (
              <GroupSubmenu
                key={group.id}
                group={group}
                selectedTags={selectedTags}
                onTagToggle={handleTagToggle}
                resource={resource}
                getColorForTag={getColorForTag}
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

function GroupSubmenu({
  group,
  selectedTags,
  onTagToggle,
  resource,
  getColorForTag,
  onSubMenuOpen,
}: {
  group: TagConfig;
  selectedTags: TagConfig[];
  onTagToggle: (tag: TagConfig) => void;
  resource: TagResource;
  getColorForTag: (tagId: string, index: number) => string;
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
        ordering: "priority",
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

  return (
    <DropdownMenuSub
      open={open}
      onOpenChange={(open) => {
        setOpen(open);
      }}
    >
      <DropdownMenuSubTrigger className="flex items-center gap-2 px-2 py-1">
        <div className="flex items-center gap-2 flex-1">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{group.display}</span>
          <Badge variant="outline" className="text-xs">
            {t("group")}
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

export function RenderTagFilter({
  filter,
  selectedTags,
  onFilterChange,
  handleBack,
}: {
  filter: FilterConfig;
  selectedTags: TagConfig[];
  onFilterChange: (
    filterKey: string,
    values: string[] | TagConfig[] | FilterDateRange,
  ) => void;
  handleBack?: () => void;
}) {
  return (
    <div className="p-0">
      {handleBack && <FilterHeader label={filter.label} onBack={handleBack} />}
      <TagFilterDropdown
        selectedTags={selectedTags}
        onTagsChange={(tags) => {
          onFilterChange(filter.key, tags);
        }}
        resource={filter.resource!}
        placeholder={filter.placeholder}
        handleBack={handleBack}
      />
    </div>
  );
}

export const SelectedTagBadge = ({ selected }: { selected: TagConfig[] }) => {
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
