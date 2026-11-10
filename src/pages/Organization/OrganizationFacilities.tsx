import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Card, CardContent } from "@/components/ui/card";

import SearchInput from "@/components/Common/SearchInput";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import facilityApi from "@/types/facility/facilityApi";

import useAuthUser from "@/hooks/useAuthUser";
import AddFacilitySheet from "./components/AddFacilitySheet";
import EntityBadge from "./components/EntityBadge";
import { OrganizationFacilityCard } from "./components/OrganizationFacilityCard";
import { OrganizationFacilityCardSkeleton } from "./components/OrganizationFacilityCardSkeleton";
import OrganizationLayout from "./components/OrganizationLayout";

interface Props {
  id: string;
  navOrganizationId?: string;
}

export default function OrganizationFacilities({
  id,
  navOrganizationId,
}: Props) {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const { hasPermission } = usePermissions();

  const { isGeoAdmin } = getPermissions(
    hasPermission,
    authUser?.permissions || [],
  );

  const { qParams, Pagination, advancedFilter, resultsPerPage, updateQuery } =
    useFilters({ limit: 12, disableCache: true });

  const { data: facilities, isFetching } = useQuery({
    queryKey: ["organizationFacilities", id, qParams],
    queryFn: query.debounced(facilityApi.list, {
      queryParams: {
        page: qParams.page,
        limit: resultsPerPage,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        organization: id,
        name: qParams.name,
        ...advancedFilter.filter,
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
        const { canCreateFacility } = getPermissions(
          hasPermission,
          orgPermissions,
        );
        return (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <EntityBadge
                title={t("facilities")}
                count={facilities?.count}
                isFetching={isFetching}
              />
              {canCreateFacility && <AddFacilitySheet organizationId={id} />}
            </div>

            <SearchInput
              options={[
                {
                  key: "name",
                  type: "text",
                  placeholder: t("search_by_facility_name"),
                  value: qParams.name || "",
                  display: t("name"),
                },
              ]}
              onSearch={(key, value) =>
                updateQuery({
                  [key]: value || undefined,
                })
              }
              showSearchIcon
              className="w-full sm:max-w-sm"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isFetching ? (
                Array.from({ length: 8 }, (_, index) => (
                  <OrganizationFacilityCardSkeleton key={index} />
                ))
              ) : facilities?.results?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-muted-foreground">
                    {t("no_facilities_found")}
                  </CardContent>
                </Card>
              ) : (
                facilities?.results?.map((facility) => (
                  <OrganizationFacilityCard
                    key={facility.id}
                    facility={facility}
                    showSettings={isGeoAdmin}
                  />
                ))
              )}
            </div>
            <Pagination totalCount={facilities?.count ?? 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
