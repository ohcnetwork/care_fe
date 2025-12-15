import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";
import { toast } from "sonner";

import { formatName } from "@/Utils/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";

import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { UserCard } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import organizationApi from "@/types/organization/organizationApi";

import AddUserSheet from "./components/AddUserSheet";
import EditUserRoleSheet from "./components/EditUserRoleSheet";
import EditUserSheet from "./components/EditUserSheet";
import EntityBadge from "./components/EntityBadge";
import LinkUserSheet from "./components/LinkUserSheet";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationUsers({ id, navOrganizationId }: Props) {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [removingUserRole, setRemovingUserRole] = useState<{
    id: string;
    userName: string;
  } | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const searchOptions = [
    {
      key: "username",
      type: "text" as const,
      placeholder: t("search_by_username"),
      value: qParams.name || "",
      display: t("username"),
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: t("search_by_phone_number"),
      value: qParams.phone_number || "",
      display: t("phone_number"),
    },
  ];

  const handleSearch = useCallback(
    (key: string, value: string) => {
      const searchParams = {
        name: key === "username" ? value : "",
        phone_number:
          key === "phone_number"
            ? isValidPhoneNumber(value)
              ? value
              : undefined
            : undefined,
      };
      updateQuery(searchParams);
    },
    [updateQuery],
  );

  const handleFieldChange = () => {
    updateQuery({
      name: undefined,
      phone_number: undefined,
    });
  };

  const openAddUserSheet = qParams.sheet === "add";
  const openLinkUserSheet = qParams.sheet === "link";

  const { mutate: removeUserRole } = useMutation({
    mutationFn: (userRoleId: string) =>
      mutate(organizationApi.removeUserRole, {
        pathParams: { id: id, userRoleId },
      })({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["organizationUsers", id],
      });
      toast.success(t("user_removed_success"));
      setRemovingUserRole(null);
    },
    onError: (error) => {
      const errorData = error.cause as
        | { errors?: { msg?: unknown } }
        | undefined;
      if (
        errorData &&
        errorData.errors &&
        Array.isArray(errorData.errors.msg)
      ) {
        errorData.errors.msg.forEach((er) => {
          toast.error(er);
        });
      } else {
        toast.error(t("something_went_wrong"));
      }
      setRemovingUserRole(null);
    },
  });

  const { data: users, isFetching: isFetchingUsers } = useQuery({
    queryKey: [
      "organizationUsers",
      id,
      qParams.name,
      qParams.phone_number,
      qParams.page,
    ],
    queryFn: query.debounced(organizationApi.listUsers, {
      pathParams: { id },
      queryParams: {
        username: qParams.name,
        phone_number: qParams.phone_number,
        page: qParams.page,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
      },
    }),
    enabled: !!id,
  });

  if (!id) {
    return null;
  }

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
      {({ orgPermissions }) => {
        const { canCreateUser, canManageOrganizationUsers } = getPermissions(
          hasPermission,
          orgPermissions,
        );
        return (
          <>
            {editingUser && (
              <EditUserSheet
                existingUsername={editingUser}
                open={!!editingUser}
                setOpen={(open) => !open && setEditingUser(null)}
              />
            )}
            <ConfirmActionDialog
              open={!!removingUserRole}
              onOpenChange={(open) => !open && setRemovingUserRole(null)}
              title={t("remove_user")}
              description={t("remove_user_confirmation", {
                user: removingUserRole?.userName || "",
              })}
              onConfirm={() => {
                if (removingUserRole) {
                  removeUserRole(removingUserRole.id);
                }
              }}
              confirmText={t("remove")}
              variant="destructive"
            />
            <div className="space-y-6">
              <div className="justify-between items-center flex flex-wrap">
                <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
                  <EntityBadge
                    title={t("users")}
                    count={users?.count}
                    isFetching={isFetchingUsers}
                    translationParams={{ entity: "User" }}
                  />
                </div>
                <div className="gap-2 flex flex-wrap mt-2">
                  {canCreateUser && (
                    <AddUserSheet
                      open={openAddUserSheet}
                      setOpen={(open) => {
                        updateQuery({ sheet: open ? "add" : "" });
                      }}
                      onUserCreated={(user) => {
                        updateQuery({ sheet: "link", username: user.username });
                      }}
                      organizationId={id}
                    />
                  )}
                  {canManageOrganizationUsers && (
                    <LinkUserSheet
                      organizationId={id}
                      open={openLinkUserSheet}
                      setOpen={(open) => {
                        updateQuery({
                          sheet: open ? "link" : "",
                          username: "",
                        });
                      }}
                      preSelectedUsername={qParams.username}
                      onAddUserSheetOpen={() => updateQuery({ sheet: "add" })}
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <SearchInput
                  options={searchOptions}
                  onSearch={handleSearch}
                  onFieldChange={handleFieldChange}
                  className="w-full"
                />
              </div>
              {isFetchingUsers ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  <CardGridSkeleton count={6} />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {users?.results?.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="p-6 text-center text-gray-500">
                        {t("no_users_found")}
                      </CardContent>
                    </Card>
                  ) : (
                    users?.results?.map((userRole) => (
                      <UserCard
                        key={userRole.user.id}
                        user={userRole.user}
                        roleName={userRole.role.name}
                        actions={
                          canManageOrganizationUsers && (
                            <EditUserRoleSheet
                              organizationId={id}
                              userRole={userRole}
                              trigger={
                                <Button variant="outline" size="sm">
                                  <span>{t("edit_role")}</span>
                                </Button>
                              }
                            />
                          )
                        }
                        userOptions={
                          canManageOrganizationUsers && (
                            <DropdownMenu
                              open={openDropdownId === userRole.id}
                              onOpenChange={(open) =>
                                setOpenDropdownId(open ? userRole.id : null)
                              }
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="px-2"
                                  aria-label={t("user_card_options")}
                                >
                                  <CareIcon
                                    icon="l-ellipsis-v"
                                    className="h-4 w-4"
                                  />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  className="cursor-pointer flex items-center gap-2"
                                  onClick={() =>
                                    setEditingUser(userRole.user.username)
                                  }
                                >
                                  {t("edit_profile")}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="cursor-pointer flex items-center gap-2 text-red-600"
                                  onClick={() =>
                                    setRemovingUserRole({
                                      id: userRole.id,
                                      userName: formatName(userRole.user),
                                    })
                                  }
                                >
                                  {t("remove_user")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )
                        }
                      />
                    ))
                  )}
                </div>
              )}
              <Pagination totalCount={users?.count || 0} />
            </div>
          </>
        );
      }}
    </OrganizationLayout>
  );
}
