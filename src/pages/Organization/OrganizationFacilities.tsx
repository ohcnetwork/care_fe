import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { Avatar } from "@/components/Common/Avatar";

import useFilters from "@/hooks/useFilters";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { BaseFacility } from "@/types/facility/facility";

import AddFacilitySheet from "./components/AddFacilitySheet";
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

  const { qParams, Pagination, advancedFilter, resultsPerPage, updateQuery } =
    useFilters({ limit: 14, cacheBlacklist: ["facility"] });

  const { data: facilities, isLoading } = useQuery({
    queryKey: ["organizationFacilities", id, qParams],
    queryFn: query.debounced(routes.facility.list, {
      queryParams: {
        page: qParams.page,
        limit: resultsPerPage,
        offset: (qParams.page - 1) * resultsPerPage,
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
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">{t("facilities")}</h2>
          <AddFacilitySheet organizationId={id} />
        </div>

        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Search facilities..."
            value={qParams.name || ""}
            onChange={(e) =>
              updateQuery({
                name: e.target.value,
                page: 1,
              })
            }
            className="max-w-sm"
            data-cy="search-facility"
          />
        </div>

        <div
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          data-cy="facility-cards"
        >
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/4" />
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-1/3" />
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : facilities?.results?.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-gray-500">
                {t("no_facilities_found")}
              </CardContent>
            </Card>
          ) : (
            facilities?.results?.map((facility: BaseFacility) => (
              <Link
                key={facility.id}
                href={`/facility/${facility.id}`}
                className="block"
              >
                <Card className="h-full hover:border-primary/50 transition-colors overflow-hidden">
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
                    <Link
                      href={`/facility/${facility.id}`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Facility
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        asChild
                      >
                        <div>
                          <CareIcon
                            icon="l-arrow-up-right"
                            className="h-4 w-4"
                          />
                        </div>
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </Link>
            ))
          )}
        </div>
        <Pagination totalCount={facilities?.count ?? 0} />
      </div>
    </OrganizationLayout>
  );
}
