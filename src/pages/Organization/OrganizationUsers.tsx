import { useQuery } from "@tanstack/react-query";
import { Bot, ChevronRight } from "lucide-react";
import { Link, navigate } from "raviger";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { isValidPhoneNumber } from "react-phone-number-input";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Avatar } from "@/components/Common/Avatar";
import RelativeDateTooltip from "@/components/Common/RelativeDateTooltip";
import SearchInput from "@/components/Common/SearchInput";
import { SectionHeader } from "@/components/Common/SectionHeader";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { Organization } from "@/types/organization/organization";
import organizationApi from "@/types/organization/organizationApi";
import { UserReadMinimal } from "@/types/user/user";

import AddUserSheet from "./components/AddUserSheet";
import EditUserRoleSheet from "./components/EditUserRoleSheet";
import LinkUserSheet from "./components/LinkUserSheet";
import OrganizationLayout, {
  type RouteContext,
} from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
  isServiceAccount?: boolean;
  routeContext?: RouteContext;
}

function UserStatusBadge({ user }: { user: UserReadMinimal }) {
  const { t } = useTranslation();

  if (user.deleted) {
    return (
      <Badge variant="neutral" size="sm">
        <span className="size-1.5 shrink-0 rounded-full bg-current" />
        {t("archived")}
      </Badge>
    );
  }

  if (user.is_service_account) {
    return (
      <Badge variant="secondary" size="sm">
        <Bot />
        {t("service_account")}
      </Badge>
    );
  }

  if (!user.last_login) {
    return (
      <Badge variant="warning" size="sm">
        <span className="size-1.5 shrink-0 rounded-full bg-current" />
        {t("never_logged_in")}
      </Badge>
    );
  }

  return (
    <Badge variant="success" size="sm">
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {t("active")}
    </Badge>
  );
}

export default function OrganizationUsers({
  id,
  navOrganizationId,
  isServiceAccount = false,
  routeContext,
}: Props) {
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 15,
    disableCache: true,
  });
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [organization, setOrganization] = useState<Organization | null>(null);

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
        name: key === "username" ? value : undefined,
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
      isServiceAccount,
    ],
    queryFn: query.debounced(organizationApi.listUsers, {
      pathParams: { id },
      queryParams: {
        username: qParams.name,
        phone_number: qParams.phone_number,
        page: qParams.page,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        is_service_account: isServiceAccount,
      },
    }),
    enabled: !!id,
  });

  if (!id) {
    return null;
  }

  return (
    <>
      <OrganizationLayout
        id={id}
        navOrganizationId={navOrganizationId}
        setOrganization={setOrganization}
        routeContext={routeContext}
      >
        {({ orgPermissions }) => {
          const {
            canCreateUser,
            canManageOrganizationUsers,
            canCreateServiceAccount,
          } = getPermissions(hasPermission, orgPermissions);
          return (
            <div className="space-y-4">
              <SectionHeader
                title={isServiceAccount ? t("service_accounts") : t("users")}
                description={t(
                  isServiceAccount
                    ? "organization_service_accounts_description"
                    : "organization_users_description",
                )}
                count={users?.count}
                isFetching={isFetchingUsers}
                actions={
                  <div className="flex flex-wrap gap-2">
                    {(canCreateUser || canCreateServiceAccount) && (
                      <AddUserSheet
                        open={openAddUserSheet}
                        setOpen={(open) => {
                          updateQuery({ sheet: open ? "add" : "" });
                        }}
                        onUserCreated={(user, meta) => {
                          const skipLinkingCurrentOrganization =
                            organization?.org_type === "role" &&
                            !!meta?.roleOrgIds.includes(id);

                          updateQuery({
                            sheet: skipLinkingCurrentOrganization ? "" : "link",
                            username: skipLinkingCurrentOrganization
                              ? ""
                              : user.username,
                          });
                        }}
                        organizationId={id}
                        isServiceAccount={isServiceAccount}
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
                        isServiceAccount={isServiceAccount}
                      />
                    )}
                  </div>
                }
              />
              <Frame>
                <FrameHeader className="p-1 md:p-2">
                  <SearchInput
                    options={searchOptions}
                    onSearch={handleSearch}
                    onFieldChange={handleFieldChange}
                    selectorVariant="select"
                    className="w-full sm:max-w-xl"
                  />
                </FrameHeader>
                <FramePanel className="overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="px-4">{t("user")}</TableHead>
                        <TableHead className="px-4">
                          {organization?.name
                            ? t("role_in_organization", {
                                organization: organization.name,
                              })
                            : t("role")}
                        </TableHead>
                        {!isServiceAccount && (
                          <TableHead className="px-4">
                            {t("last_login")}
                          </TableHead>
                        )}
                        <TableHead className="px-4">{t("status")}</TableHead>
                        <TableHead className="px-4">
                          <span className="sr-only">{t("actions")}</span>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="bg-background">
                      {isFetchingUsers ? (
                        Array.from({ length: 5 }, (_, index) => (
                          <TableRow key={index}>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-3">
                                <Skeleton className="size-9 rounded-md" />
                                <div className="space-y-1.5">
                                  <Skeleton className="h-4 w-32" />
                                  <Skeleton className="h-3 w-20" />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Skeleton className="h-4 w-24" />
                            </TableCell>
                            {!isServiceAccount && (
                              <TableCell className="px-4 py-3">
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                            )}
                            <TableCell className="px-4 py-3">
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Skeleton className="ml-auto h-12 w-44 md:h-10" />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : !users?.results?.length ? (
                        <TableRow>
                          <TableCell
                            colSpan={isServiceAccount ? 4 : 5}
                            className="p-6 text-center text-sm text-muted-foreground"
                          >
                            {t("no_users_found")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        users.results.map((userRole) => {
                          const { user } = userRole;
                          const userUrl = `/users/${user.username}`;
                          const isViewable = !user.deleted;
                          return (
                            <TableRow
                              key={user.id}
                              onClick={
                                isViewable ? () => navigate(userUrl) : undefined
                              }
                              className={
                                isViewable
                                  ? "cursor-pointer hover:bg-muted/50"
                                  : undefined
                              }
                            >
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                  {!isServiceAccount && (
                                    <Avatar
                                      name={formatName(user, true)}
                                      imageUrl={user.profile_picture_url}
                                      className="size-9 shrink-0"
                                    />
                                  )}
                                  <div className="flex min-w-0 flex-col">
                                    <span className="font-semibold">
                                      {formatName(user)}
                                    </span>
                                    <span className="font-mono text-xs text-muted-foreground">
                                      @{user.username}
                                    </span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                {userRole.role.name}
                              </TableCell>
                              {!isServiceAccount && (
                                <TableCell className="px-4 py-3 text-muted-foreground">
                                  {user.last_login ? (
                                    <RelativeDateTooltip
                                      date={user.last_login}
                                    />
                                  ) : (
                                    t("never")
                                  )}
                                </TableCell>
                              )}
                              <TableCell className="px-4 py-3">
                                <UserStatusBadge user={user} />
                              </TableCell>
                              <TableCell className="px-4 py-3">
                                <div className="flex items-center justify-end gap-2">
                                  {canManageOrganizationUsers && (
                                    // The sheet is portalled, but React events still bubble to the row.
                                    <div onClick={(e) => e.stopPropagation()}>
                                      <EditUserRoleSheet
                                        organizationId={id}
                                        userRole={userRole}
                                        trigger={
                                          <Button
                                            variant="tertiary"
                                            aria-label={`${t("change_role")} ${formatName(user)}`}
                                          >
                                            {t("change_role")}
                                          </Button>
                                        }
                                      />
                                    </div>
                                  )}
                                  {isViewable && (
                                    <Button variant="tertiary" asChild>
                                      <Link
                                        href={userUrl}
                                        aria-label={`${t("view")} ${formatName(user)}`}
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        {t("view")}
                                        <ChevronRight data-icon="inline-end" />
                                      </Link>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </FramePanel>
              </Frame>
              <Pagination totalCount={users?.count || 0} />
            </div>
          );
        }}
      </OrganizationLayout>
    </>
  );
}
