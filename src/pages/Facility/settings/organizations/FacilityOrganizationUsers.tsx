import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Avatar } from "@/components/Common/Avatar";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";
import { UserStatusIndicator } from "@/components/Users/UserListAndCard";

import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import AddUserSheet from "@/pages/Organization/components/AddUserSheet";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import { OrganizationUserRole } from "@/types/organization/organization";

import EditFacilityUserRoleSheet from "./components/EditFacilityUserRoleSheet";
import FacilityOrganizationLayout from "./components/FacilityOrganizationLayout";
import LinkFacilityUserSheet from "./components/LinkFacilityUserSheet";

interface Props {
  id: string;
  facilityId: string;
}

export default function FacilityOrganizationUsers({ id, facilityId }: Props) {
  const [sheetState, setSheetState] = useState<{
    sheet: string;
    username: string;
  }>({
    sheet: "",
    username: "",
  });
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
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

  if (!id) {
    return null;
  }

  return (
    <FacilityOrganizationLayout id={id} facilityId={facilityId}>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 w-full justify-between">
          <div className="relative w-full md:w-auto">
            <CareIcon
              icon="l-search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 h-4 w-4"
            />
            <Input
              placeholder={t("search_by_user_name")}
              value={qParams.search || ""}
              onChange={(e) => {
                updateQuery({ search: e.target.value || undefined });
              }}
              className="w-full pl-8"
            />
          </div>
          <div className="flex gap-2 w-full md:w-auto justify-end">
            <AddUserSheet
              open={openAddUserSheet}
              setOpen={(open) => {
                setSheetState({ sheet: open ? "add" : "", username: "" });
              }}
              onUserCreated={(user) => {
                setSheetState({ sheet: "link", username: user.username });
              }}
            />
            <LinkFacilityUserSheet
              facilityId={facilityId}
              organizationId={id}
              open={openLinkUserSheet}
              setOpen={(open) => {
                setSheetState({ sheet: open ? "link" : "", username: "" });
              }}
              preSelectedUsername={sheetState.username}
            />
          </div>
        </div>

        {isLoadingUsers ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-4">
              {!users?.results?.length ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_users_found")}
                  </CardContent>
                </Card>
              ) : (
                users.results.map((userRole: OrganizationUserRole) => (
                  <Card key={userRole.id} className="h-full">
                    <CardContent className="p-4 sm:p-6 flex flex-col h-full justify-between">
                      <div className="flex items-start gap-3">
                        <Avatar
                          name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                          imageUrl={userRole.user.profile_picture_url}
                          className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl flex-shrink-0"
                        />

                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-start justify-between">
                              <h1 className="text-base font-bold break-words pr-2">
                                {userRole.user.first_name}{" "}
                                {userRole.user.last_name}
                              </h1>
                              <span className="text-sm text-gray-500">
                                <UserStatusIndicator user={userRole.user} />
                              </span>
                            </div>
                            <span className="text-sm text-gray-500 mr-2 break-words">
                              {userRole.user.username}
                            </span>
                          </div>
                          <div className="mt-4 -ml-12 sm:ml-0 grid grid-cols-2 gap-2 text-sm">
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
                                {userRole.user.phone_number
                                  ? formatPhoneNumberIntl(
                                      userRole.user.phone_number,
                                    )
                                  : "-"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 -mx-2 -mb-2 sm:-mx-4 sm:-mb-4 rounded-md py-4 px-4 bg-gray-50 flex justify-end gap-2">
                        <EditFacilityUserRoleSheet
                          facilityId={facilityId}
                          organizationId={id}
                          userRole={userRole}
                          trigger={
                            <Button variant="outline" size="sm">
                              <span>{t("edit_role")}</span>
                            </Button>
                          }
                        />
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={`/facility/${facilityId}/users/${userRole.user.username}`}
                            basePath="/"
                          >
                            <CareIcon
                              icon="l-arrow-up-right"
                              className="text-lg mr-1"
                            />
                            <span>{t("see_details")}</span>
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
    </FacilityOrganizationLayout>
  );
}
