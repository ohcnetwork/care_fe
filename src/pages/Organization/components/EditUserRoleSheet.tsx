import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

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

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
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
  const [selectedRole, setSelectedRole] = useState<string>(userRole.role.id);

  const { data: roles } = useQuery({
    queryKey: ["roles"],
    queryFn: query(routes.role.list),
    enabled: open,
  });

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
      toast.success("User role updated successfully");
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
      toast.success("User removed from organization successfully");
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
    if (selectedRole === userRole.role.id) {
      toast.error("Please select a different role");
      return;
    }

    updateRole({
      user: userRole.user.id,
      role: selectedRole,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || <Button variant="outline">Edit Role</Button>}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Edit User Role</SheetTitle>
          <SheetDescription>
            Update the role for this user in the organization.
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-6 py-4">
          <div className="rounded-lg border p-4 space-y-4">
            <div className="flex items-start gap-4">
              <Avatar
                name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                className="h-12 w-12"
                imageUrl={userRole.user.profile_picture_url}
              />
              <div className="flex flex-col flex-1">
                <span className="font-medium text-lg">
                  {userRole.user.first_name} {userRole.user.last_name}
                </span>
                <span className="text-sm text-gray-500">
                  {userRole.user.email}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div>
                <span className="text-sm text-gray-500">Username</span>
                <p className="text-sm font-medium">{userRole.user.username}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Current Role</span>
                <p className="text-sm font-medium">{userRole.role.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Last Login</span>
                <p className="text-sm font-medium">
                  {userRole.user.last_login
                    ? new Date(userRole.user.last_login).toLocaleDateString()
                    : "Never"}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Role</label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="h-12">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
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

          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleUpdateRole}
              disabled={selectedRole === userRole.role.id}
            >
              Update Role
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full">
                  Remove User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Remove User from Organization
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove {userRole.user.first_name}{" "}
                    {userRole.user.last_name} from this organization? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => removeRole()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
