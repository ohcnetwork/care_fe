import { useQuery } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterSelect } from "@/components/ui/filter-select";
import { FilterTabs } from "@/components/ui/filter-tabs";
import { Input } from "@/components/ui/input";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import useBreakpoints from "@/hooks/useBreakpoints";
import useFilters from "@/hooks/useFilters";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { inactiveEncounterStatus } from "@/types/emr/encounter/encounter";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

export const EncounterServiceRequestTab = () => {
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    facilityId,
    patientId,
  } = useEncounter();
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination: Pagination,
    resultsPerPage,
  } = useFilters({
    limit: 20,
    disableCache: true,
  });

  const maxVisibleTabs = useBreakpoints({ default: 2, md: 3 });

  const { data, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, encounterId, qParams],
    queryFn: query.debounced(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId: facilityId || "" },
      queryParams: {
        encounter: encounterId,
        offset: ((qParams.page ?? 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        status: qParams.status,
        title: qParams.search,
        priority: qParams.priority,
      },
    }),
    enabled: !!facilityId,
  });

  const handleClearPriority = () => {
    updateQuery({ priority: undefined });
  };

  const handleClearStatus = () => {
    updateQuery({ status: undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <div className="hidden md:block">
          <FilterTabs
            value={qParams.status || ""}
            onValueChange={(value) => updateQuery({ status: value })}
            options={Object.values(Status)}
            variant="background"
            showAllOption={true}
            allOptionLabel="all"
            showMoreDropdown={true}
            maxVisibleTabs={maxVisibleTabs}
            defaultVisibleOptions={[
              Status.active,
              Status.completed,
              Status.draft,
            ]}
            className="w-auto overflow-x-auto"
          />
        </div>

        <div className="w-full md:hidden">
          <FilterSelect
            value={qParams.status || ""}
            onValueChange={(value) => updateQuery({ status: value })}
            options={Object.values(Status)}
            label={t("status")}
            onClear={handleClearStatus}
          />
        </div>

        <div className="w-full md:w-auto">
          <FilterSelect
            value={qParams.priority || ""}
            onValueChange={(value) => updateQuery({ priority: value })}
            options={Object.values(Priority)}
            label={t("priority")}
            onClear={handleClearPriority}
          />
        </div>

        <div className="flex items-center gap-4 md:ml-auto">
          <div className="relative w-full md:w-[300px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <CareIcon icon="l-search" className="size-5" />
            </span>
            <Input
              placeholder={t("search_service_requests")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
              className="w-full md:w-[300px] pl-10 border border-gray-400 rounded-md"
            />
          </div>

          {encounter && !inactiveEncounterStatus.includes(encounter.status) && (
            <Button variant="primary">
              <Link
                href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/service_request`}
                className="flex items-center"
              >
                <PlusIcon className="size-5 mr-1" />
                {t("create_service_request")}
              </Link>
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton count={6} />
      ) : (
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              {data?.results?.length ? (
                <ServiceRequestTable
                  requests={data.results}
                  facilityId={facilityId || ""}
                  showPatientInfo={false}
                />
              ) : (
                <div className="p-6 text-center text-gray-500">
                  {t("no_service_requests_found")}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-center">
            <Pagination totalCount={data?.count || 0} />
          </div>
        </div>
      )}
    </div>
  );
};
