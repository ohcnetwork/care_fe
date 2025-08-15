import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

import { Avatar } from "@/components/Common/Avatar";
import { RoleSelect } from "@/components/Common/RoleSelect";
import UserSelector from "@/components/Common/UserSelector";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { RoleBase } from "@/types/emr/role/role";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { UserReadMinimal } from "@/types/user/user";
import UserApi from "@/types/user/userApi";

interface Props {
  organizationId: string;
  facilityId: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  preSelectedUsername?: string;
}

export default function LinkFacilityUserSheet({
  facilityId,
  organizationId,
  open,
  setOpen,
  preSelectedUsername,
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserReadMinimal>();
  const [selectedRole, setSelectedRole] = useState<RoleBase>();

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

  const { mutate: assignUser } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(facilityOrganizationApi.assignUser, {
        pathParams: { facilityId: facilityId, organizationId: organizationId },
        body,
      })(body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["facilityOrganizationUsers", facilityId, organizationId],
      });
      toast.success("User added to organization successfully");
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
        <Button data-cy="link-user">
          <CareIcon icon="l-plus" className="mr-2 size-4" />
          {t("link_user")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-8">
        <SheetHeader>
          <SheetTitle>{t("link_user_to_facility")}</SheetTitle>
          <SheetDescription>
            {t("link_user_to_facility_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4 min-h-full">
          <UserSelector
            selected={selectedUser}
            onChange={handleUserChange}
            placeholder={t("search_for_a_user")}
            noOptionsMessage="No users found"
            popoverClassName="w-full"
          />
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4 space-y-4">
                <div className="flex gap-4 flex-row">
                  <Avatar
                    imageUrl={selectedUser.profile_picture_url}
                    name={formatName(selectedUser, true)}
                    className="size-12"
                  />
                  <div className="w-3/4">
                    <p className="font-medium text-lg truncate">
                      {formatName(selectedUser)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-200">
                  <div className="truncate">
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
                className="w-full"
                onClick={handleAddUser}
                disabled={!selectedRole}
                data-cy="add-user-to-organization"
              >
                {t("add_to_organization")}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
