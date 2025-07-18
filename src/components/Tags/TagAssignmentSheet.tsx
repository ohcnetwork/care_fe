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
}

export function TagSelectorPopover({
  selected,
  onChange,
  asFilter = false,
  resource,
}: TagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Fetch top-level tags
  const { data: rootTags, isLoading } = useQuery({
    queryKey: ["tags", resource, search],
    queryFn: query(tagConfigApi.list, {
      queryParams: {
        resource,
        parent_is_null: true,
        ...(search ? { search } : {}),
      },
    }),
  });

  // Helper to fetch children for a tag
  function useChildTags(parentId: string) {
    return useQuery({
      queryKey: ["tags", resource, "parent", parentId],
      queryFn: query(tagConfigApi.list, {
        queryParams: { resource, parent: parentId },
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
          className={`flex items-center justify-between cursor-pointer ${isGroup ? "font-medium" : ""}`}
        >
          <div className="flex items-center gap-2">
            {isGroup ? (
              <Folder className="h-4 w-4 text-muted-foreground" />
            ) : (
              <TagIcon className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{tag.display}</span>
            {isGroup && (
              <Badge variant="outline" className="text-xs ml-2">
                Group
              </Badge>
            )}
          </div>
          {isGroup ? (
            expanded.has(tag.id) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )
          ) : (
            selected.some((t) => t.id === tag.id) && (
              <Badge variant="secondary" className="text-xs">
                Selected
              </Badge>
            )
          )}
        </CommandItem>
        {/* Children */}
        {isGroup && expanded.has(tag.id) && (
          <div className="ml-6 border-l border-border pl-2">
            {loadingChildren ? (
              <div className="text-xs text-muted-foreground p-2">
                Loading...
              </div>
            ) : children?.results?.length ? (
              <TagTree tags={children.results} />
            ) : (
              <div className="text-xs text-muted-foreground p-2">No tags</div>
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
    <div>
      {/* Selected tags */}
      {selected.length > 0 && !asFilter && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {tag.parent ? `${tag.parent.display}: ` : ""}
              {tag.display}
              <button
                onClick={() => handleRemove(tag.id)}
                className="ml-1 hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Tag selector popover */}
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="mt-2 w-full justify-between bg-transparent"
          >
            {asFilter ? (
              <div className="flex items-center gap-2">
                {selected.length === 0
                  ? "No filters selected"
                  : selected.length === 1
                    ? `Filtering by ${selected[0].display}`
                    : `${selected.length} filters selected`}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Select tags or browse groups...
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
              <CommandEmpty>No tags or groups found.</CommandEmpty>
              <CommandGroup heading="Tags">
                {isLoading ? (
                  <div className="text-xs text-muted-foreground p-2">
                    Loading...
                  </div>
                ) : rootTags?.results?.length ? (
                  <TagTree tags={rootTags.results} />
                ) : (
                  <div className="text-xs text-muted-foreground p-2">
                    No tags
                  </div>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
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
        facilityId: facilityId,
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
        facilityId: facilityId,
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
