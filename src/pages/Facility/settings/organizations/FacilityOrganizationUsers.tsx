import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import {
  CardGridSkeleton,
  CardListSkeleton,
} from "@/components/Common/SkeletonLoading";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import AddUserSheet from "@/pages/Organization/components/AddUserSheet";
import { OrganizationUserRole } from "@/types/organization/organization";

import EditFacilityUserRoleSheet from "./components/EditFacilityUserRoleSheet";
import FacilityOrganizationLayout from "./components/FacilityOrganizationLayout";
import LinkFacilityUserSheet from "./components/LinkFacilityUserSheet";

interface Props {
  id: string;
  facilityId: string;
}

export default function FacilityOrganizationUsers({ id, facilityId }: Props) {
  const [qParams, setQueryParams] = useQueryParams<{
    sheet: string;
    username: string;
  }>();
  const { t } = useTranslation();

  const openAddUserSheet = qParams.sheet === "add";
  const openLinkUserSheet = qParams.sheet === "link";

  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["facilityOrganizationUsers", facilityId, id],
    queryFn: query(routes.facilityOrganization.listUsers, {
      pathParams: { facilityId, organizationId: id },
    }),
    enabled: !!id,
  });

  if (!id) {
    return null;
  }

  if (isLoadingUsers) {
    return (
      <FacilityOrganizationLayout id={id} facilityId={facilityId}>
        <div className="grid gap-4">
          <CardListSkeleton count={1} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        </div>
      </FacilityOrganizationLayout>
    );
  }

  return (
    <FacilityOrganizationLayout id={id} facilityId={facilityId}>
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
            <LinkFacilityUserSheet
              facilityId={facilityId}
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                setQueryParams({ sheet: open ? "link" : "", username: "" });
              }}
              preSelectedUsername={qParams.username}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
                          <span className="text-sm text-gray-500">
                            <span className="mr-2 break-words">
                              {userRole.user.username}
                            </span>
                            <UserStatusIndicator user={userRole.user} />
                          </span>
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
                      <EditFacilityUserRoleSheet
                        facilityId={facilityId}
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
    </FacilityOrganizationLayout>
  );
}
