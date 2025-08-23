import { useMutation, useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  Folder,
  Hash,
  Loader2,
  Plus,
  Tag as TagIcon,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import tagConfigApi from "@/types/emr/tagConfig/tagConfigApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

// Define the entity types that support tags
export type TagEntityType = "patient" | "encounter" | "appointment";

// Mapping from entity types to tag resources
const ENTITY_TO_RESOURCE_MAP = {
  patient: TagResource.PATIENT,
  encounter: TagResource.ENCOUNTER,
  appointment: TagResource.APPOINTMENT,
} as const;

// Configuration for different entity types using their respective API files
// TODO: Add more entity configurations here as needed
const ENTITY_CONFIG = {
  patient: {
    setTagsApi: patientApi.setInstanceTags,
    removeTagsApi: patientApi.removeInstanceTags,
    displayName: "patient",
  },
  encounter: {
    setTagsApi: encounterApi.setTags,
    removeTagsApi: encounterApi.removeTags,
    displayName: "encounter",
  },
  appointment: {
    setTagsApi: scheduleApis.appointments.setTags,
    removeTagsApi: scheduleApis.appointments.removeTags,
    displayName: "appointment",
  },
  // TODO: Add more entity configurations here
  // service_request: {
  //   setTagsApi: serviceRequestApi.setTags,
  //   removeTagsApi: serviceRequestApi.removeTags,
  //   displayName: "service_request",
  // },
  // charge_item: {
  //   setTagsApi: chargeItemApi.setTags,
  //   removeTagsApi: chargeItemApi.removeTags,
  //   displayName: "charge_item",
  // },
  // activity_definition: {
  //   setTagsApi: activityDefinitionApi.setTags,
  //   removeTagsApi: activityDefinitionApi.removeTags,
  //   displayName: "activity_definition",
  // },
} as const;

interface TagAssignmentSheetProps {
  entityType: TagEntityType;
  entityId: string;
  facilityId?: string;
  currentTags: TagConfig[];
  onUpdate: () => void;
  trigger?: React.ReactNode;
  canWrite?: boolean;
}

interface TagSelectorProps {
  selected: TagConfig[];
  onChange: (tags: TagConfig[]) => void;
  resource: TagResource;
  asFilter?: boolean;
  className?: string;
}

export function TagSelectorPopover({
  selected,
  onChange,
  asFilter = false,
  resource,
  className,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const { t } = useTranslation();

  // Fetch top-level tags
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
    enabled: open,
  });

  // Helper to fetch children for a tag
  function useChildTags(parentId: string) {
    return useQuery({
      queryKey: ["tags", resource, "parent", parentId],
      queryFn: query(tagConfigApi.list, {
        queryParams: {
          resource,
          parent: parentId,
          status: "active",
          ordering: "priority",
        },
      }),
      enabled: expanded.has(parentId),
    });
  }

  // Individual tag item component that handles its own hook
  function TagTreeItem({ tag }: { tag: TagConfig }) {
    const { data: children, isLoading: loadingChildren } = useChildTags(tag.id);
    const isGroup = tag.has_children;

    return (
      <div>
        <CommandItem
          value={tag.display}
          onSelect={() => {
            if (isGroup) {
              toggleExpand(tag.id);
            } else {
              handleSelect(tag);
            }
          }}
          className={cn(
            "flex items-center justify-between cursor-pointer",
            isGroup && "font-medium",
          )}
        >
          <div className="flex items-center gap-2">
            {isGroup ? (
              <Folder className="size-4 text-muted-foreground" />
            ) : (
              <TagIcon className="size-4 text-muted-foreground" />
            )}
            <span>{tag.display}</span>
            {isGroup && (
              <Badge variant="outline" className="text-xs ml-2">
                {t("group")}
              </Badge>
            )}
          </div>
          {isGroup ? (
            expanded.has(tag.id) ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )
          ) : (
            selected.some((t) => t.id === tag.id) && (
              <Badge variant="secondary" className="text-xs">
                {t("selected")}
              </Badge>
            )
          )}
        </CommandItem>
        {/* Children */}
        {isGroup && expanded.has(tag.id) && (
          <div className="ml-6 border-l border-border pl-2">
            {loadingChildren ? (
              <div className="text-xs text-muted-foreground p-2">
                {t("loading")}
              </div>
            ) : children?.results?.length ? (
              <TagTree tags={children.results} />
            ) : (
              <div className="text-xs text-muted-foreground p-2">
                {t("no_tags")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Expand/collapse group
  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Select/deselect tag
  const handleSelect = (tag: TagConfig) => {
    if (tag.has_children) return; // Only leaf tags selectable
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
      handleRemove(alreadySelectedInGroup.id!);
    }
    onChange(
      selected.some((t) => t.id === tag.id)
        ? selected.filter((t) => t.id !== tag.id)
        : [...selected.filter((t) => t.id !== alreadySelectedInGroup?.id), tag],
    );
  };

  // Remove tag
  const handleRemove = (tagId: string) => {
    onChange(selected.filter((t) => t.id !== tagId));
  };

  // Recursive render for tag tree
  function TagTree({ tags }: { tags: TagConfig[] }) {
    return (
      <>
        {tags.map((tag) => (
          <TagTreeItem key={tag.id} tag={tag} />
        ))}
      </>
    );
  }

  return (
    <>
      {/* Selected tags */}
      {selected.length > 0 && !asFilter && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.parent && `${tag.parent.display}: `}
              {tag.display}
              <button
                onClick={() => handleRemove(tag.id)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "mt-2 justify-between bg-transparent overflow-hidden",
              className,
            )}
          >
            {asFilter ? (
              <div className="flex items-center justify-between w-full gap-2 -mr-2">
                <div className="flex items-center gap-2">
                  <TagIcon className="size-4 text-gray-600" />
                  {selected.length > 0 ? (
                    <div className="flex items-center gap-1">
                      <div className="text-sm font-medium text-gray-950">
                        {t("tags")}
                      </div>
                      <span className="text-sm text-gray-600 underline lowercase">
                        {t("include")}
                      </span>
                      <span className="text-sm text-gray-950 underline">
                        {selected.length === 1
                          ? selected[0].display
                          : `${selected.length} ${t("tags")}`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500 mr-2">
                      {t("filter_by_tags")}
                    </span>
                  )}
                </div>
                {selected.length > 0 && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChange([]);
                    }}
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "pl-2 size-8 border-l border-gray-400 rounded-none",
                    )}
                  >
                    <X className="text-gray-950" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="size-4" />
                {t("select_tags_browse_group")}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command>
            <CommandInput
              className="border-none focus-visible:ring-0"
              placeholder="Search tags and groups..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isLoading ? t("loading") : t("no_tags_group")}
              </CommandEmpty>
              {!!rootTags?.results?.length && (
                <CommandGroup heading="Tags">
                  <TagTree tags={rootTags.results} />
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

export default function TagAssignmentSheet({
  entityType,
  entityId,
  facilityId,
  currentTags,
  onUpdate,
  trigger,
  canWrite = true,
}: TagAssignmentSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);

  const entityConfig = ENTITY_CONFIG[entityType];

  // Set tags mutation
  const { mutate: setTags, isPending: isSettingTags } = useMutation({
    mutationFn: mutate(entityConfig.setTagsApi, {
      pathParams: {
        external_id: entityId,
        facilityId: facilityId || "",
      },
    }),
    onSuccess: () => {
      onUpdate();
      toast.success(t("tags_updated_successfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_update_tags"));
    },
  });

  // Remove tags mutation
  const { mutate: removeTags, isPending: isRemovingTags } = useMutation({
    mutationFn: mutate(entityConfig.removeTagsApi, {
      pathParams: {
        external_id: entityId,
        facilityId: facilityId || "",
      },
    }),
    onSuccess: () => {
      onUpdate();
      toast.success(t("tags_removed_successfully"));
      setOpen(false);
    },
    onError: (error: any) => {
      toast.error(error?.message || t("failed_to_remove_tags"));
    },
  });

  // Initialize selected tags from current entity tags
  useEffect(() => {
    setSelectedTags(currentTags);
  }, [currentTags]);

  if (!entityConfig) {
    console.error(`Unsupported entity type: ${entityType}`);
    return null;
  }

  const handleSave = () => {
    const currentTagIds = new Set(currentTags.map((tag: TagConfig) => tag.id));
    const selectedTagIds = new Set(
      selectedTags.map((tag: TagConfig) => tag.id),
    );

    // Find tags to add and remove
    const tagsToAdd = selectedTags.filter(
      (tag: TagConfig) => !currentTagIds.has(tag.id),
    );
    const tagsToRemove = currentTags.filter(
      (tag: TagConfig) => !selectedTagIds.has(tag.id),
    );

    // Execute mutations
    if (tagsToAdd.length > 0) {
      setTags({ tags: tagsToAdd.map((tag: TagConfig) => tag.id!) });
    }

    if (tagsToRemove.length > 0) {
      removeTags({ tags: tagsToRemove.map((tag: TagConfig) => tag.id!) });
    }
  };

  const isLoadingTags = isSettingTags || isRemovingTags;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" disabled={!canWrite}>
            <Hash className="mr-2 size-4" />
            {t("manage_tags")}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("manage_tags")}</SheetTitle>
          <SheetDescription>
            {t("manage_tags_for_entity", {
              entity: t(entityConfig.displayName),
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* Tag Selector */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t("add_tags")}</h3>
            <TagSelectorPopover
              selected={selectedTags}
              onChange={setSelectedTags}
              resource={ENTITY_TO_RESOURCE_MAP[entityType]}
            />
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex w-full justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedTags(currentTags);
                setOpen(false);
              }}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleSave} disabled={isLoadingTags || !canWrite}>
              {isLoadingTags ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save")
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
