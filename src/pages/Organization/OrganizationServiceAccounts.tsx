import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Input } from "@/components/ui/input";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import ServiceAccountSelector from "@/components/Common/ServiceAccountSelector";
import { usePermissions } from "@/context/PermissionContext";
import organizationApi from "@/types/organization/organizationApi";

import AddUserSheet from "./components/AddUserSheet";
import LinkUserSheet from "./components/LinkUserSheet";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationServiceAccounts({
  id,
  navOrganizationId,
}: Props) {
  const { t } = useTranslation();
  const { qParams, updateQuery, Pagination, resultsPerPage } = useFilters({
    limit: 12,
    disableCache: true,
  });
  const { hasPermission } = usePermissions();

  const [sheetState, setSheetState] = useState<{
    sheet: string;
    username: string;
  }>({
    sheet: "",
    username: "",
  });

  const openAddUserSheet = sheetState.sheet === "add";
  const openLinkUserSheet = sheetState.sheet === "link";

  const { data: serviceAccounts, isLoading: isLoadingServiceAccounts } =
    useQuery({
      queryKey: ["organizationUsers", id, qParams.search, qParams.page],
      queryFn: query.debounced(organizationApi.listUsers, {
        pathParams: { id },
        queryParams: {
          username: qParams.search,
          is_service_account: true,
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
        const {
          canCreateServiceAccount,
          canManageOrganizationUsers,
          canManageServiceAccount,
        } = getPermissions(hasPermission, orgPermissions);

        return (
          <div className="space-y-4">
            <div className="flex flex-col flex-wrap sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <div className="relative w-full sm:w-72 max-w-full">
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
                />
              </div>

              <div className="flex gap-2 w-full sm:w-auto justify-end">
                {canCreateServiceAccount && (
                  <AddUserSheet
                    open={openAddUserSheet}
                    setOpen={(open) => {
                      setSheetState({ sheet: open ? "add" : "", username: "" });
                    }}
                    onUserCreated={(user) => {
                      setSheetState({
                        sheet: "link",
                        username: user.username,
                      });
                    }}
                    organizationId={id}
                    isServiceAccount={true}
                  />
                )}
                {canManageOrganizationUsers && (
                  <LinkUserSheet
                    organizationId={id}
                    open={openLinkUserSheet}
                    setOpen={(open) => {
                      setSheetState({
                        sheet: open ? "link" : "",
                        username: "",
                      });
                    }}
                    preSelectedUsername={sheetState.username}
                    isServiceAccount={true}
                  />
                )}
              </div>
            </div>

            <ServiceAccountSelector
              serviceAccounts={serviceAccounts}
              isLoading={isLoadingServiceAccounts}
              canManageServiceAccount={canManageServiceAccount}
            />

            {serviceAccounts && serviceAccounts.count > resultsPerPage && (
              <div className="flex justify-center">
                <Pagination totalCount={serviceAccounts.count} />
              </div>
            )}
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
