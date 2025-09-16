import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { UserCard } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import organizationApi from "@/types/organization/organizationApi";

import AddUserSheet from "./components/AddUserSheet";
import EditUserRoleSheet from "./components/EditUserRoleSheet";
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

  const handleSearch = useCallback((key: string, value: string) => {
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
  }, []);

  const handleFieldChange = () => {
    updateQuery({
      name: undefined,
      phone_number: undefined,
    });
  };

  const openAddUserSheet = qParams.sheet === "add";
  const openLinkUserSheet = qParams.sheet === "link";

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
                      updateQuery({ sheet: open ? "link" : "", username: "" });
                    }}
                    preSelectedUsername={qParams.username}
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
                data-cy="search-user"
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
                    />
                  ))
                )}
              </div>
            )}
            <Pagination totalCount={users?.count || 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
