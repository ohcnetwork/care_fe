import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  Component,
  Space,
  Tag as TagIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import TagBadge from "@/components/Tags/TagBadge";
import TagColorDot from "@/components/Tags/TagColorDot";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import query from "@/Utils/request/query";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";

interface MultiFilterStyleTagSelectorProps {
  selected: TagConfig[];
  onChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  facilityId?: string;
  className?: string;
  disabled?: boolean;
  isTagMutationInProgress?: boolean;
  trigger?: React.ReactNode;
  align?: "start" | "end";
}

// Clean, minimal tag selector matching multi-filter design
export function MultiFilterStyleTagSelector({
  selected,
  onChange,
  facilityId,
  resource,
  className,
  disabled = false,
  isTagMutationInProgress = false,
  trigger,
  align = "start",
}: MultiFilterStyleTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [groupPopoverOpen, setGroupPopoverOpen] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [childDrawerOpen, setChildDrawerOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<TagConfig | null>(null);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  // Fetch top-level tags (both instance and facility tags in one call)
  const { data: rootTags, isLoading: isLoadingRoot } = useQuery({
    queryKey: ["tags", resource, search, facilityId],
    queryFn: query.debounced(tagConfigApi.list, {
      queryParams: {
        resource,
        status: "active",
        ...(search ? { display: search } : { parent_is_null: true }),
        ...(facilityId && { facility: facilityId }),
      },
    }),
    enabled: open || mobileDrawerOpen,
  });

  // Fetch children for active group popover (both instance and facility tags in one call)
  const { data: childTags, isLoading: isLoadingChildren } = useQuery({
    queryKey: [
      "tags",
      resource,
      "parent",
      groupPopoverOpen || selectedGroup?.id,
      facilityId,
    ],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent: groupPopoverOpen || selectedGroup?.id,
        status: "active",
        ...(facilityId && { facility: facilityId }),
      },
    }),
    enabled:
      (open && !!groupPopoverOpen) || (childDrawerOpen && !!selectedGroup),
  });

  const isSelected = (tag: TagConfig) => selected.some((t) => t.id === tag.id);

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

    if (isSelected(tag)) {
      onChange(selected.filter((t) => t.id !== tag.id));
    } else {
      onChange([
        ...selected.filter((t) => t.id !== alreadySelectedInGroup?.id),
        tag,
      ]);
    }
  };

  const handleMobileGroupClick = (group: TagConfig) => {
    setSelectedGroup(group);
    setChildDrawerOpen(true);
  };

  const handleMobileBack = () => {
    setChildDrawerOpen(false);
    setSelectedGroup(null);
  };

  const otherTags = rootTags?.results
    ? rootTags.results.filter((tag) => !tag.has_children && !isSelected(tag))
    : [];

  const groupTags = rootTags?.results
    ? rootTags.results.filter((tag) => tag.has_children)
    : [];

  const renderTagNameWithParent = (tag: TagConfig) => {
    return (
      <div className="flex items-center gap-2 max-w-xs truncate">
        <span className="text-sm flex flex-row items-center gap-1 min-w-0">
          {tag.parent && <Component className="size-3 text-black/80" />}
          {tag.parent && (
            <span className="flex gap-1 items-center flex-shrink-0">
              <span className="text-gray-700 truncate">
                {tag.parent.display}
              </span>
              <ArrowRight className="size-3 flex-shrink-0" />
            </span>
          )}
          <TagColorDot
            tag={tag}
            fallbackColorClass="bg-blue-100 border-blue-300"
          />
          <span className="truncate">{tag.display}</span>
        </span>
      </div>
    );
  };

  // Render tag list for mobile
  const renderMobileTagList = (tags: TagConfig[]) => (
    <div className="space-y-1">
      {tags?.map((tag) =>
        tag.has_children ? (
          <Button
            key={tag.id}
            type="button"
            variant="ghost"
            className="h-auto w-full justify-between gap-3 rounded-lg p-3"
            onClick={() => handleMobileGroupClick(tag)}
          >
            <span className="flex min-w-0 items-center gap-2">
              <Component className="size-4 shrink-0 text-gray-600" />
              <span className="truncate text-sm">{tag.display}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge className="border-gray-300 bg-gray-100 px-1 py-0.5 text-xs text-gray-900">
                {t("group")}
              </Badge>
              <ArrowRight className="size-4 text-gray-400" />
            </span>
          </Button>
        ) : (
          <Label
            key={tag.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
          >
            <Checkbox
              checked={isSelected(tag)}
              onCheckedChange={() => handleSelect(tag)}
              className="size-4"
            />
            {renderTagNameWithParent(tag)}
          </Label>
        ),
      )}
    </div>
  ); // Common trigger button
  const triggerButton = trigger ? (
    trigger
  ) : (
    <Button
      variant="outline"
      className={cn(
        "h-10",
        selected.length > 0 && "border-blue-300 bg-blue-50 h-auto",
        className,
      )}
      disabled={disabled || isTagMutationInProgress}
    >
      <div className="flex items-center gap-2 min-w-0 w-full">
        {isTagMutationInProgress ? (
          <Spinner className="size-3 animate-spin" />
        ) : (
          <TagIcon className="size-3" />
        )}

        <div>
          {isTagMutationInProgress ? (
            <span>{t("updating_tags")}</span>
          ) : selected.length > 0 ? (
            <div className="flex gap-1 flex-wrap min-w-0 w-full overflow-hidden">
              {selected.slice(0, 3).map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  className="bg-blue-100 text-blue-900 border-blue-300 whitespace-normal break-words overflow-wrap-anywhere"
                />
              ))}
              {selected.length > 3 && (
                <Badge className="bg-gray-100 text-gray-900 border-gray-300 shrink-0">
                  +{selected.length - 3} {t("more")}
                </Badge>
              )}
            </div>
          ) : (
            <span>{t("add_tags")}</span>
          )}
        </div>
      </div>
    </Button>
  );

  return (
    <>
      {/* Mobile Drawer */}
      {isMobile ? (
        <>
          <Drawer open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
            <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
            <DrawerContent className="flex flex-col min-h-[50vh] max-h-[85vh]">
              <DrawerHeader className="pb-3">
                <DrawerTitle className="flex items-center gap-2">
                  {t("manage_tags")}
                </DrawerTitle>
              </DrawerHeader>

              <div className="flex-1 overflow-hidden flex flex-col">
                {/* Search */}
                <div className="px-4 pb-3">
                  <Input
                    placeholder={t("search_tags")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8"
                  />
                </div>

                {/* Content */}
                {/* Selected Tags */}
                {selected.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {t("selected_tags")}
                    </div>
                    {selected.map((tag) => (
                      <Label
                        key={tag.id}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <Checkbox
                          checked
                          className="size-4"
                          onCheckedChange={() => handleSelect(tag)}
                        />
                        {renderTagNameWithParent(tag)}
                      </Label>
                    ))}
                  </div>
                )}
                {isLoadingRoot ? (
                  <div className="py-8 text-sm text-gray-500 text-center">
                    {t("loading")}
                  </div>
                ) : !rootTags?.results?.length ? (
                  <div className="py-8 text-sm text-gray-500 text-center">
                    {t("no_tags_group")}
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto px-4">
                    {/* Tag Groups */}
                    {groupTags.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          {t("tag_groups")}
                        </div>
                        {renderMobileTagList(groupTags)}
                      </div>
                    )}

                    {/* Other Tags */}
                    {otherTags.length > 0 && (
                      <div className="mb-4">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          {t("other_tags")}
                        </div>
                        {renderMobileTagList(otherTags)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>

          {/* Child Tags Drawer */}
          <Drawer open={childDrawerOpen} onOpenChange={setChildDrawerOpen}>
            <DrawerContent className="flex flex-col max-h-[85vh]">
              <DrawerHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMobileBack}
                    className="p-1 size-8"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <DrawerTitle className="flex items-center gap-2">
                    <Component className="size-4" />
                    {selectedGroup?.display}
                  </DrawerTitle>
                </div>
              </DrawerHeader>

              <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-y-auto px-4">
                  {isLoadingChildren ? (
                    <div className="py-8 text-sm text-gray-500 text-center">
                      {t("loading")}
                    </div>
                  ) : childTags?.results?.length ? (
                    <div className="space-y-1">
                      {childTags.results.map((childTag) => (
                        <Label
                          key={childTag.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected(childTag)}
                            className="size-4"
                            onCheckedChange={() => handleSelect(childTag)}
                          />
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <TagColorDot
                              tag={childTag}
                              fallbackColorClass="bg-green-100 border-green-300"
                            />
                            <span className="text-sm truncate">
                              {childTag.display}
                            </span>
                          </div>
                        </Label>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-sm text-gray-500 text-center">
                      {t("no_tags")}
                    </div>
                  )}
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </>
      ) : (
        /* Desktop Dropdown */
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>{triggerButton}</DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[calc(100vw)] max-w-[calc(100vw-3rem)] sm:max-w-xs p-0"
            align={align}
          >
            <div className="p-0">
              {/* Header */}
              <div className="flex items-center gap-2 p-2 border-b border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="size-6 p-0"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium">
                  {t("tags", { count: selected.length })}
                </span>
              </div>

              {/* Content */}
              <div className="p-2 max-h-[calc(100vh-28rem)] overflow-y-auto">
                {/* Search */}
                <Input
                  placeholder={t("search_tags")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 mb-2"
                />
                {/* Selected Tags */}
                {selected.length > 0 && (
                  <>
                    <div className="px-2 py-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      {t("selected_tags")}
                    </div>
                    {selected.map((tag) => (
                      <DropdownMenuCheckboxItem
                        key={tag.id}
                        className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-2.5 cursor-pointer"
                        checked
                        closeOnClick={false}
                        onCheckedChange={() => handleSelect(tag)}
                      >
                        {renderTagNameWithParent(tag)}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}

                {isLoadingRoot ? (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    {t("loading")}
                  </div>
                ) : !rootTags?.results?.length ? (
                  <div className="px-2 py-4 text-sm text-gray-500 text-center">
                    {t("no_tags_group")}
                  </div>
                ) : (
                  <div>
                    {/* Tag Groups */}
                    {groupTags.length > 0 && (
                      <>
                        <div className="bg-gray-200 -mx-1 my-1 h-px"></div>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">
                          {t("tag_groups")}
                        </div>
                        {groupTags.map((tag) => (
                          <div key={tag.id} className="relative">
                            <Popover
                              open={groupPopoverOpen === tag.id}
                              onOpenChange={(open) =>
                                setGroupPopoverOpen(open ? tag.id : null)
                              }
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="h-auto w-full focus:bg-gray-100 focus:text-gray-900 cursor-default rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-2.5"
                                >
                                  <div className="flex items-center gap-2 flex-1 justify-between">
                                    <div className="flex items-center gap-1">
                                      <Component className="size-4 text-black/80" />
                                      <span className="text-sm">
                                        {tag.display}
                                      </span>
                                    </div>
                                    <Badge className="inline-flex items-center rounded-md border font-medium transition-colors gap-1.5 border-gray-300 bg-gray-100 text-gray-900 text-xs p-0.5">
                                      {t("group")}
                                    </Badge>
                                  </div>
                                  <ArrowRight className="ml-auto size-4" />
                                </Button>
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
                                    <Label
                                      key={childTag.id}
                                      className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-1 cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected(childTag)}
                                        className="size-4"
                                        onCheckedChange={() =>
                                          handleSelect(childTag)
                                        }
                                      />
                                      <div className="flex items-center gap-2 flex-1">
                                        <TagColorDot
                                          tag={childTag}
                                          fallbackColorClass="bg-green-100 border-green-300"
                                        />
                                        <span className="text-sm">
                                          {childTag.display}
                                        </span>
                                      </div>
                                    </Label>
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
                      </>
                    )}

                    {/* Other Tags */}
                    {otherTags.length > 0 && (
                      <>
                        <div className="bg-gray-200 -mx-1 my-1 h-px"></div>
                        <div className="px-2 py-1 text-xs font-medium text-gray-500 uppercase tracking-wide mt-2">
                          {t("other_tags")}
                        </div>
                        {otherTags.map((tag) => (
                          <DropdownMenuCheckboxItem
                            key={tag.id}
                            className="focus:bg-gray-100 focus:text-gray-900 relative rounded-sm text-sm outline-hidden select-none flex items-center gap-2 px-2 py-2.5 cursor-pointer"
                            checked={isSelected(tag)}
                            closeOnClick={false}
                            onCheckedChange={() => handleSelect(tag)}
                          >
                            {renderTagNameWithParent(tag)}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Navigation */}
              <div className="bg-gray-200 h-px"></div>
              <div className="flex justify-between items-center h-11">
                <div className="flex gap-1 my-3.5 mx-4">
                  <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300 flex items-center">
                    <ArrowUp className="size-3" />
                  </div>
                  <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300 flex items-center">
                    <ArrowDown className="size-3" />
                  </div>
                  <span className="text-xs text-gray-700 self-center">
                    {t("navigate")}
                  </span>
                </div>
                <div className="flex gap-1 my-3.5 mx-4">
                  <div className="bg-gray-100 shadow-full rounded-md px-1 border border-gray-300 flex items-center">
                    <Space className="size-3" />
                  </div>
                  <span className="text-xs text-gray-700 self-center">
                    {t("to_select")}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
