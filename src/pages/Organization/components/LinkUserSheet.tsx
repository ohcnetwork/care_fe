import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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

import { Avatar } from "@/components/Common/Avatar";
import UserSelector from "@/components/Common/UserSelector";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import roleApi from "@/types/emr/role/roleApi";
import organizationApi from "@/types/organization/organizationApi";
import { UserReadMinimal } from "@/types/user/user";
import UserApi from "@/types/user/userApi";

interface Props {
  organizationId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  preSelectedUsername?: string;
}

export default function LinkUserSheet({
  organizationId,
  open,
  setOpen,
  preSelectedUsername,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserReadMinimal>();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: preSelectedUser } = useQuery({
    queryKey: ["user", preSelectedUsername],
    queryFn: query(UserApi.get, {
      pathParams: { username: preSelectedUsername || "" },
    }),
    enabled: !!preSelectedUsername,
  });

  useEffect(() => {
    if (preSelectedUser) {
      setSelectedUser(preSelectedUser);
    }
  }, [preSelectedUser]);

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: query(roleApi.listRoles),
    enabled: open,
  });

  const { mutate: assignUser } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(organizationApi.assignUser, {
        pathParams: { id: organizationId },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationUsers", organizationId],
      });
      toast.success("User added to organization successfully");
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

  const handleAddUser = () => {
    if (!selectedUser || !selectedRole) {
      toast.error("Please select both user and role");
      return;
    }

    assignUser({
      user: selectedUser.id,
      role: selectedRole,
    });
  };

  const handleUserChange = (value: UserReadMinimal) => {
    setSelectedUser(value);
    setSelectedRole("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="primary_gradient">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("link_user")}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t("link_user_to_organization")}</SheetTitle>
          <SheetDescription>
            {t("link_user_to_organization_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <UserSelector
            selected={selectedUser}
            onChange={handleUserChange}
            placeholder={t("search_for_a_user")}
            noOptionsMessage={t("no_users_found")}
            popoverClassName="w-full"
          />
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex gap-4 flex-row">
                  <Avatar
                    name={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    imageUrl={selectedUser.profile_picture_url}
                    className="size-12"
                  />
                  <div className="w-3/4">
                    <p className="font-medium text-lg truncate">
                      {formatName(selectedUser)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div>
                    <span className="text-sm text-gray-500">
                      {t("username")}
                    </span>
                    <p className="text-sm font-medium truncate">
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
                <Label className="text-sm font-medium">
                  {t("select_role")}
                </Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger
                    className="h-12"
                    data-cy="select-role-dropdown"
                  >
                    <SelectValue placeholder={t("select_role")} />
                  </SelectTrigger>
                  <SelectContent className="w-[var(--radix-select-trigger-width)]">
                    {roles?.results?.map((role) => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex flex-col text-left">
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
                className="w-full"
                onClick={handleAddUser}
                disabled={!selectedRole}
                data-cy="link-user-button"
              >
                {t("link_to_organization")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
