import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import query from "@/Utils/request/query";
import { OrganizationUserRole } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";

import AddUserSheet from "./components/AddUserSheet";
import EditUserRoleSheet from "./components/EditUserRoleSheet";
import LinkUserSheet from "./components/LinkUserSheet";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationUsers({ id, navOrganizationId }: Props) {
  const [qParams, setQueryParams] = useQueryParams<{
    sheet: string;
    username: string;
  }>();
  const { t } = useTranslation();

  const openAddUserSheet = qParams.sheet === "add";
  const openLinkUserSheet = qParams.sheet === "link";

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["organizationUsers", id],
    queryFn: query(organizationApi.listUsers, {
      pathParams: { id },
    }),
    enabled: !!id,
  });

  if (!id) {
    return null;
  }

  if (isLoadingUsers) {
    return (
      <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </OrganizationLayout>
    );
  }

  return (
    <OrganizationLayout id={id} navOrganizationId={navOrganizationId}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t("users")}</h2>
          <div className="flex gap-2">
            <AddUserSheet
              open={openAddUserSheet}
              setOpen={(open) => {
                setQueryParams({ sheet: open ? "add" : "", username: "" });
              }}
              onUserCreated={(user) => {
                setQueryParams({ sheet: "link", username: user.username });
              }}
            />
            <LinkUserSheet
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                setQueryParams({ sheet: open ? "link" : "", username: "" });
              }}
              preSelectedUsername={qParams.username}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users?.results?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                {t("no_users_found")}
              </CardContent>
            </Card>
          ) : (
            users?.results?.map((userRole: OrganizationUserRole) => (
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
                            {userRole.user.first_name} {userRole.user.last_name}
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
                        <div className="text-gray-500">{t("phone_number")}</div>
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
      </div>
    </OrganizationLayout>
  );
}
