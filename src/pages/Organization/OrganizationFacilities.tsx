import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { Avatar } from "@/components/Common/Avatar";
import SearchInput from "@/components/Common/SearchInput";
import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import useFilters from "@/hooks/useFilters";

import { getPermissions } from "@/common/Permissions";

import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { FacilityListRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";

import useAuthUser from "@/hooks/useAuthUser";
import { Settings } from "lucide-react";
import AddFacilitySheet from "./components/AddFacilitySheet";
import EntityBadge from "./components/EntityBadge";
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
    useFilters({ limit: 15, disableCache: true });

  const { data: facilities, isFetching } = useQuery({
    queryKey: ["organizationFacilities", id, qParams],
    queryFn: query.debounced(facilityApi.list, {
      queryParams: {
        page: qParams.page,
        limit: resultsPerPage,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
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
          <div className="space-y-6">
            <div className="flex justify-between items-center flex-wrap">
              <div className="mt-1 flex flex-col justify-start space-y-2 md:flex-row md:justify-between md:space-y-0">
                <EntityBadge
                  title={t("facilities")}
                  count={facilities?.count}
                  isFetching={isFetching}
                  customTranslation="facility_count"
                />
              </div>
              {canCreateFacility && <AddFacilitySheet organizationId={id} />}
            </div>

            <div className="flex gap-2">
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
                className="w-full max-w-sm"
              />
            </div>

            <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {isFetching ? (
                <CardGridSkeleton count={6} />
              ) : facilities?.results?.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="p-6 text-center text-gray-500">
                    {t("no_facilities_found")}
                  </CardContent>
                </Card>
              ) : (
                facilities?.results?.map((facility: FacilityListRead) => (
                  <Card
                    key={facility.id}
                    className="h-full hover:border-primary/50 transition-colors overflow-hidden"
                  >
                    <div className="relative h-48 bg-gray-100">
                      {facility.read_cover_image_url ? (
                        <img
                          src={facility.read_cover_image_url}
                          alt={facility.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center overflow-hidden">
                          <Avatar name={facility.name} />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-md font-medium text-gray-900">
                              {facility.name}
                            </h3>
                            <div className="font-medium">
                              {facility.facility_type}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      <div className="flex">
                        <Button
                          variant="link"
                          size="icon"
                          className="text-primary"
                          asChild
                        >
                          <Link
                            href={`/facility/${facility.id}/settings/general`}
                            className="text-sm w-full hover:underline"
                          >
                            {t("view_facility")}
                            <CareIcon
                              icon="l-arrow-up-right"
                              className="size-4"
                            />
                          </Link>
                        </Button>
                        {/* GeoAdmin Button to Manage Departments */}
                        {isGeoAdmin && (
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-primary ml-4 p-2"
                            asChild
                          >
                            <Link
                              href={`/facility/${facility.id}/settings/departments`}
                              className="text-sm w-full hover:underline"
                            >
                              <Settings className="size-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </CardFooter>
                  </Card>
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
