import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Avatar } from "@/components/Common/Avatar";
import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { RoleSelect } from "@/components/Common/RoleSelect";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
import { RoleBase } from "@/types/emr/role/role";
import { OrganizationUserRole } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import EditUserSheet from "./EditUserSheet";

interface Props {
  organizationId: string;
  userRole: OrganizationUserRole;
  trigger?: React.ReactNode;
}

export default function EditUserRoleSheet({
  organizationId,
  userRole,
  trigger,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleBase>();
  const [showEditUserSheet, setShowEditUserSheet] = useState(false);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const authUser = useAuthUser();
  const { t } = useTranslation();

  const { mutate: updateRole } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(organizationApi.updateUserRole, {
        pathParams: { id: organizationId, userRoleId: userRole.id },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationUsers", organizationId],
      });
      toast.success(t("user_role_update_success"));
      setOpen(false);
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      errorData.errors.msg.forEach((er) => {
        toast.error(er);
      });
    },
  });

  const { mutate: removeRole } = useMutation({
    mutationFn: () =>
      mutate(organizationApi.removeUserRole, {
        pathParams: { id: organizationId, userRoleId: userRole.id },
      })({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationUsers", organizationId],
      });
      toast.success(t("user_removed_success"));
      setOpen(false);
    },
    onError: (error) => {
      const errorData = error.cause as { errors: { msg: string[] } };
      errorData.errors.msg.forEach((er) => {
        toast.error(er);
      });
    },
  });

  const handleUpdateRole = () => {
    if (!selectedRole || selectedRole.id === userRole.role.id) {
      toast.error(t("select_diff_role"));
      return;
    }

    updateRole({
      user: userRole.user.id,
      role: selectedRole.id,
    });
  };
  const canEditUser =
    authUser.is_superuser || authUser.username === userRole.user.username;

  return (
    <>
      <EditUserSheet
        existingUsername={userRole.user.username}
        open={showEditUserSheet}
        setOpen={setShowEditUserSheet}
      />
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || <Button variant="outline">{t("edit_role")}</Button>}
        </SheetTrigger>
        <SheetContent className="w-[var(--radix-select-trigger-width)]">
          <SheetHeader>
            <SheetTitle>{t("edit_user_role")}</SheetTitle>
            <SheetDescription>
              {t("update_user_role_organization")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <div className="rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="flex items-start gap-4">
                <Avatar
                  name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                  className="size-12"
                  imageUrl={userRole.user.profile_picture_url}
                />
                <div className="flex flex-col flex-1">
                  <span className="font-medium text-lg">
                    {formatName(userRole.user)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                <div>
                  <span className="text-sm text-gray-500">{t("username")}</span>
                  <p className="text-sm font-medium">
                    {userRole.user.username}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">
                    {t("current_role")}
                  </span>
                  <p className="text-sm font-medium">{userRole.role.name}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">
                    {t("last_login")}{" "}
                  </span>
                  <UserStatusIndicator user={userRole.user} />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("select_new_role")}
              </Label>
              <div>
                <RoleSelect value={selectedRole} onChange={setSelectedRole} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={handleUpdateRole}
                disabled={!selectedRole || selectedRole.id === userRole.role.id}
              >
                {t("update_role")}
              </Button>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowRemoveDialog(true)}
                data-cy="remove-user"
              >
                {t("remove_user")}
              </Button>

              {canEditUser && (
                <Button
                  variant="outline"
                  className="w-full"
                  data-cy="edit-user-button"
                  onClick={() => setShowEditUserSheet(true)}
                >
                  {t("edit_user")}
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
      <ConfirmActionDialog
        open={showRemoveDialog}
        onOpenChange={setShowRemoveDialog}
        title={t("remove_user_organization")}
        description={t("remove_user_warn", {
          firstName: userRole.user.first_name,
          lastName: userRole.user.last_name,
        })}
        onConfirm={() => removeRole()}
        variant="destructive"
        confirmText={t("remove")}
      />
    </>
  );
}
