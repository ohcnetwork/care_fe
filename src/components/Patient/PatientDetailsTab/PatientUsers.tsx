import {
  onlineManager,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import UserSelector from "@/components/Common/UserSelector";
import { AuthUserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import { getPermissions } from "@/common/Permissions";

import { AppCacheDB } from "@/OfflineSupport/AppcacheDB";
import {
  isOfflineId,
  saveOfflineWrite,
} from "@/OfflineSupport/offlineWriteHelpers";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import roleApi from "@/types/emr/role/roleApi";
import { UserBase } from "@/types/user/user";

import { PatientProps } from ".";

interface AddUserSheetProps {
  patientId: string;
  users: PaginatedResponse<UserBase> | undefined;

  authUser: AuthUserModel;
}

function AddUserSheet({ patientId, users, authUser }: AddUserSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserBase>();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: query(roleApi.listRoles),
    meta: { persist: true },
    networkMode: "online",
    enabled: open,
  });

  const { mutate: assignUser } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(routes.patient.users.addUser, {
        pathParams: { patientId },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patientUsers", patientId],
      });
      toast.success("User added to patient successfully");
      setOpen(false);
      setSelectedUser(undefined);
      setSelectedRole("");
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const queueNewAssignUseroffline = async (
    assignUserData: any,
    selectedUser: UserBase,
    users: PaginatedResponse<UserBase> | undefined,
  ) => {
    try {
      const canAddUser = !users?.results?.some(
        (user) => user.id === selectedUser.id,
      );

      if (!canAddUser) {
        toast.error("User_already_assigned_to_this_patient");
        return;
      }
      const generatedId = `offline-${crypto.randomUUID()}`;
      const offlineWrite = {
        id: generatedId,
        userId: authUser.external_id,
        mutationSyncrouteKey: "assignUser",
        mutationPathParams: { patientId },
        type: "assignUser",
        resourceType: "patient",
        payload: assignUserData,
        parentMutationIds: isOfflineId(patientId) ? [patientId] : [],
      };

      const saveResult = await saveOfflineWrite(offlineWrite);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }

      const updatedUserList: PaginatedResponse<UserBase> = users?.results
        ? {
            ...users,
            results: [
              ...users.results,
              { ...selectedUser, is_Updated_Offline: true },
            ],
            count: (users.count ?? users.results.length) + 1,
          }
        : {
            count: 1,
            results: [{ ...selectedUser, is_Updated_Offline: true }],
          };

      // queryClient.removeQueries({ queryKey: ["patientUsers", patientId] });
      queryClient.setQueryData(["patientUsers", patientId], updatedUserList);

      toast.success("User added to patient successfully");
      setOpen(false);
      setSelectedUser(undefined);
      setSelectedRole("");
    } catch (error) {
      console.error("Error while queueing assign user offline:", error);
      toast.error("Error_while_queueing_assign_user_offline");
    }
  };

  const handleAddUser = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select both user and role");
      return;
    }

    const assignUserData = {
      user: selectedUser.id,
      role: selectedRole,
    };
    if (!onlineManager.isOnline()) {
      await queueNewAssignUseroffline(assignUserData, selectedUser, users);
      return;
    }

    assignUser(assignUserData);
  };

  const handleUserChange = (user: UserBase) => {
    setSelectedUser(user);
    setSelectedRole("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline_primary" data-cy="assign-user-button">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("assign_user")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("assign_user_to_patient")}</SheetTitle>
          <SheetDescription>{t("search_user_description")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4" data-cy="patient-user-selector-container">
            <h3 className="text-sm font-medium">{t("search_user")}</h3>
            <UserSelector
              selected={selectedUser}
              onChange={handleUserChange}
              placeholder={t("search_users")}
              noOptionsMessage={t("no_users_found")}
            />
          </div>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={formatName(selectedUser, true)}
                    imageUrl={selectedUser.profile_picture_url}
                    className="size-12"
                  />
                  <div className="flex flex-col flex-1">
                    <TooltipComponent content={formatName(selectedUser)}>
                      <p className="font-medium text-gray-900 truncate max-w-56 sm:max-w-48 md:max-w-64 lg:max-w-64 xl:max-w-36">
                        {formatName(selectedUser)}
                      </p>
                    </TooltipComponent>
                    <span className="text-sm text-gray-500">
                      {selectedUser.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("username")}
                    </span>
                    <p className="text-sm font-medium">
                      {selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("user_type")}
                    </span>
                    <p className="text-sm font-medium">
                      {selectedUser.user_type}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("phone_number")}
                    </span>
                    <p className="text-sm font-medium truncate">
                      {selectedUser.phone_number
                        ? formatPhoneNumberIntl(selectedUser.phone_number)
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("select_role")}
                </label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger data-cy="patient-user-role-select">
                    <SelectValue placeholder={t("select_role")} />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {roles?.results?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col">
                          <span>{role.name}</span>
                          {role.description && (
                            <span className="text-xs text-gray-500">
                              {role.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                data-cy="patient-user-assign-button"
                className="w-full"
                onClick={handleAddUser}
                disabled={!selectedRole}
              >
                {t("assign_to_patient")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const PatientUsers = ({ patientData }: PatientProps) => {
  const patientId = patientData.id;
  const db = new AppCacheDB();
  const authUser = useAuthUser();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patientData.permissions,
  );

  const { data: users } = useQuery({
    queryKey: ["patientUsers", patientId],
    queryFn: query(routes.patient.users.listUsers, {
      pathParams: { patientId },
    }),
    meta: { persist: true },
    networkMode: "online",
  });

  const queueRemoveUserOffline = async (removeUserId: string) => {
    try {
      const generatedId = `offline-${crypto.randomUUID()}`;
      const offlineWrite = {
        id: generatedId,
        userId: authUser.external_id,
        mutationSyncrouteKey: "removeAssignUser",
        mutationPathParams: { patientId },
        type: "removeAssignUser",
        resourceType: "patient",
        payload: { user: removeUserId },
        parentMutationIds: isOfflineId(patientId) ? [patientId] : [],
      };

      const saveResult = await saveOfflineWrite(offlineWrite);
      if (!saveResult.success) {
        toast.error(saveResult.error);
        return;
      }
      await db.OfflineWrites.where({
        type: "assignUser",
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

      //update the query cache list of users
      const users = queryClient.getQueryData<PaginatedResponse<UserBase>>([
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

      toast.success("User removal queued offline");
    } catch (err) {
      console.error("Error queuing remove user offline:", err);
      toast.error("Error queuing remove user offline");
    }
  };

  const { mutate: removeUser } = useMutation({
    mutationFn: (user: string) =>
      mutate(routes.patient.users.removeUser, {
        pathParams: { patientId },
        body: { user },
      })({ user }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["patientUsers", patientId],
      });
      toast.success("User removed successfully");
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const handleRemoveUser = async (userId: string) => {
    if (!userId) {
      toast.error("User ID is missing");
      return;
    }

    if (!onlineManager.isOnline()) {
      await queueRemoveUserOffline(userId);
      return;
    }

    removeUser(userId);
  };

  const ManageUsers = () => {
    if (!users?.results?.length) {
      return (
        <div className="h-full space-y-2 mt-2 text-center rounded-lg bg-white px-7 py-12 border border-secondary-300 text-lg text-secondary-600">
          {t("no_user_assigned")}
        </div>
      );
    }
    return (
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users?.results.map((user) => (
          <div
            key={user.id}
            className="rounded-lg border border-gray-200 bg-white p-4 shadow-xs relative"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <Avatar
                  name={formatName(user, true)}
                  className="size-10"
                  imageUrl={user.profile_picture_url}
                />
                <div>
                  <h3 className="inline-flex">
                    <TooltipComponent content={formatName(user)}>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-32 sm:max-w-96 md:max-w-32 lg:max-w-28 xl:max-w-36">
                        {formatName(user)}
                      </p>
                    </TooltipComponent>
                  </h3>
                  <p>
                    <TooltipComponent content={user.username}>
                      <p className="text-sm text-gray-500 truncate sm:max-w-96 md:max-w-32 lg:max-w-32 xl:max-w-36">
                        {user.username}
                      </p>
                    </TooltipComponent>
                  </p>
                </div>
              </div>
              {canWritePatient && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-cy="patient-user-remove-button"
                      className="absolute top-0 right-0"
                    >
                      <CareIcon icon="l-trash" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("remove_user")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        <Trans
                          i18nKey="are_you_sure_want_to_remove"
                          values={{ name: formatName(user) }}
                          components={{
                            strong: (
                              <strong className="inline-block align-bottom truncate max-w-32 sm:max-w-96 md:max-w-32 lg:max-w-28 xl:max-w-36" />
                            ),
                          }}
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                      <AlertDialogAction
                        data-cy="patient-user-remove-confirm-button"
                        onClick={() => handleRemoveUser(user.id)}
                        className={cn(
                          buttonVariants({ variant: "destructive" }),
                        )}
                      >
                        {t("remove")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
              <div className="text-sm">
                <div className="text-gray-500">{t("phone_number")}</div>
                <div className="font-medium">
                  {user.phone_number &&
                    formatPhoneNumberIntl(user.phone_number)}
                </div>
              </div>
              <div className="text-sm">
                <div className="text-gray-500">{t("user_type")}</div>
                <div className="font-medium">{user.user_type}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="mt-4 px-4 md:px-0" data-cy="patient-users">
      <div className="group my-2 w-full">
        <div className="h-full space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="mr-4 text-xl font-bold text-secondary-900">
              {t("users")}
            </div>
            {canWritePatient && (
              <AddUserSheet
                authUser={authUser}
                users={users}
                patientId={patientId}
              />
            )}
          </div>
          <ManageUsers />
        </div>
      </div>
    </div>
  );
};
