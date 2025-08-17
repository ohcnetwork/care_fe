import { QueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { AuthUserModel } from "@/components/Users/models";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import { OfflineKeyMap, PathParamsObject } from "@/OfflineSupport/offlineKeys";
import {
  isOfflineId,
  saveOfflineWrite,
  saveOfflineWriteData,
} from "@/OfflineSupport/offlineWriteHelpers";
import { PaginatedResponse } from "@/Utils/request/types";
import { PatientRead } from "@/types/emr/patient/patient";
import patientApi from "@/types/emr/patient/patientApi";
import { UserReadMinimal } from "@/types/user/user";

interface QueueAssignUserToPatientParams {
  assignUserData: { user: string; role: string };
  selectedUser: UserReadMinimal;
  users: PaginatedResponse<UserReadMinimal> | undefined;
  patientId: string;
  facilityId: string;
  authUser: AuthUserModel;
  queryClient: QueryClient;
  patientData?: PatientRead;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

interface QueueRemoveUserFromPatientParams {
  removeUserId: string;
  userToRemove: UserReadMinimal;
  patientId: string;
  facilityId: string;
  authUser: AuthUserModel;
  patientData: PatientRead;
  queryClient: QueryClient;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const queueAssignUserToPatient = async ({
  assignUserData,
  selectedUser,
  users,
  patientId,
  facilityId,
  authUser,
  queryClient,
  patientData,
  onSuccess,
  onError,
}: QueueAssignUserToPatientParams): Promise<void> => {
  const { t } = useTranslation();
  const db = new AppCacheDB();

  try {
    const canAddUser = !users?.results?.some(
      (user) => user.id === selectedUser.id,
    );

    if (!canAddUser) {
      toast.error(t("user_already_assigned_to_this_patient"));
      return;
    }
    const generatedId = `offline-${crypto.randomUUID()}`;
    const offlineWrite: saveOfflineWriteData = {
      id: generatedId,
      userId: authUser.external_id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.assign_user_to_patient,
      mutationPathParams: { patientId } satisfies PathParamsObject<
        typeof patientApi.addUser
      >,
      type: OfflineKeyMap.assign_user_to_patient,
      resourceType: "patient",
      payload: assignUserData,
      parentMutationId: isOfflineId(patientId) ? patientId : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineWrite);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return;
    }

    const normalizedData = {
      user: selectedUser,
      role: assignUserData.role,
      patientName: patientData?.name || "Unknown Patient",
    };
    await db.OfflineWrites.update(saveResult.entry.id, {
      normalizedData: normalizedData,
    });

    const updatedUserList: PaginatedResponse<UserReadMinimal> = users?.results
      ? {
          ...users,
          results: [
            ...users.results,
            { ...selectedUser, is_updated_offline: true },
          ],
          count: (users.count ?? users.results.length) + 1,
        }
      : {
          count: 1,
          results: [{ ...selectedUser, is_updated_offline: true }],
        };

    queryClient.setQueryData(["patientUsers", patientId], updatedUserList);

    onSuccess?.();
  } catch (error) {
    const errorObj =
      error instanceof Error ? error : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};

export const queueRemoveUserFromPatient = async ({
  removeUserId,
  userToRemove,
  patientId,
  facilityId,
  authUser,
  patientData,
  queryClient,
  onSuccess,
  onError,
}: QueueRemoveUserFromPatientParams): Promise<void> => {
  const db = new AppCacheDB();

  try {
    const generatedId = `offline-${crypto.randomUUID()}`;
    const offlineWrite = {
      id: generatedId,
      userId: authUser.external_id,
      facilityId: facilityId,
      mutationSyncRouteKey: OfflineKeyMap.remove_user_from_patient,
      mutationPathParams: { patientId } satisfies PathParamsObject<
        typeof patientApi.removeUser
      >,
      type: OfflineKeyMap.remove_user_from_patient,
      resourceType: "patient",
      payload: { user: removeUserId },
      parentMutationId: isOfflineId(patientId) ? patientId : undefined,
    };

    const saveResult = await saveOfflineWrite(offlineWrite);
    if (!saveResult.success) {
      const error = new Error(saveResult.error);
      onError?.(error);
      return;
    }

    const normalizedData = {
      user: userToRemove,
      patientName: patientData.name,
    };
    await db.OfflineWrites.update(saveResult.entry.id, {
      normalizedData: normalizedData,
    });

    await db.OfflineWrites.where({
      type: OfflineKeyMap.assign_user_to_patient,
      resourceType: "patient",
    })
      .and((entry) => {
        const payload = entry.payload as { user: string; role: string };
        return (
          entry.mutationPathParams?.patientId === patientId &&
          payload?.user === removeUserId
        );
      })
      .delete();

    const users = queryClient.getQueryData<PaginatedResponse<UserReadMinimal>>([
      "patientUsers",
      patientId,
    ]);
    const updatedUserList = users
      ? {
          ...users,
          results: users.results.filter((u) => u.id !== removeUserId),
          count: users.count - 1,
        }
      : { count: 0, results: [] };

    queryClient.setQueryData(["patientUsers", patientId], updatedUserList);

    onSuccess?.();
  } catch (err) {
    const errorObj =
      err instanceof Error ? err : new Error("Unknown error occurred");
    onError?.(errorObj);
  }
};
