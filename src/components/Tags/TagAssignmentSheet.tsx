import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { TagConfig, TagResource } from "@/types/emr/tagConfig/tagConfig";
import scheduleApis from "@/types/scheduling/scheduleApi";

import { MultiFilterStyleTagSelector } from "./MultiFilterStyleTagSelector";

// Export the new component for backward compatibility
export { MultiFilterStyleTagSelector as TagSelectorPopover };

// Define the entity types that support tags
export type TagEntityType =
  | "patient"
  | "encounter"
  | "appointment"
  | "prescription"
  | "service_request";

// Mapping from entity types to tag resources
const ENTITY_TO_RESOURCE_MAP = {
  patient: TagResource.PATIENT,
  encounter: TagResource.ENCOUNTER,
  appointment: TagResource.APPOINTMENT,
  prescription: TagResource.PRESCRIPTION,
  service_request: TagResource.SERVICE_REQUEST,
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
  prescription: {
    setTagsApi: prescriptionApi.setTags,
    removeTagsApi: prescriptionApi.removeTags,
    displayName: "prescription",
  },
  service_request: {
    setTagsApi: serviceRequestApi.setTags,
    removeTagsApi: serviceRequestApi.removeTags,
    displayName: "service_request",
  },
  // TODO: Add more entity configurations here

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
  patientId?: string;
  canWrite?: boolean;
  trigger?: React.ReactNode;
}

export default function TagAssignmentSheet({
  entityType,
  entityId,
  facilityId,
  currentTags,
  onUpdate,
  patientId,
  canWrite = true,
  trigger: trigger,
}: TagAssignmentSheetProps) {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>([]);

  const entityConfig = ENTITY_CONFIG[entityType];

  // Set tags mutation
  const { mutateAsync: setTags, isPending: isSettingTags } = useMutation({
    mutationFn: mutate(entityConfig.setTagsApi, {
      pathParams: {
        external_id: entityId,
        ...(facilityId ? { facilityId } : {}),
        ...(patientId ? { patientId } : {}),
      },
    }),
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : t("failed_to_update_tags");
      toast.error(errorMessage);
    },
  });

  // Remove tags mutation
  const { mutateAsync: removeTags, isPending: isRemovingTags } = useMutation({
    mutationFn: mutate(entityConfig.removeTagsApi, {
      pathParams: {
        external_id: entityId,
        facilityId: facilityId || "",
        patientId: patientId || "",
      },
    }),
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : t("failed_to_remove_tags");
      toast.error(errorMessage);
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

  // Handle tag changes with sequential API calls
  const handleTagChange = async (newTags: TagConfig[]) => {
    const prevTagIds = new Set(selectedTags.map((tag: TagConfig) => tag.id));
    const newTagIds = new Set(newTags.map((tag: TagConfig) => tag.id));

    // Find tags to add and remove
    const tagsToAdd = newTags.filter(
      (tag: TagConfig) => !prevTagIds.has(tag.id),
    );
    const tagsToRemove = selectedTags.filter(
      (tag: TagConfig) => !newTagIds.has(tag.id),
    );

    // Update local state immediately for responsive UX
    setSelectedTags(newTags);

    try {
      // Execute mutations sequentially - Remove first, then add
      if (tagsToRemove.length > 0) {
        await removeTags({
          tags: tagsToRemove.map((tag: TagConfig) => tag.id!),
        });
      }

      if (tagsToAdd.length > 0) {
        await setTags({ tags: tagsToAdd.map((tag: TagConfig) => tag.id!) });
      }

      onUpdate();
      toast.success(t("tags_updated_successfully"));
    } catch (error) {
      console.error("Tag operation failed:", error);
      // Revert local state on error
      setSelectedTags(currentTags);
    }
  };

  const isLoadingTags = isSettingTags || isRemovingTags;

  return (
    <div className="flex flex-wrap gap-3">
      {/* Current Tags Display */}

      {/* Tag Selector */}
      {canWrite && (
        <MultiFilterStyleTagSelector
          selected={selectedTags}
          onChange={handleTagChange}
          facilityId={facilityId}
          resource={ENTITY_TO_RESOURCE_MAP[entityType]}
          disabled={isLoadingTags}
          isLoading={isLoadingTags}
          trigger={trigger}
        />
      )}
    </div>
  );
}
