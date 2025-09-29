import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { RoleSelect } from "@/components/Common/RoleSelect";
import UserSelector from "@/components/Common/UserSelector";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import patientApi from "@/types/emr/patient/patientApi";
import { RoleBase } from "@/types/emr/role/role";
import { UserReadMinimal } from "@/types/user/user";

import { PatientProps } from ".";

interface AddUserSheetProps {
  patientId: string;
}

function AddUserSheet({ patientId }: AddUserSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserReadMinimal>();
  const [selectedRole, setSelectedRole] = useState<RoleBase>();

  const { mutate: assignUser } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(patientApi.addUser, {
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
      setSelectedRole(undefined);
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string }[] };
      errorData.errors.forEach((er) => {
        toast.error(er.msg);
      });
    },
  });

  const handleAddUser = () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select both user and role");
      return;
    }

    assignUser({
      user: selectedUser.id,
      role: selectedRole.id,
    });
  };

  const handleUserChange = (user: UserReadMinimal) => {
    setSelectedUser(user);
    setSelectedRole(undefined);
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
                <div>
                  <RoleSelect value={selectedRole} onChange={setSelectedRole} />
                </div>
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
  const [userToRemove, setUserToRemove] = useState<UserReadMinimal | null>(
    null,
  );

  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const { canWritePatient } = getPermissions(
    hasPermission,
    patientData.permissions,
  );

  const { data: users } = useQuery({
    queryKey: ["patientUsers", patientId],
    queryFn: query(patientApi.listUsers, {
      pathParams: { patientId },
    }),
  });

  const { mutate: removeUser } = useMutation({
    mutationFn: (user: string) =>
      mutate(patientApi.removeUser, {
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
                <Button
                  variant="ghost"
                  size="icon"
                  data-cy="patient-user-remove-button"
                  className="absolute top-0 right-0"
                  onClick={() => setUserToRemove(user)}
                >
                  <CareIcon icon="l-trash" />
                </Button>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2  gap-y-2">
              <div className="text-sm">
                <div className="text-gray-500">{t("phone_number")}</div>
                <div className="font-medium">
                  {user.phone_number &&
                    formatPhoneNumberIntl(user.phone_number)}
                </div>
              </div>
              <div className="text-sm ml-4">
                <div className="text-gray-500">{t("user_type")}</div>
                <div className="font-medium">{user.user_type}</div>
              </div>
            </div>
            <ConfirmActionDialog
              open={!!userToRemove}
              onOpenChange={(open) => !open && setUserToRemove(null)}
              title={t("remove_user")}
              description={
                <Trans
                  i18nKey="are_you_sure_want_to_remove"
                  values={{
                    name: formatName(user),
                  }}
                  components={{
                    strong: (
                      <strong className="inline-block align-bottom truncate max-w-72 sm:max-w-full md:max-w-full lg:max-w-full xl:max-w-full" />
                    ),
                  }}
                />
              }
              variant="destructive"
              confirmText={t("remove")}
              onConfirm={() => removeUser(userToRemove!.id)}
            />
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
            {canWritePatient && <AddUserSheet patientId={patientId} />}
          </div>
          <ManageUsers />
        </div>
      </div>
    </div>
  );
};
