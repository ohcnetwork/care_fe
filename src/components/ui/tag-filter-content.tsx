import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Folder } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

// Generic color palette for cycling through options
const COLOR_PALETTE = [
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-indigo-500",
  "bg-teal-500",
  "bg-cyan-500",
  "bg-emerald-500",
  "bg-violet-500",
] as const;

interface TagFilterContentProps {
  selectedTags: TagConfig[];
  onTagsChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  _placeholder?: string;
}

export function TagFilterContent({
  selectedTags,
  onTagsChange,
  resource,
  _placeholder = "Filter tags",
}: TagFilterContentProps) {
  const [search, setSearch] = useState("");
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
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

  const getColorForTag = (tagId: string) => {
    const allTags = rootTags?.results || [];
    const index = allTags.findIndex((tag) => tag.id === tagId);
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
    <div className="w-[320px] p-0">
      {/* Search Input */}
      <div className="p-3 border-b border-gray-200">
        <Input
          placeholder="Search tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-sm"
        />
      </div>

      <div className="max-h-[400px] overflow-y-auto">
        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Selected tags
            </div>
            {selectedTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                <Checkbox checked={true} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id),
                    )}
                  />
                  <span className="text-sm">
                    {tag.parent ? `${tag.parent.display} > ` : ""}
                    {tag.display}
                  </span>
                </div>
              </div>
            ))}
            <div className="border-b border-gray-200 my-2" />
          </>
        )}

        {/* Groups with Hover Submenus */}
        {rootLevelGroupTags.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Groups
            </div>
            {rootLevelGroupTags.map((group) => (
              <div
                key={group.id}
                className="relative"
                onMouseEnter={() => {
                  setHoveredGroup(group.id);
                }}
                onMouseLeave={() => setHoveredGroup(null)}
              >
                <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                  <Folder className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{group.display}</span>
                  <Badge variant="outline" className="text-xs">
                    Group
                  </Badge>
                  <ChevronRight className="h-4 w-4 ml-auto" />
                </div>

                {/* Hover Submenu */}
                {hoveredGroup === group.id && (
                  <div className="absolute left-full top-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[280px]">
                    <GroupSubmenuContent
                      group={group}
                      selectedTags={selectedTags}
                      onTagToggle={handleTagToggle}
                      resource={resource}
                      getColorForTag={getColorForTag}
                    />
                  </div>
                )}
              </div>
            ))}
            <div className="border-b border-gray-200 my-2" />
          </>
        )}

        {/* Other Tags */}
        {nonSelectedRootLevelTags.length > 0 && (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
              Other tags
            </div>
            {nonSelectedRootLevelTags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleTagToggle(tag)}
              >
                <Checkbox checked={false} className="h-4 w-4" />
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full flex-shrink-0",
                      getColorForTag(tag.id),
                    )}
                  />
                  <span className="text-sm">{tag.display}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {isLoading && (
          <div className="px-3 py-8 text-sm text-gray-500 text-center">
            {t("loading")}
          </div>
        )}

        {!isLoading && filteredTags.length === 0 && (
          <div className="px-3 py-8 text-sm text-gray-500 text-center">
            {t("no_tags_group")}
          </div>
        )}
      </div>
    </div>
  );
}

// Component for group submenu content
function GroupSubmenuContent({
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
  getColorForTag: (tagId: string) => string;
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
    <div className="p-0">
      <div className="p-2 border-b border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {group.display}
        </div>
      </div>
      {loadingChildren ? (
        <div className="p-2 text-sm text-gray-500">{t("loading")}</div>
      ) : children?.results?.length ? (
        children.results.map((childTag: TagConfig) => {
          const isSelected = selectedTags.some((t) => t.id === childTag.id);
          return (
            <div
              key={childTag.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
              onClick={() => onTagToggle(childTag)}
            >
              <Checkbox checked={isSelected} className="h-4 w-4" />
              <div className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "h-3 w-3 rounded-full flex-shrink-0",
                    getColorForTag(childTag.id),
                  )}
                />
                <span className="text-sm">{childTag.display}</span>
              </div>
              {isSelected && <span className="text-xs text-blue-600">✓</span>}
            </div>
          );
        })
      ) : (
        <div className="p-2 text-sm text-gray-500">{t("no_tags")}</div>
      )}
    </div>
  );
}
