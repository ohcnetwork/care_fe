import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { cn } from "@/lib/utils";
import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import { EDITABLE_SERVICE_REQUEST_STATUSES } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ServiceRequestActions } from "./components/ServiceRequestActions";
import { ServiceRequestCompletion } from "./components/ServiceRequestCompletion";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import {
  SECTION_HIGHLIGHT_CLASS,
  SERVICE_REQUEST_REPORT_SECTION_IDS,
  ServiceRequestReportWorkflow,
} from "./components/ServiceRequestReportWorkflow";
import { ServiceRequestSpecimenWorkflow } from "./components/ServiceRequestSpecimenWorkflow";
import { getDiagnosticReportCreationState } from "./components/diagnosticReportCreation";

const REQUEST_SECTION_ID = "service-request-section-request";
const SPECIMEN_SECTION_ID = "service-request-section-specimen";

interface ServiceRequestShowProps {
  facilityId: string;
  serviceRequestId: string;
  locationId?: string;
}

const CLASSIFICATIONS_CAN_BE_MARKED_AS_COMPLETE = [
  Classification.surgical_procedure,
  Classification.counselling,
]; // TODO: Procedure won’t be in this list, so remove this variable and directly check for the AD slug instead

export default function ServiceRequestShow({
  facilityId,
  serviceRequestId,
  locationId,
}: ServiceRequestShowProps) {
  const { t } = useTranslation();
  const [focusedSectionId, setFocusedSectionId] = useState<string | null>(null);
  // Set only by a tab click; scrolling never highlights, and it fades after a moment
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const ignoreScrollUntil = useRef(0);
  const { data: request, isLoading: isLoadingRequest } = useQuery({
    queryKey: ["serviceRequest", facilityId, serviceRequestId],
    queryFn: query(serviceRequestApi.retrieveServiceRequest, {
      pathParams: {
        facilityId: facilityId,
        serviceRequestId: serviceRequestId,
      },
    }),
  });

  const activityDefinitionSlug = request?.activity_definition?.slug;

  const { data: activityDefinition, isLoading: isLoadingActivityDefinition } =
    useQuery({
      queryKey: ["activityDefinition", activityDefinitionSlug],
      queryFn: query(activityDefinitionApi.retrieveActivityDefinition, {
        pathParams: {
          facilityId: facilityId,
          activityDefinitionSlug: activityDefinitionSlug || "",
        },
      }),
      enabled: !!activityDefinitionSlug,
    });

  const hasResultsSection =
    request && activityDefinition
      ? getDiagnosticReportCreationState({
          activityDefinition,
          specimens: request.specimens || [],
          diagnosticReports: request.diagnostic_reports || [],
          serviceRequestStatus: request.status,
        }).showResultsSection
      : false;
  const mobileSections = [
    { id: REQUEST_SECTION_ID, label: t("request"), show: true },
    {
      id: SPECIMEN_SECTION_ID,
      label: t("specimen"),
      show: !!activityDefinition?.specimen_requirements?.length,
    },
    {
      id: SERVICE_REQUEST_REPORT_SECTION_IDS.results,
      label: t("results"),
      show: hasResultsSection,
    },
    {
      id: SERVICE_REQUEST_REPORT_SECTION_IDS.review,
      label: t("review"),
      show: !!request?.diagnostic_reports.length,
    },
  ].filter((section) => section.show);
  const sectionKey = mobileSections.map(({ id }) => id).join(",");

  useEffect(() => {
    const ids = sectionKey.split(",");
    const onScroll = () => {
      // Don't fight the smooth scroll started by a tab click
      if (Date.now() < ignoreScrollUntil.current) return;
      const focused = ids
        .filter(
          (id) =>
            (document.getElementById(id)?.getBoundingClientRect().top ??
              Infinity) <=
            window.innerHeight * 0.4,
        )
        .at(-1);
      setFocusedSectionId(focused ?? ids[0]);
    };
    // Capture so scrolling inside any layout container is caught
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, [sectionKey]);

  useEffect(() => {
    if (!activeSectionId) return;
    const timeoutId = setTimeout(() => setActiveSectionId(null), 1200);
    return () => clearTimeout(timeoutId);
  }, [activeSectionId]);

  if (
    isLoadingRequest ||
    (!!activityDefinitionSlug && isLoadingActivityDefinition)
  ) {
    return (
      <div className="p-4 max-w-4xl mx-auto space-y-4">
        <Skeleton className="h-8 w-1/4 mb-4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (!request || !activityDefinition) {
    return <div className="p-4">{t("error_loading_sq_or_ad")}</div>;
  }

  const disableEdit = !EDITABLE_SERVICE_REQUEST_STATUSES.includes(
    request.status,
  );

  const specimenRequirements = activityDefinition.specimen_requirements ?? [];
  const diagnosticReports = [...(request.diagnostic_reports || [])].sort(
    (first, second) =>
      new Date(first.created_date).getTime() -
        new Date(second.created_date).getTime() ||
      first.id.localeCompare(second.id),
  );

  const hasFinalizedReport = diagnosticReports.some(
    (report) => report.status === DiagnosticReportStatus.final,
  );

  const totalReports = diagnosticReports.length;
  const pendingReports = diagnosticReports.filter(
    (report) => report.status !== DiagnosticReportStatus.final,
  ).length;

  const canMarkAsComplete =
    hasFinalizedReport ||
    CLASSIFICATIONS_CAN_BE_MARKED_AS_COMPLETE.includes(request.category);
  const canShowMarkAsCompleteFootBar = canMarkAsComplete && !disableEdit;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      <div
        className={cn(
          "mx-auto w-full max-w-4xl",
          canShowMarkAsCompleteFootBar ? "pb-28" : "pb-5",
        )}
      >
        <div className="space-y-6">
          <ServiceRequestActions
            request={request}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            hasFinalizedReport={hasFinalizedReport}
          />
          <div className="px-2 m-0 mb-2">
            <PatientHeader
              patient={request.encounter.patient}
              facilityId={facilityId}
            />
          </div>

          {mobileSections.length > 1 && (
            <Tabs
              value={focusedSectionId ?? mobileSections[0].id}
              onValueChange={(id) => {
                ignoreScrollUntil.current = Date.now() + 800;
                setFocusedSectionId(id);
                setActiveSectionId(id);
                document.getElementById(id)?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              className="sticky top-0 z-20 -mx-2 bg-gray-50/95 px-2 py-1 backdrop-blur sm:hidden"
            >
              <TabsList className="h-auto w-full">
                {mobileSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="h-9 flex-1 px-1"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          <div
            id={REQUEST_SECTION_ID}
            className={cn(
              "scroll-mt-20 transition-shadow duration-500",
              activeSectionId === REQUEST_SECTION_ID && SECTION_HIGHLIGHT_CLASS,
            )}
          >
            <ServiceRequestDetails
              request={request}
              activityDefinition={activityDefinition}
              facilityId={facilityId}
              locationId={locationId}
              disableEdit={disableEdit}
            />
          </div>

          <div
            id={SPECIMEN_SECTION_ID}
            className={cn(
              "scroll-mt-20 transition-shadow duration-500",
              activeSectionId === SPECIMEN_SECTION_ID &&
                SECTION_HIGHLIGHT_CLASS,
            )}
          >
            <ServiceRequestSpecimenWorkflow
              request={request}
              requirements={specimenRequirements}
              facilityId={facilityId}
              serviceRequestId={serviceRequestId}
              disableEdit={disableEdit}
            />
          </div>

          <ServiceRequestReportWorkflow
            request={request}
            activityDefinition={activityDefinition}
            diagnosticReports={diagnosticReports}
            pendingReports={pendingReports}
            activeSectionId={activeSectionId}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            disableEdit={disableEdit}
          />
        </div>
      </div>
      {canShowMarkAsCompleteFootBar && (
        <ServiceRequestCompletion
          request={request}
          facilityId={facilityId}
          serviceRequestId={serviceRequestId}
          pendingReports={pendingReports}
          totalReports={totalReports}
        />
      )}
    </div>
  );
}
