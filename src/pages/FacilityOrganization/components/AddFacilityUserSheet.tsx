import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
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
import { UserBareMinimum } from "@/components/Users/models";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface Props {
  organizationId: string;
  facilityId: string;
}

interface UserListResponse {
  results: UserBareMinimum[];
  count: number;
}

export default function AddFacilityUserSheet({
  facilityId,
  organizationId,
}: Props) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserBareMinimum>();
  const [selectedRole, setSelectedRole] = useState<string>("");

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: query(routes.role.list),
    enabled: open,
  });

  const { data: users } = useQuery<UserListResponse>({
    queryKey: ["users", facilityId, organizationId],
    queryFn: query(routes.userList),
    enabled: open,
  });

  const { mutate: assignUser } = useMutation({
    mutationFn: (body: { user: string; role: string }) =>
      mutate(routes.facilityOrganization.assignUser, {
        pathParams: { facilityId: facilityId, organizationId: organizationId },
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
      user: selectedUser.external_id,
      role: selectedRole,
    });
  };

  const userOptions =
    users?.results?.map((user: UserBareMinimum) => ({
      label: `${user.first_name} ${user.last_name} (${user.username})`,
      value: user.external_id,
    })) || [];

  const handleUserChange = (value: string) => {
    const user = users?.results?.find(
      (u: UserBareMinimum) => u.external_id === value,
    );
    setSelectedUser(user);
    setSelectedRole("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Add User to Organization</SheetTitle>
          <SheetDescription>
            Search for a user and assign a role to add them to the organization.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4 min-h-full">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Search User</h3>
            <Autocomplete
              options={userOptions}
              value={selectedUser?.external_id || ""}
              onChange={handleUserChange}
              placeholder="Search users..."
              noOptionsMessage="No users found"
            />
          </div>
          {selectedUser && (
            <div className="space-y-4">
              <div className="rounded-lg border p-4 space-y-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    name={`${selectedUser.first_name} ${selectedUser.last_name}`}
                    className="h-12 w-12"
                  />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-lg">
                      {selectedUser.first_name} {selectedUser.last_name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {selectedUser.email}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
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
