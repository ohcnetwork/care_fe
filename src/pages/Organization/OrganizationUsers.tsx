import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { formatPhoneNumberIntl } from "react-phone-number-input";
import { isValidPhoneNumber } from "react-phone-number-input";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import SearchByMultipleFields from "@/components/Common/SearchByMultipleFields";
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
    disableCache: true,
  });
  const { t } = useTranslation();

  const searchOptions = [
    {
      key: "username",
      type: "text" as const,
      placeholder: "Search by username",
      value: qParams.name || "",
    },
    {
      key: "phone_number",
      type: "phone" as const,
      placeholder: "Search by phone number",
      value: qParams.phone_number || "",
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
      <div className="space-y-4 md:space-y-6">
        {/* Header section with title and action buttons */}
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center">
            <EntityBadge
              title={t("users")}
              count={users?.count}
              isFetching={isFetchingUsers}
              translationParams={{ entity: "User" }}
            />
          </div>
          <div className="flex flex-wrap gap-2">
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

        {/* Search section */}
        <SearchByMultipleFields
          id="user-search"
          options={searchOptions}
          initialOptionIndex={Math.max(
            searchOptions.findIndex((option) => option.value !== ""),
            0,
          )}
          onSearch={handleSearch}
          onFieldChange={handleFieldChange}
          className="w-full"
          data-cy="search-user"
        />

        {/* User cards grid */}
        {isFetchingUsers ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CardGridSkeleton count={6} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users?.results?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-4 sm:p-6 text-center text-gray-500">
                  {t("no_users_found")}
                </CardContent>
              </Card>
            ) : (
              users?.results?.map((userRole) => (
                <Card key={userRole.id} className="h-full">
                  <CardContent className="p-4 flex flex-col h-full justify-between">
                    <div className="flex items-start gap-3">
                      <Avatar
                        name={`${userRole.user.first_name} ${userRole.user.last_name}`}
                        imageUrl={userRole.user.profile_picture_url}
                        className="h-8 w-8 sm:h-10 sm:w-10 text-xl flex-shrink-0"
                      />

                      <div className="flex flex-col min-w-0 flex-1">
                        {/* Status indicator first, then name below */}
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-gray-500">
                            <UserStatusIndicator user={userRole.user} />
                          </span>
                          <h1 className="text-[15px] font-bold break-words max-w-full">
                            {userRole.user.first_name} {userRole.user.last_name}
                          </h1>
                          <span className="text-sm text-gray-500 break-words max-w-full">
                            {userRole.user.username}
                          </span>
                        </div>

                        {/* Role and phone info stacked vertically */}
                        <div className="mt-3 space-y-3 text-sm">
                          <div>
                            <div className="text-gray-500 font-medium">
                              {t("role")}
                            </div>
                            <div className="font-medium truncate">
                              {userRole.role.name ?? "-"}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 font-medium">
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

                    {/* Action buttons section with fixed width */}
                    <div className="mt-4 -mx-6 -mb-4 rounded-b-md py-3 px-3 bg-transparent flex flex-col sm:flex-row gap-1">
                      <EditUserRoleSheet
                        organizationId={id}
                        userRole={userRole}
                        trigger={
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-center"
                          >
                            <span>{t("edit_role")}</span>
                          </Button>
                        }
                      />
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                      >
                        <Link href={`/users/${userRole.user.username}`}>
                          <CareIcon
                            icon="l-arrow-up-right"
                            className="text-lg"
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
        )}
        <Pagination totalCount={users?.count || 0} />
      </div>
    </OrganizationLayout>
  );
}
