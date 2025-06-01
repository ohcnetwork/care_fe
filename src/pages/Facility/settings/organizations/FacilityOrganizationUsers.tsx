import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { UserCard } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import AddUserSheet from "@/pages/Organization/components/AddUserSheet";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { OrganizationUserRole } from "@/types/organization/organization";

import EditFacilityUserRoleSheet from "./components/EditFacilityUserRoleSheet";
import LinkFacilityUserSheet from "./components/LinkFacilityUserSheet";

interface Props {
  id: string;
  facilityId: string;
  permissions: string[];
}

export default function FacilityOrganizationUsers({
  id,
  facilityId,
  permissions,
}: Props) {
  const [sheetState, setSheetState] = useState<{
    sheet: string;
    username: string;
  }>({
    sheet: "",
    username: "",
  });
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });
  const { t } = useTranslation();

  const openAddUserSheet = sheetState.sheet === "add";
  const openLinkUserSheet = sheetState.sheet === "link";

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["facilityOrganizationUsers", facilityId, id, qParams],
    queryFn: query.debounced(facilityOrganizationApi.listUsers, {
      pathParams: { facilityId, organizationId: id },
      queryParams: {
        search_text: qParams.search || undefined,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
      },
    }),
    enabled: !!id,
  });

  const { hasPermission } = usePermissions();

  if (!id) {
    return null;
  }

  const { canManageFacilityOrganizationUsers, canCreateUser } = getPermissions(
    hasPermission,
    permissions,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-center md:items-end gap-4 w-full justify-between">
        <div className="relative w-full md:w-auto">
          <CareIcon
            icon="l-search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 size-4"
          />
          <Input
            placeholder={t("search_by_username")}
            value={qParams.search || ""}
            onChange={(e) => {
              updateQuery({ search: e.target.value || undefined });
            }}
            className="w-full pl-8"
            data-cy="search-by-username"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto justify-end">
          {canCreateUser && (
            <AddUserSheet
              open={openAddUserSheet}
              setOpen={(open) => {
                setSheetState({ sheet: open ? "add" : "", username: "" });
              }}
              onUserCreated={(user) => {
                setSheetState({ sheet: "link", username: user.username });
              }}
            />
          )}
          {canManageFacilityOrganizationUsers && (
            <LinkFacilityUserSheet
              facilityId={facilityId}
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                setSheetState({
                  sheet: open ? "link" : "",
                  username: "",
                });
              }}
              preSelectedUsername={sheetState.username}
            />
          )}
        </div>
      </div>

      {isLoadingUsers ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
          <CardGridSkeleton count={2} />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4 md:pb-6">
            {!users?.results?.length ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_users_found")}
                </CardContent>
              </Card>
            ) : (
              users.results.map((userRole: OrganizationUserRole) => (
                <UserCard
                  key={userRole.user.id}
                  user={userRole.user}
                  roleName={userRole.role.name}
                  facility={facilityId}
                  actions={
                    canManageFacilityOrganizationUsers && (
                      <EditFacilityUserRoleSheet
                        facilityId={facilityId}
                        organizationId={id}
                        userRole={userRole}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            data-cy="edit-user-role"
                          >
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
          {(users?.results || []).length > 0 &&
            users?.count &&
            users.count > resultsPerPage && (
              <div className="flex justify-center">
                <Pagination totalCount={users.count} />
              </div>
            )}
        </div>
      )}
    </div>
  );
}
