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
import { RoleSelect } from "@/components/Common/RoleSelect";

import mutate from "@/Utils/request/mutate";
import { formatName } from "@/Utils/utils";
import { RoleBase } from "@/types/emr/role/role";
import { OrganizationUserRole } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

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
  const [selectedRole, setSelectedRole] = useState<RoleBase | undefined>(
    userRole.role,
  );
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

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          {trigger || <Button variant="outline">{t("edit_role")}</Button>}
        </SheetTrigger>
        <SheetContent className="w-[var(--radix-select-trigger-width)]">
          <SheetHeader>
            <SheetTitle>{t("edit_role")}</SheetTitle>
            <SheetDescription>
              {t("update_user_role_organization")}
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-6 py-4">
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="flex items-start gap-4">
                <Avatar
                  name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                  className="size-16"
                  imageUrl={userRole.user.profile_picture_url}
                />
                <div className="flex flex-col gap-1 flex-1">
                  <span className="font-semibold text-lg">
                    {formatName(userRole.user)}
                  </span>
                  <span className="text-sm text-gray-600">
                    {userRole.user.username}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {t("current_role")}
                    </span>
                    <span className="text-sm font-semibold">
                      {userRole.role.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("select_role")}</Label>
              <div>
                <RoleSelect value={selectedRole} onChange={setSelectedRole} />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                {t("cancel")}
              </Button>
              <Button
                onClick={handleUpdateRole}
                disabled={!selectedRole || selectedRole.id === userRole.role.id}
              >
                {t("update_role")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
