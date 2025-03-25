import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { UserBase } from "@/types/user/user";
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
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<UserBase>();
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
    queryFn: query(routes.role.list),
    enabled: open,
  });

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

  const handleUserChange = (user: UserBase) => {
    setSelectedUser(user);
    setSelectedRole("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          Link User
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto p-8">
        <SheetHeader>
          <SheetTitle>Link User to Facility</SheetTitle>
          <SheetDescription>
            Search for a user and assign a role to add them to the facility.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4 min-h-full">
          <UserSelector
            selected={selectedUser}
            onChange={handleUserChange}
            placeholder="Search for a user"
            noOptionsMessage="No users found"
            popoverClassName="w-full"
          />
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex gap-4 flex-row">
                  <Avatar
                    imageUrl={selectedUser.profile_picture_url}
                    name={formatName(selectedUser, true)}
                    className="h-12 w-12"
                  />
                  <div className="w-3/4">
                    <p className="font-medium text-lg truncate">
                      {formatName(selectedUser)}
                    </p>
                    <span className="text-sm text-gray-500">
                      {selectedUser.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div className="truncate">
                    <span className="text-sm text-gray-500">Username</span>
                    <p className="text-sm font-medium">
                      {selectedUser.username}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">User Type</span>
                    <p className="text-sm font-medium">
                      {selectedUser.user_type}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Select Role</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="max-h-[calc(100vh-60vh)] w-[var(--radix-select-trigger-width)] max-w-[var(--radix-select-content-available-width)] overflow-y-auto"
                    sideOffset={4}
                    side="bottom"
                    avoidCollisions={true}
                  >
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
              >
                Add to Organization
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
