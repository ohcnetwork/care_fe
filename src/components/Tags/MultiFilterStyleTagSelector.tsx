import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Folder,
  Loader2,
  Tag as TagIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

interface MultiFilterStyleTagSelectorProps {
  selected: TagConfig[];
  onChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
  trigger?: React.ReactNode;
}

// Clean, minimal tag selector matching multi-filter design
export function MultiFilterStyleTagSelector({
  selected,
  onChange,
  resource,
  className,
  disabled = false,
  isLoading = false,
  trigger,
}: MultiFilterStyleTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [groupPopoverOpen, setGroupPopoverOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  // Fetch top-level tags
  const { data: rootTags, isLoading: isLoadingRoot } = useQuery({
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
    enabled: open,
  });

  // Fetch children for active group popover
  const { data: childTags, isLoading: isLoadingChildren } = useQuery({
    queryKey: ["tags", resource, "parent", groupPopoverOpen],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: groupPopoverOpen,
        status: "active",
        ordering: "priority",
      },
    }),
    enabled: open && !!groupPopoverOpen,
  });

  // Select/deselect tag
  const handleSelect = (tag: TagConfig) => {
    // If tag has a parent, enforce single selection per group
    const parentId =
      tag.parent && typeof tag.parent === "object" && "id" in tag.parent
        ? tag.parent.id
        : undefined;

    const alreadySelectedInGroup = selected.find(
      (t) =>
        t.parent &&
        typeof t.parent === "object" &&
        "id" in t.parent &&
        t.parent.id === parentId,
    );

    if (alreadySelectedInGroup) {
      onChange(selected.filter((t) => t.id !== alreadySelectedInGroup.id));
    }

    const isCurrentlySelected = selected.some((t) => t.id === tag.id);

    if (isCurrentlySelected) {
      onChange(selected.filter((t) => t.id !== tag.id));
    } else {
      onChange([
        ...selected.filter((t) => t.id !== alreadySelectedInGroup?.id),
        tag,
      ]);
    }
  };

  const _handleGroupClick = (groupId: string) => {
    setGroupPopoverOpen(groupPopoverOpen === groupId ? null : groupId);
  };

  const isSelected = (tag: TagConfig) => selected.some((t) => t.id === tag.id);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button
            variant="outline"
            className={cn(
              "justify-between h-10",
              selected.length > 0 && "border-blue-300 bg-blue-50",
              className,
            )}
            disabled={disabled || isLoading}
          >
            <div className="flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <TagIcon className="h-3 w-3" />
              )}
              <span className="truncate">
                {isLoading
                  ? t("updating_tags")
                  : selected.length > 0
                    ? `${selected.length} ${t("tags", { count: selected.length })}`
                    : t("add_tags")}
              </span>
            </div>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(100vw)] max-w-[calc(100vw-3rem)] sm:max-w-xs p-0"
        align="start"
      >
        <div className="p-0">
          {/* Header */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200">
            <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-gray-950 disabled:pointer-events-none disabled:opacity-50 hover:bg-gray-100 hover:text-gray-900 rounded-md text-xs h-6 w-6 p-0">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">{t("tags")}</span>
          </div>

          {/* Content */}
          <div className="p-3 max-h-[calc(100vh-28rem)] overflow-y-auto">
            {/* Search */}
            <input
              type="text"
              placeholder="Search tags..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-xs transition-colors file:border-0 file:bg-transparent focus:ring-primary-500 focus:border-primary-500 file:text-sm file:font-medium file:text-gray-950 placeholder:text-gray-500 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 md:text-sm duration-300 h-8 text-sm mb-3"
            />

            <div>
              {/* Selected Tags */}
              {selected.length > 0 && (
                <>
                  <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {t("selected_tags")}
                  </div>
                  {selected.map((tag) => (
                    <div
                      key={tag.id}
                      className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-1 cursor-pointer"
                      onClick={() => handleSelect(tag)}
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked="true"
                        data-state="checked"
                        className="bg-white peer border-gray-200 data-[state=checked]:bg-primary-600 data-[state=checked]:text-primary-100 data-[state=checked]:border-primary-600 focus-visible:border-primary-600 focus-visible:ring-primary-500/50 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-4 w-4"
                      >
                        <span className="flex items-center justify-center text-current transition-none">
                          <Check className="size-3.5" />
                        </span>
                      </button>
                      <div className="flex items-center gap-2 max-w-xs truncate">
                        <span className="text-sm flex flex-row items-center gap-1 min-w-0">
                          {tag.parent && (
                            <Folder className="h-3 w-3 text-black/80" />
                          )}
                          {tag.parent && (
                            <span className="flex gap-1 items-center flex-shrink-0">
                              <span className="text-gray-700 truncate">
                                {tag.parent.display}
                              </span>
                              <ArrowRight className="h-3 w-3 flex-shrink-0" />
                            </span>
                          )}
                          <div className="h-3 w-3 rounded-full flex-shrink-0 border bg-blue-100 border-blue-300"></div>
                          <span className="truncate">{tag.display}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="bg-gray-200 -mx-1 my-1 h-px"></div>
                </>
              )}

              {/* Tag Groups */}
              {rootTags?.results &&
                rootTags.results.filter((tag) => tag.has_children).length >
                  0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t("tag_groups")}
                    </div>
                    {rootTags?.results
                      ?.filter((tag) => tag.has_children)
                      .map((tag) => (
                        <div key={tag.id} className="relative">
                          <Popover
                            open={groupPopoverOpen === tag.id}
                            onOpenChange={(open) =>
                              setGroupPopoverOpen(open ? tag.id : null)
                            }
                          >
                            <PopoverTrigger asChild>
                              <div className="focus:bg-gray-100 focus:text-gray-900 cursor-default rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-1">
                                <div className="flex items-center gap-2 flex-1 justify-between">
                                  <div className="flex items-center gap-1">
                                    <Folder className="h-4 w-4 text-black/80" />
                                    <span className="text-sm">
                                      {tag.display}
                                    </span>
                                  </div>
                                  <Badge className="inline-flex items-center rounded-md border font-medium transition-colors gap-1.5 border-gray-300 bg-gray-100 text-gray-900 text-xs p-0.5">
                                    {t("group")}
                                  </Badge>
                                </div>
                                <ArrowRight className="ml-auto size-4" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent
                              className="w-64 p-0"
                              side="right"
                              align="start"
                              sideOffset={5}
                            >
                              <div className="p-2 border-b border-gray-200">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                  {tag.display}
                                </div>
                              </div>
                              {isLoadingChildren ? (
                                <div className="p-2 text-sm text-gray-500">
                                  {t("loading")}
                                </div>
                              ) : childTags?.results?.length ? (
                                childTags.results.map((childTag) => (
                                  <div
                                    key={childTag.id}
                                    className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-1 cursor-pointer"
                                    onClick={() => handleSelect(childTag)}
                                  >
                                    <button
                                      type="button"
                                      role="checkbox"
                                      aria-checked={isSelected(childTag)}
                                      data-state={
                                        isSelected(childTag)
                                          ? "checked"
                                          : "unchecked"
                                      }
                                      className="bg-white peer border-gray-200 data-[state=checked]:bg-primary-600 data-[state=checked]:text-primary-100 data-[state=checked]:border-primary-600 focus-visible:border-primary-600 focus-visible:ring-primary-500/50 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-4 w-4"
                                    >
                                      {isSelected(childTag) && (
                                        <span className="flex items-center justify-center text-current transition-none">
                                          <Check className="size-3.5" />
                                        </span>
                                      )}
                                    </button>
                                    <div className="flex items-center gap-2 flex-1">
                                      <div className="h-3 w-3 rounded-full flex-shrink-0 border bg-green-100 border-green-300"></div>
                                      <span className="text-sm">
                                        {childTag.display}
                                      </span>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-2 text-sm text-gray-500">
                                  {t("no_tags")}
                                </div>
                              )}
                            </PopoverContent>
                          </Popover>
                        </div>
                      ))}
                    <div className="bg-gray-200 -mx-1 my-1 h-px"></div>
                  </>
                )}

              {/* Other Tags */}
              {rootTags?.results &&
                rootTags.results.filter((tag) => !tag.has_children).length >
                  0 && (
                  <>
                    <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t("other_tags")}
                    </div>
                    {rootTags?.results
                      ?.filter((tag) => !tag.has_children)
                      .map((tag) => (
                        <div
                          key={tag.id}
                          className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-1 cursor-pointer"
                          onClick={() => handleSelect(tag)}
                        >
                          <button
                            type="button"
                            role="checkbox"
                            aria-checked={isSelected(tag)}
                            data-state={
                              isSelected(tag) ? "checked" : "unchecked"
                            }
                            className="bg-white peer border-gray-200 data-[state=checked]:bg-primary-600 data-[state=checked]:text-primary-100 data-[state=checked]:border-primary-600 focus-visible:border-primary-600 focus-visible:ring-primary-500/50 size-4 shrink-0 rounded-[4px] border shadow-xs transition-shadow outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-4 w-4"
                          >
                            {isSelected(tag) && (
                              <span className="flex items-center justify-center text-current transition-none">
                                <Check className="size-3.5" />
                              </span>
                            )}
                          </button>
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="h-3 w-3 rounded-full flex-shrink-0 border bg-blue-100 border-blue-300"></div>
                            <span className="text-sm truncate">
                              {tag.display}
                            </span>
                          </div>
                        </div>
                      ))}
                  </>
                )}

              {isLoadingRoot && (
                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                  {t("loading")}
                </div>
              )}

              {!isLoadingRoot && !rootTags?.results?.length && (
                <div className="px-2 py-4 text-sm text-gray-500 text-center">
                  {t("no_tags_group")}
                </div>
              )}
            </div>
          </div>

          {/* Footer Navigation */}
          <div className="bg-gray-200 h-px"></div>
          <div className="flex justify-between">
            <div className="flex gap-1 my-2 mx-2">
              <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
                <ArrowLeft className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
                <ArrowRight className="h-4 w-4" />
              </div>
              <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
                <ArrowRight className="h-4 w-4" />
              </div>
              <span className="text-xs text-gray-500 self-center">
                {t("navigate")}
              </span>
            </div>
            <div className="flex gap-1 my-2 mx-2">
              <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300">
                <div className="h-4 w-4" />
              </div>
              <span className="text-xs text-gray-500 self-center">
                {t("select")}
              </span>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
