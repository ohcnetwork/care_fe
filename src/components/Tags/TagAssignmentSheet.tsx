import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import mutate from "@/Utils/request/mutate";
import { TagExpiryDialog } from "@/components/Tags/TagExpiryDialog";
import accountApi from "@/types/billing/account/accountApi";
import chargeItemDefinitionApi from "@/types/billing/chargeItemDefinition/chargeItemDefinitionApi";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import prescriptionApi from "@/types/emr/prescription/prescriptionApi";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import {
  TagConfig,
  TagExpiryOffset,
  TagResource,
  TagSetRequest,
} from "@/types/emr/tagConfig/tagConfig";
import deliveryOrderApi from "@/types/inventory/deliveryOrder/deliveryOrderApi";
import locationApi from "@/types/location/locationApi";
import scheduleApis from "@/types/scheduling/scheduleApi";

import requestOrderApi from "@/types/inventory/requestOrder/requestOrderApi";
import { MultiFilterStyleTagSelector } from "./MultiFilterStyleTagSelector";

// Export the new component for backward compatibility
export { MultiFilterStyleTagSelector as TagSelectorPopover };

// Define the entity types that support tags
export type TagEntityType =
  | "patient"
  | "encounter"
  | "appointment"
  | "prescription"
  | "service_request"
  | "delivery_order"
  | "request_order"
  | "account"
  | "charge_item_definition"
  | "location";

// Mapping from entity types to tag resources
const ENTITY_TO_RESOURCE_MAP = {
  patient: TagResource.PATIENT,
  encounter: TagResource.ENCOUNTER,
  appointment: TagResource.APPOINTMENT,
  prescription: TagResource.PRESCRIPTION,
  service_request: TagResource.SERVICE_REQUEST,
  delivery_order: TagResource.DELIVERY_ORDER,
  request_order: TagResource.REQUEST_ORDER,
  account: TagResource.ACCOUNT,
  charge_item_definition: TagResource.CHARGE_ITEM_DEFINITION,
  location: TagResource.LOCATION,
} as const;

// Configuration for different entity types using their respective API files
// TODO: Add more entity configurations here as needed
const ENTITY_CONFIG = {
  patient: {
    setTagsApi: patientApi.setInstanceTags,
    removeTagsApi: patientApi.removeInstanceTags,
    setFacilityTagsApi: patientApi.setFacilityTags,
    removeFacilityTagsApi: patientApi.removeFacilityTags,
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
  delivery_order: {
    setTagsApi: deliveryOrderApi.setTags,
    removeTagsApi: deliveryOrderApi.removeTags,
    displayName: "delivery_order",
  },
  request_order: {
    setTagsApi: requestOrderApi.setTags,
    removeTagsApi: requestOrderApi.removeTags,
    displayName: "request_order",
  },
  account: {
    setTagsApi: accountApi.setTags,
    removeTagsApi: accountApi.removeTags,
    displayName: "account",
  },
  charge_item_definition: {
    setTagsApi: chargeItemDefinitionApi.setTags,
    removeTagsApi: chargeItemDefinitionApi.removeTags,
    displayName: "charge_item_definition",
  },
  location: {
    setTagsApi: locationApi.setTags,
    removeTagsApi: locationApi.removeTags,
    displayName: "location",
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
  pathParamKey?: string; // Key to use for entityId in path params (e.g., 'slug', 'external_id')
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
  pathParamKey = "external_id",
  facilityId,
  currentTags,
  onUpdate,
  patientId,
  canWrite = true,
  trigger: trigger,
}: TagAssignmentSheetProps) {
  const { t } = useTranslation();
  const [selectedTags, setSelectedTags] = useState<TagConfig[]>(currentTags);
  const [pendingSelection, setPendingSelection] = useState<{
    tag: TagConfig;
    tags: TagConfig[];
  } | null>(null);
  const [isUpdatingTags, setIsUpdatingTags] = useState(false);
  const mutationInProgress = useRef(false);

  const entityConfig = ENTITY_CONFIG[entityType];

  const isFacilityTag = (tag: TagConfig) => {
    return !!tag.facility;
  };

  const getTagMutationConfig = (
    tag: TagConfig,
    operation: "set" | "remove",
  ) => {
    const isFacilityPatientTag = entityType === "patient" && isFacilityTag(tag);
    const patientConfig = entityConfig as typeof ENTITY_CONFIG.patient;

    const apiEndpoint = isFacilityPatientTag
      ? operation === "set"
        ? patientConfig.setFacilityTagsApi
        : patientConfig.removeFacilityTagsApi
      : operation === "set"
        ? entityConfig.setTagsApi
        : entityConfig.removeTagsApi;

    const createBodyPayload = (tags: TagSetRequest[]) =>
      isFacilityPatientTag ? { tags, facility: facilityId || null } : { tags };

    return { apiEndpoint, createBodyPayload };
  };

  // Set tags mutation
  const { mutateAsync: setTags, isPending: isSettingTags } = useMutation({
    mutationFn: async (payload: { tags: TagSetRequest[]; tag: TagConfig }) => {
      const { apiEndpoint, createBodyPayload } = getTagMutationConfig(
        payload.tag,
        "set",
      );

      return mutate(apiEndpoint, {
        pathParams: {
          [pathParamKey]: entityId,
          ...(facilityId && { facilityId }),
          ...(patientId && { patientId }),
        },
      })(createBodyPayload(payload.tags));
    },
    onError: (error: unknown) => {
      const errorMessage =
        error instanceof Error ? error.message : t("failed_to_update_tags");
      toast.error(errorMessage);
    },
  });

  // Remove tags mutation
  const { mutateAsync: removeTags, isPending: isRemovingTags } = useMutation({
    mutationFn: async (payload: { tags: TagSetRequest[]; tag: TagConfig }) => {
      const { apiEndpoint, createBodyPayload } = getTagMutationConfig(
        payload.tag,
        "remove",
      );

      return mutate(apiEndpoint, {
        pathParams: {
          [pathParamKey]: entityId,
          ...(facilityId && { facilityId }),
          ...(patientId && { patientId }),
        },
      })(createBodyPayload(payload.tags));
    },
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

  const getUpdatedTags = (
    result: unknown,
    tag: TagConfig,
    fallback: TagConfig[],
  ): TagConfig[] => {
    if (!result || typeof result !== "object") return fallback;

    if (entityType === "patient") {
      const facilityTag = isFacilityTag(tag);
      const assignedTags = facilityTag
        ? "facility_tags" in result && result.facility_tags
        : "instance_tags" in result && result.instance_tags;
      if (Array.isArray(assignedTags)) {
        // Instance responses may omit facility context; retain the other scope.
        return [
          ...fallback.filter(
            (current) => isFacilityTag(current) !== facilityTag,
          ),
          ...(assignedTags as TagConfig[]),
        ];
      }
    } else if ("tags" in result && Array.isArray(result.tags)) {
      return result.tags as TagConfig[];
    }
    return fallback;
  };

  const applyTagChanges = async (
    newTags: TagConfig[],
    offsets: Record<string, TagExpiryOffset | undefined> = {},
  ) => {
    if (mutationInProgress.current) return;
    mutationInProgress.current = true;
    setIsUpdatingTags(true);

    const prevTagIds = new Set(selectedTags.map((tag) => tag.id));
    const newTagIds = new Set(newTags.map((tag) => tag.id));
    const tagsToAdd = newTags.filter((tag) => !prevTagIds.has(tag.id));
    const tagsToRemove = selectedTags.filter((tag) => !newTagIds.has(tag.id));
    let confirmedTags = selectedTags;
    let changed = false;

    try {
      for (const tag of tagsToRemove) {
        const result = await removeTags({
          tags: [{ tag: tag.id }],
          tag,
        });
        confirmedTags = getUpdatedTags(
          result,
          tag,
          confirmedTags.filter((current) => current.id !== tag.id),
        );
        changed = true;
        setSelectedTags(confirmedTags);
      }

      for (const tag of tagsToAdd) {
        const tagRequest: TagSetRequest = { tag: tag.id };
        if (offsets[tag.id]) tagRequest.expiry_offset = offsets[tag.id];
        const result = await setTags({
          tags: [tagRequest],
          tag,
        });
        confirmedTags = getUpdatedTags(result, tag, [...confirmedTags, tag]);
        changed = true;
        setSelectedTags(confirmedTags);
      }

      toast.success(t("tags_updated_successfully"));
    } catch (error) {
      console.error("Tag operation failed:", error);
    } finally {
      // Refetch successful changes even if a later operation failed.
      mutationInProgress.current = false;
      setIsUpdatingTags(false);
      if (changed) onUpdate();
    }
  };

  const handleTagChange = (newTags: TagConfig[]) => {
    if (mutationInProgress.current || pendingSelection) return;
    const tagWithCustomExpiry = newTags.find(
      (tag) =>
        tag.expiry_metadata?.modification_allowed &&
        !selectedTags.some((current) => current.id === tag.id),
    );
    if (tagWithCustomExpiry) {
      setPendingSelection({ tag: tagWithCustomExpiry, tags: newTags });
      return;
    }
    void applyTagChanges(newTags);
  };

  const isTagMutationInProgress =
    isUpdatingTags || isSettingTags || isRemovingTags || !!pendingSelection;

  return (
    <>
      {pendingSelection && (
        <TagExpiryDialog
          key={pendingSelection.tag.id}
          tag={pendingSelection.tag}
          onCancel={() => setPendingSelection(null)}
          onApply={(offset) => {
            const { tag, tags } = pendingSelection;
            setPendingSelection(null);
            void applyTagChanges(tags, { [tag.id]: offset });
          }}
        />
      )}
      {canWrite && (
        <MultiFilterStyleTagSelector
          selected={selectedTags}
          onChange={handleTagChange}
          facilityId={facilityId}
          resource={ENTITY_TO_RESOURCE_MAP[entityType]}
          isTagMutationInProgress={isTagMutationInProgress}
          trigger={trigger}
        />
      )}
    </>
  );
}
