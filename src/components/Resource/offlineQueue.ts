import { QueryClient } from "@tanstack/react-query";

import { AuthUserModel } from "@/components/Users/models";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap, PathParamsObject } from "@/OfflineSupport/offlineKeys";
import {
  normaliZedResourcerequestRecord,
  saveOfflineWrite,
  saveOfflineWriteData,
} from "@/OfflineSupport/offlineWriteHelpers";
import routes from "@/Utils/request/api";
import { PaginatedResponse } from "@/Utils/request/types";
import { PatientRead } from "@/types/emr/patient/patient";
import { FacilityRead } from "@/types/facility/facility";
import {
  CreateResourceRequest,
  ResourceRequest,
  UpdateResourceRequest,
} from "@/types/resourceRequest/resourceRequest";
import { UserReadMinimal } from "@/types/user/user";

interface QueueNewResourceRequestParams {
  resourcePayload: CreateResourceRequest;
  userId: string;
  facilityId: string;
  relatedPatient: string | undefined;
  queryClient: QueryClient;
  authUser: AuthUserModel;
  patientData: PatientRead | undefined;
  assignFacility: FacilityRead | undefined;
  assignedToUser: UserReadMinimal | undefined;
  onSuccess?: (resourceId: string, normalizedResource: ResourceRequest) => void;
  onError?: (error: Error) => void;
}

interface QueueUpdatedResourceRequestParams {
  resourcePayload: UpdateResourceRequest;
  resourceId: string;
  userId: string;
  facilityId: string;
  queryClient: QueryClient;
  authUser: AuthUserModel;
  patientData: PatientRead | undefined;
  assignFacility: FacilityRead | undefined;
  assignedToUser: UserReadMinimal | undefined;
  resourceData: ResourceRequest | undefined;
  onSuccess?: (resourceId: string, normalizedResource: ResourceRequest) => void;
  onError?: (error: Error) => void;
}

interface NormalizeAndSetQueryDataParams {
  entry: any;
  patientData: PatientRead | undefined;
  queryClient: QueryClient;
  authUser: AuthUserModel;
  assignFacility: FacilityRead | undefined;
  assignedToUser: UserReadMinimal | undefined;
  resourceId: string;
  relatedPatient: string | undefined;
  isCreate?: boolean;
}

const updatePaginatedResourceCache = <T extends { id: string }>(
  queryClient: QueryClient,
  queryKey: unknown[],
  updatedResource: T,
  isCreate: boolean | undefined,
) => {
  const prevList = queryClient.getQueryData<PaginatedResponse<T>>(queryKey);

  if (prevList) {
    if (isCreate) {
      // Add new resource to the beginning of the list
      const updatedList: PaginatedResponse<T> = {
        ...prevList,
        count: (prevList.count || 0) + 1,
        results: [updatedResource, ...(prevList.results || [])],
      };
      queryClient.setQueryData(queryKey, updatedList);
    } else {
      // Update existing resource in place
      const updatedList: PaginatedResponse<T> = {
        ...prevList,
        results: prevList.results.map((entry) =>
          entry.id === updatedResource.id ? updatedResource : entry,
        ),
      };
      queryClient.setQueryData(queryKey, updatedList);
    }
  } else {
    // Cache doesn't exist - create new paginated response
    const newList: PaginatedResponse<T> = {
      count: 1,
      results: [updatedResource],
    };
    queryClient.setQueryData(queryKey, newList);
  }
};

const normalizeAndSetQueryData = async ({
  entry,
  patientData,
  queryClient,
  authUser,
  assignFacility,
  assignedToUser,
  resourceId,
  relatedPatient,
  isCreate,
}: NormalizeAndSetQueryDataParams): Promise<ResourceRequest> => {
  const normalizedResource = normaliZedResourcerequestRecord(
    entry,
    patientData,
    assignFacility,
    assignedToUser,
    queryClient,
    authUser,
  );

  const db = new AppCacheDB();
  await db.OfflineWrites.update(entry.id, {
    normalizedData: normalizedResource,
  });

  // Update paginated cache
  updatePaginatedResourceCache(
    queryClient,
    ["resourceRequests", relatedPatient],
    normalizedResource,
    isCreate,
  );

  // Update individual resource cache
  queryClient.setQueryData(
    ["resource_request", resourceId],
    normalizedResource,
  );

  return normalizedResource;
};

export const queueNewResourceRequest = async ({
  resourcePayload,
  userId,
  facilityId,
  relatedPatient,
  queryClient,
  authUser,
  patientData,
  assignFacility,
  assignedToUser,
  onSuccess,
  onError,
}: QueueNewResourceRequestParams): Promise<string | null> => {
  try {
    const generatedId = `offline-${crypto.randomUUID()}`;

    const offlineEntry: saveOfflineWriteData = {
      id: generatedId,
      userId: userId,
      facilityId: String(facilityId),
      mutationSyncRouteKey: OfflineKeyMap.create_resource_request,
      type: OfflineKeyMap.create_resource_request,
      resourceType: "resourceRequest",
      payload: resourcePayload,
      parentMutationId: relatedPatient?.startsWith("offline-")
        ? relatedPatient
        : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineEntry);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return null;
    }

    const normalizedResource = await normalizeAndSetQueryData({
      entry: saveResult.entry,
      patientData,
      queryClient,
      authUser,
      assignFacility,
      assignedToUser,
      resourceId: generatedId,
      relatedPatient,
      isCreate: true,
    });

    // Call success callback with the generated ID and normalized resource
    onSuccess?.(generatedId, normalizedResource);

    return generatedId;
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
    return null;
  }
};

export const queueUpdatedResourceRequest = async ({
  resourcePayload,
  resourceId,
  userId,
  facilityId,
  queryClient,
  authUser,
  patientData,
  assignFacility,
  assignedToUser,
  resourceData,
  onSuccess,
  onError,
}: QueueUpdatedResourceRequestParams): Promise<void> => {
  try {
    if (!resourceId) {
      const error = new Error("Resource ID missing");
      onError?.(error);
      return;
    }

    const db = new AppCacheDB();
    const entry = await db.OfflineWrites.get(resourceId);

    if (entry) {
      const isCreate = entry.type === OfflineKeyMap.create_resource_request;

      const existingPayload = isCreate
        ? (entry.payload as CreateResourceRequest)
        : (entry.payload as UpdateResourceRequest);

      // only assign if resourcePayload.related_patient is undefined/null,
      //  it will happen when updating un-synced resource req
      if (resourcePayload.related_patient == null) {
        resourcePayload.related_patient = existingPayload.related_patient;
      }

      let updatedPayload: CreateResourceRequest | UpdateResourceRequest;

      if (isCreate) {
        const { id: _id, ...rest } = resourcePayload; // remove id to match this of type `createresourcereuest`
        updatedPayload = {
          ...existingPayload,
          ...rest,
        };
      } else {
        updatedPayload = {
          ...existingPayload,
          ...resourcePayload,
        };
      }

      const updatedEntry: any = {
        ...entry,
        payload: updatedPayload,
      };

      await db.OfflineWrites.update(resourceId, updatedEntry);

      const normalizedResource = await normalizeAndSetQueryData({
        entry: updatedEntry,
        patientData,
        queryClient,
        authUser,
        assignFacility,
        assignedToUser,
        resourceId,
        relatedPatient: resourceData?.related_patient?.id,
        isCreate: false,
      });

      // Call success callback with the resource ID and normalized resource
      onSuccess?.(resourceId, normalizedResource);
    } else {
      const offlineEntry: saveOfflineWriteData = {
        id: resourceId,
        userId: userId,
        facilityId: String(facilityId),
        mutationSyncRouteKey: OfflineKeyMap.update_resource_request,
        mutationPathParams: { id: resourceId } satisfies PathParamsObject<
          typeof routes.updateResource
        >,
        type: OfflineKeyMap.update_resource_request,
        resourceType: "resourceRequest",
        payload: resourcePayload,
        serverTimestamp: resourceData?.modified_date,
        useQueryRouteKey: "getResourceDetails",
        useQueryPathParams: { id: resourceId } satisfies PathParamsObject<
          typeof routes.getResourceDetails
        >,
      };

      const saveResult = await saveOfflineWrite(offlineEntry);
      if (!saveResult.success) {
        const error = new Error(saveResult.error);
        onError?.(error);
        return;
      }

      const normalizedResource = await normalizeAndSetQueryData({
        entry: saveResult.entry,
        patientData,
        queryClient,
        authUser,
        assignFacility,
        assignedToUser,
        resourceId,
        relatedPatient: resourceData?.related_patient?.id,
        isCreate: false,
      });

      // Call success callback with the resource ID and normalized resource
      onSuccess?.(resourceId, normalizedResource);
    }
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};
