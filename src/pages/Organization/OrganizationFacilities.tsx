import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Frame, FrameHeader, FramePanel } from "@/components/ui/frame";

import SearchInput from "@/components/Common/SearchInput";
import { SectionHeader } from "@/components/Common/SectionHeader";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import facilityApi from "@/types/facility/facilityApi";

import useAuthUser from "@/hooks/useAuthUser";
import AddFacilitySheet from "./components/AddFacilitySheet";
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
            <SectionHeader
              title={t("facilities")}
              description={t("organization_facilities_description")}
              count={facilities?.count}
              isFetching={isFetching}
              actions={
                canCreateFacility && <AddFacilitySheet organizationId={id} />
              }
            />
            <Frame>
              <FrameHeader className="p-1 md:p-2">
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
              </FrameHeader>
              <FramePanel>
                {!isFetching && facilities?.results?.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    {t("no_facilities_found")}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {isFetching
                      ? Array.from({ length: 8 }, (_, index) => (
                          <OrganizationFacilityCardSkeleton key={index} />
                        ))
                      : facilities?.results?.map((facility) => (
                          <OrganizationFacilityCard
                            key={facility.id}
                            facility={facility}
                            showSettings={isGeoAdmin}
                          />
                        ))}
                  </div>
                )}
              </FramePanel>
            </Frame>
            <Pagination totalCount={facilities?.count ?? 0} />
          </div>
        );
      }}
    </OrganizationLayout>
  );
}
