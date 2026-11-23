import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import query from "@/Utils/request/query";
import BackButton from "@/components/Common/BackButton";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/lib/utils";
import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import { EDITABLE_SERVICE_REQUEST_STATUSES } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ServiceRequestCompletion } from "./components/ServiceRequestCompletion";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { ServiceRequestHeader } from "./components/ServiceRequestHeader";
import {
  SECTION_HIGHLIGHT_CLASS,
  SERVICE_REQUEST_REPORT_SECTION_IDS,
  ServiceRequestReportWorkflow,
} from "./components/ServiceRequestReportWorkflow";
import { ServiceRequestSpecimenWorkflow } from "./components/ServiceRequestSpecimenWorkflow";
import { getDiagnosticReportCreationState } from "./components/diagnosticReportCreation";
import { matchRequirements } from "./components/specimenCollection";

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
  const isMobile = useBreakpoints({ default: true, sm: false });
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

  useEffect(() => {
    if (!isMobile || mobileSections.length <= 1) return;

    const onScroll = (event: Event) => {
      // Don't fight the smooth scroll started by a tab click
      if (Date.now() < ignoreScrollUntil.current) return;
      const scroller =
        event.target instanceof Element
          ? event.target
          : document.scrollingElement;
      const firstSection = document.getElementById(mobileSections[0].id);
      // At the end of the page the last sections can't scroll up to the line
      const atEnd =
        !!scroller &&
        !!firstSection &&
        scroller.contains(firstSection) &&
        scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2;
      const line = window.innerHeight * (atEnd ? 1 : 0.4);
      const focused = mobileSections
        .filter(
          ({ id }) =>
            (document.getElementById(id)?.getBoundingClientRect().top ??
              Infinity) <= line,
        )
        .at(-1);
      setFocusedSectionId(focused?.id ?? mobileSections[0].id);
    };
    // Capture so scrolling inside any layout container is caught
    document.addEventListener("scroll", onScroll, {
      capture: true,
      passive: true,
    });
    return () =>
      document.removeEventListener("scroll", onScroll, { capture: true });
  }, [isMobile, mobileSections]);

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
  // Counted like the specimens card: each requirement needs its own tube.
  const collectedSpecimens = matchRequirements(request, specimenRequirements)
    .collected.length;

  const goToSection = (id: string) => {
    ignoreScrollUntil.current = Date.now() + 800;
    setFocusedSectionId(id);
    setActiveSectionId(id);
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="@container relative min-h-screen bg-soft-background">
      <div
        className={cn(
          "mx-auto w-full max-w-4xl pt-4 @7xl:max-w-7xl",
          canShowMarkAsCompleteFootBar ? "pb-28" : "pb-5",
        )}
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <BackButton variant="outline">
              <ArrowLeft />
              {t("back")}
            </BackButton>
            <PatientHeader
              patient={request.encounter.patient}
              facilityId={facilityId}
              variant="encounter"
              className="min-w-0 flex-1"
            />
          </div>

          {mobileSections.length > 1 && (
            <Tabs
              value={focusedSectionId ?? mobileSections[0].id}
              onValueChange={goToSection}
              className="sticky top-0 z-20 -mx-2 bg-soft-background/95 px-2 py-1 backdrop-blur sm:hidden"
            >
              <TabsList className="w-full">
                {mobileSections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.id}
                    className="flex-1 px-1"
                  >
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}

          {/* The details column follows the header in the DOM so phones show it there */}
          <div className="grid gap-6 @7xl:grid-cols-[minmax(0,1fr)_20rem] @7xl:grid-rows-[auto_auto_auto_1fr]">
            <div
              id={REQUEST_SECTION_ID}
              className={cn(
                "min-w-0 scroll-mt-20 transition-shadow duration-500 @7xl:col-start-1",
                activeSectionId === REQUEST_SECTION_ID &&
                  SECTION_HIGHLIGHT_CLASS,
              )}
            >
              <ServiceRequestHeader
                request={request}
                activityDefinition={activityDefinition}
                facilityId={facilityId}
                serviceRequestId={serviceRequestId}
                hasFinalizedReport={hasFinalizedReport}
                hasPendingReports={pendingReports > 0}
                locationId={locationId}
                disableEdit={disableEdit}
              />
            </div>

            <aside
              className={cn(
                "min-w-0 space-y-4 @7xl:sticky @7xl:top-4 @7xl:col-start-2 @7xl:row-span-4 @7xl:row-start-1 @7xl:self-start @7xl:overflow-y-auto",
                // Capped to the screen like EncounterNavigation, less the completion bar
                canShowMarkAsCompleteFootBar
                  ? "@7xl:max-h-[calc(100dvh-6rem)]"
                  : "@7xl:max-h-[calc(100dvh-2rem)]",
              )}
            >
              <ServiceRequestDetails
                request={request}
                activityDefinition={activityDefinition}
                facilityId={facilityId}
              />
            </aside>

            <div
              id={SPECIMEN_SECTION_ID}
              className={cn(
                "min-w-0 scroll-mt-20 transition-shadow duration-500 @7xl:col-start-1",
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

            <div className="min-w-0 space-y-6 @7xl:col-start-1">
              <ServiceRequestReportWorkflow
                request={request}
                activityDefinition={activityDefinition}
                diagnosticReports={diagnosticReports}
                activeSectionId={activeSectionId}
                facilityId={facilityId}
                serviceRequestId={serviceRequestId}
                disableEdit={disableEdit}
              />
            </div>
          </div>
        </div>
      </div>
      {canShowMarkAsCompleteFootBar && (
        <ServiceRequestCompletion
          request={request}
          facilityId={facilityId}
          serviceRequestId={serviceRequestId}
          pendingReports={pendingReports}
          totalReports={totalReports}
          collectedSpecimens={collectedSpecimens}
          totalSpecimens={specimenRequirements.length}
        />
      )}
    </div>
  );
}
