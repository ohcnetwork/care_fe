import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ClipboardListIcon, PlusIcon, SearchIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterSelect } from "@/components/ui/filter-select";
import { FilterTabs } from "@/components/ui/filter-tabs";
import {
  Frame,
  FrameFooter,
  FrameHeader,
  FramePanel,
} from "@/components/ui/frame";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";
import ServiceRequestTable from "@/components/ServiceRequest/ServiceRequestTable";

import useFilters from "@/hooks/useFilters";
import { encounterServiceRequestListSearch } from "@/lib/router/search/encounter";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import { Priority, Status } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";

export const EncounterServiceRequestTab = () => {
  const {
    selectedEncounter: encounter,
    selectedEncounterId: encounterId,
    facilityId,
    patientId,
    canWriteClinicalData,
  } = useEncounter();
  const { t } = useTranslation();
  const {
    qParams,
    updateQuery,
    Pagination: Pagination,
    resultsPerPage,
  } = useFilters({
    schema: encounterServiceRequestListSearch,
    limit: 20,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["serviceRequests", facilityId, { ...qParams, encounterId }],
    queryFn: query.debounced(serviceRequestApi.listServiceRequest, {
      pathParams: { facilityId: facilityId || "" },
      queryParams: {
        encounter: encounterId,
        offset: ((qParams.page || 1) - 1) * resultsPerPage,
        limit: resultsPerPage,
        status: qParams.status,
        title: qParams.search,
        priority: qParams.priority,
      },
    }),
    enabled: !!facilityId,
  });

  const handleClearStatus = () => {
    updateQuery({ status: undefined });
  };

  const handleClearPriority = () => {
    updateQuery({ priority: undefined });
  };

  return (
    <div className="@container min-w-0 space-y-4">
      <div className="hidden @min-[30rem]:block">
        <FilterTabs
          value={qParams.status || ""}
          onValueChange={(value) => updateQuery({ status: value })}
          options={Object.values(Status)}
          variant="underline"
          showMoreDropdown
          maxVisibleTabs={3}
          defaultVisibleOptions={[
            Status.active,
            Status.completed,
            Status.draft,
          ]}
        />
      </div>

      <Frame stacked>
        <FrameHeader className="gap-3 @min-[30rem]:flex-row @min-[30rem]:flex-wrap @min-[30rem]:items-center">
          <InputGroup className="min-w-0 bg-background @min-[30rem]:w-auto @min-[30rem]:max-w-sm @min-[30rem]:flex-[1_1_12rem]">
            <InputGroupInput
              aria-label={t("search_service_requests")}
              placeholder={t("search_service_requests")}
              value={qParams.search || ""}
              onChange={(e) =>
                updateQuery({ search: e.target.value || undefined })
              }
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>

          <div className="@min-[30rem]:hidden">
            <FilterSelect
              value={qParams.status || ""}
              onValueChange={(value) => updateQuery({ status: value })}
              options={Object.values(Status)}
              label={t("status")}
              onClear={handleClearStatus}
            />
          </div>

          <div className="@min-[30rem]:shrink-0">
            <FilterSelect
              value={qParams.priority || ""}
              onValueChange={(value) => updateQuery({ priority: value })}
              options={Object.values(Priority)}
              label={t("priority")}
              onClear={handleClearPriority}
              className="w-full"
            />
          </div>

          {encounter && facilityId && canWriteClinicalData && (
            <Button
              variant="secondary"
              asChild
              className="w-full @min-[30rem]:ms-auto @min-[30rem]:w-auto @min-[30rem]:shrink-0"
            >
              <Link
                to="/facility/$facilityId/patient/$patientId/encounter/$encounterId/questionnaire/$questionnaireId"
                params={{
                  facilityId,
                  patientId,
                  encounterId,
                  questionnaireId: "service_request",
                }}
              >
                <PlusIcon data-icon="inline-start" aria-hidden="true" />
                {t("create_service_request")}
              </Link>
            </Button>
          )}
        </FrameHeader>

        <FramePanel className="min-w-0 overflow-hidden p-0 **:data-[slot=table-container]:rounded-none **:data-[slot=table-container]:border-0">
          {isLoading ? (
            <div className="p-3">
              <TableSkeleton count={6} />
            </div>
          ) : data?.results?.length ? (
            <ServiceRequestTable
              requests={data.results}
              facilityId={facilityId || ""}
              showPatientInfo={false}
              readOnly={!canWriteClinicalData}
            />
          ) : (
            <EmptyState
              icon={<ClipboardListIcon aria-hidden="true" />}
              title={t("no_service_requests_found")}
              description={
                qParams.search || qParams.status || qParams.priority
                  ? t("adjust_service_request_filters")
                  : undefined
              }
            />
          )}
        </FramePanel>

        {data && data.count > resultsPerPage && (
          <FrameFooter>
            <Pagination totalCount={data.count} noMargin />
          </FrameFooter>
        )}
      </Frame>
    </div>
  );
};
