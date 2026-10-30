import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Component,
  Plus,
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
      <div className="flex items-center max-w-xs gap-2 truncate">
        <span className="flex flex-row items-center min-w-0 gap-1 text-sm">
          {tag.parent && <Component className="size-3 text-black/80" />}
          {tag.parent && (
            <span className="flex items-center flex-shrink-0 gap-1">
              <span className="text-gray-700 truncate">
                {tag.parent.display}
              </span>
              <ArrowRight className="flex-shrink-0 size-3" />
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
            className="justify-between w-full h-auto gap-3 p-3 rounded-lg"
            onClick={() => handleMobileGroupClick(tag)}
          >
            <span className="flex items-center min-w-0 gap-2">
              <Component className="text-gray-600 size-4 shrink-0" />
              <span className="text-sm truncate">{tag.display}</span>
            </span>
            <span className="flex items-center gap-2">
              <Badge className="border-gray-300 bg-gray-100 px-1 py-0.5 text-xs text-gray-900">
                {t("group")}
              </Badge>
              <ArrowRight className="text-gray-400 size-4" />
            </span>
          </Button>
        ) : (
          <Label
            key={tag.id}
            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
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
        "h-10 w-full border border-strong-border text-placeholder-foreground font-normal shadow-none! inset-shadow-none! px-2.5",
        selected.length > 0 && "border-blue-300 bg-blue-50 h-auto",
        className,
      )}
      disabled={disabled || isTagMutationInProgress}
    >
      <div className="flex items-center w-full min-w-0 gap-2">
        {isTagMutationInProgress ? (
          <Spinner className="size-3 animate-spin" />
        ) : selected.length > 0 ? (
          <TagIcon className="size-3" />
        ) : (
          <Plus className="size-3" />
        )}

        <div>
          {isTagMutationInProgress ? (
            <span>{t("updating_tags")}</span>
          ) : selected.length > 0 ? (
            <div className="flex flex-wrap w-full min-w-0 gap-1 overflow-hidden">
              {selected.slice(0, 3).map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  className="text-blue-900 break-words whitespace-normal bg-blue-100 border-blue-300 overflow-wrap-anywhere"
                />
              ))}
              {selected.length > 3 && (
                <Badge className="text-gray-900 bg-gray-100 border-gray-300 shrink-0">
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
            <DrawerContent height="fixed">
              <DrawerHeader showCloseButton>
                <DrawerTitle>{t("manage_tags")}</DrawerTitle>
              </DrawerHeader>
              {/* Search */}
              <div className="p-2 border-b border-gray-100 shadow-xs">
                <Input
                  placeholder={t("search_tags")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex flex-col flex-1 overflow-hidden">
                {isLoadingRoot ? (
                  <div className="py-8 text-sm text-center text-gray-500">
                    {t("loading")}
                  </div>
                ) : !rootTags?.results?.length ? (
                  <div className="py-8 text-sm text-center text-gray-500">
                    {t("no_tags_group")}
                  </div>
                ) : (
                  <div className="flex-1 px-2 overflow-y-auto">
                    {selected.length > 0 && (
                      <div className="p-2">
                        <div className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {t("selected_tags")}
                        </div>
                        {selected.map((tag) => (
                          <Label
                            key={tag.id}
                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
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
                    {/* Tag Groups */}
                    {groupTags.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
                          {t("tag_groups")}
                        </div>
                        {renderMobileTagList(groupTags)}
                      </div>
                    )}

                    {/* Other Tags */}
                    {otherTags.length > 0 && (
                      <div className="mb-4">
                        <div className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
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
            <DrawerContent height="child">
              <DrawerHeader className="p-2 border-b border-gray-100 shadow-xs">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={handleMobileBack}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <DrawerTitle className="flex items-center gap-2">
                    <Component className="size-4" />
                    {selectedGroup?.display}
                  </DrawerTitle>
                </div>
              </DrawerHeader>

              <div className="flex flex-col flex-1 overflow-hidden">
                <div className="flex-1 px-4 overflow-y-auto">
                  {isLoadingChildren ? (
                    <div className="py-8 text-sm text-center text-gray-500">
                      {t("loading")}
                    </div>
                  ) : childTags?.results?.length ? (
                    <div className="space-y-1">
                      {childTags.results.map((childTag) => (
                        <Label
                          key={childTag.id}
                          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={isSelected(childTag)}
                            className="size-4"
                            onCheckedChange={() => handleSelect(childTag)}
                          />
                          <div className="flex items-center flex-1 min-w-0 gap-2">
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
                    <div className="py-8 text-sm text-center text-gray-500">
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
                  className="p-0 size-6"
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
                  <div className="px-2 py-4 text-sm text-center text-gray-500">
                    {t("loading")}
                  </div>
                ) : !rootTags?.results?.length ? (
                  <div className="px-2 py-4 text-sm text-center text-gray-500">
                    {t("no_tags_group")}
                  </div>
                ) : (
                  <div>
                    {/* Tag Groups */}
                    {groupTags.length > 0 && (
                      <>
                        <div className="h-px my-1 -mx-1 bg-gray-200"></div>
                        <div className="px-2 py-1 mt-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
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
                                  <div className="flex items-center justify-between flex-1 gap-2">
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
                                  <div className="text-xs font-medium tracking-wide text-gray-500 uppercase">
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
                                      className="relative flex items-center gap-2 px-2 py-1 text-sm rounded-sm cursor-pointer select-none focus:bg-gray-100 focus:text-gray-900 outline-hidden"
                                    >
                                      <Checkbox
                                        checked={isSelected(childTag)}
                                        className="size-4"
                                        onCheckedChange={() =>
                                          handleSelect(childTag)
                                        }
                                      />
                                      <div className="flex items-center flex-1 gap-2">
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
                        <div className="h-px my-1 -mx-1 bg-gray-200"></div>
                        <div className="px-2 py-1 mt-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
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
              <div className="h-px bg-gray-200"></div>
              <div className="flex items-center justify-between h-11">
                <div className="flex gap-1 my-3.5 mx-4">
                  <div className="flex items-center px-1 bg-gray-100 border border-gray-300 rounded-md shadow-full">
                    <ArrowUp className="size-3" />
                  </div>
                  <div className="flex items-center px-1 bg-gray-100 border border-gray-300 rounded-md shadow-full">
                    <ArrowDown className="size-3" />
                  </div>
                  <span className="self-center text-xs text-gray-700">
                    {t("navigate")}
                  </span>
                </div>
                <div className="flex gap-1 my-3.5 mx-4">
                  <div className="flex items-center px-1 bg-gray-100 border border-gray-300 rounded-md shadow-full">
                    <Space className="size-3" />
                  </div>
                  <span className="self-center text-xs text-gray-700">
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
