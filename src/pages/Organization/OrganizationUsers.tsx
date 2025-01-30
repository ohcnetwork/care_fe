import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Avatar } from "@/components/Common/Avatar";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
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
    cacheBlacklist: ["search"],
  });
  const { t } = useTranslation();

  const openAddUserSheet = qParams.sheet === "add";
  const openLinkUserSheet = qParams.sheet === "link";

  const { data: users, isFetching: isFetchingUsers } = useQuery({
    queryKey: ["organizationUsers", id, qParams.search, qParams.page],
    queryFn: query.debounced(organizationApi.listUsers, {
      pathParams: { id },
      queryParams: {
        username: qParams.search,
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
            <EntityBadge
              title={t("users")}
              count={users?.count}
              isFetching={isFetchingUsers}
              translationParams={{ entity: "User" }}
            />
          </div>
          <div className="flex gap-2">
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
            <LinkUserSheet
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                updateQuery({ sheet: open ? "link" : "", username: "" });
              }}
              preSelectedUsername={qParams.username}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search users..."
            value={qParams.search || ""}
            onChange={(e) =>
              updateQuery({
                search: e.target.value as string,
              })
            }
            className="max-w-sm"
            data-cy="search-user"
          />
        </div>
        {isFetchingUsers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {users?.results?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center text-gray-500">
                  {t("no_users_found")}
                </CardContent>
              </Card>
            ) : (
              users?.results?.map((userRole) => (
                <Card key={userRole.id} className="h-full">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col h-full gap-4">
                      <div className="flex gap-4">
                        <Avatar
                          name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                          imageUrl={userRole.user.profile_picture_url}
                          className="h-12 w-12 sm:h-16 sm:w-16 text-xl sm:text-2xl flex-shrink-0"
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-col gap-1">
                            <h1 className="text-base font-bold break-words pr-2">
                              {userRole.user.first_name}{" "}
                              {userRole.user.last_name}
                            </h1>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm text-gray-500 truncate">
                                {userRole.user.username}
                              </span>
                              <UserStatusIndicator user={userRole.user} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-500">{t("role")}</div>
                          <div className="font-medium truncate">
                            {userRole.role.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">
                            {t("phone_number")}
                          </div>
                          <div className="font-medium truncate">
                            {userRole.user.phone_number}
                          </div>
                        </div>
                      </div>

                      <div className="mt-auto pt-2">
                        <EditUserRoleSheet
                          organizationId={id}
                          userRole={userRole}
                          trigger={
                            <Button
                              variant="secondary"
                              size="sm"
                              className="w-full gap-2"
                            >
                              <CareIcon
                                icon="l-arrow-up-right"
                                className="h-4 w-4"
                              />
                              <span>{t("more_details")}</span>
                            </Button>
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
        <Pagination totalCount={users?.count || 0} />
      </div>
    </OrganizationLayout>
  );
}
