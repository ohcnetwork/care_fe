import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useQuery } from "@tanstack/react-query";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Input } from "@/components/ui/input";

import query from "@/Utils/request/query";
import useFilters from "@/hooks/useFilters";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";

import { getPermissions } from "@/common/Permissions";
import ServiceAccountSelector from "@/components/Common/ServiceAccountSelector";
import { usePermissions } from "@/context/PermissionContext";
import AddUserSheet from "@/pages/Organization/components/AddUserSheet";
import LinkFacilityUserSheet from "./components/LinkFacilityUserSheet";

interface Props {
  organizationId: string;
  facilityId: string;
  permissions: string[];
}

export default function FacilityOrganizationServiceAccounts({
  organizationId,
  facilityId,
  permissions,
}: Props) {
  const { t } = useTranslation();
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

  const { hasPermission } = usePermissions();

  const openAddUserSheet = sheetState.sheet === "add";
  const openLinkUserSheet = sheetState.sheet === "link";

  const { data: serviceAccounts, isLoading: isLoadingServiceAccounts } =
    useQuery({
      queryKey: [
        "facilityOrganizationUsers",
        facilityId,
        organizationId,
        qParams,
      ],
      queryFn: query.debounced(facilityOrganizationApi.listUsers, {
        pathParams: { facilityId, organizationId },
        queryParams: {
          search_text: qParams.search || undefined,
          limit: resultsPerPage,
          is_service_account: true,
          offset: ((qParams.page || 1) - 1) * resultsPerPage,
        },
      }),
      enabled: !!organizationId,
    });

  const {
    canManageFacilityOrganizationUsers,
    canCreateServiceAccount,
    canManageServiceAccount,
  } = getPermissions(hasPermission, permissions);

  return (
    <div className="space-y-4 mx-auto max-w-4xl md:px-2">
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
                setSheetState({ sheet: "link", username: user.username });
              }}
              isServiceAccount={true}
            />
          )}
          {canManageFacilityOrganizationUsers && (
            <LinkFacilityUserSheet
              facilityId={facilityId}
              organizationId={organizationId}
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
}
