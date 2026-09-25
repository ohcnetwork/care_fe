import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

import { ChargeItemsSection } from "@/components/Billing/ChargeItems/ChargeItemsSection";

import query from "@/Utils/request/query";
import { PatientHeader } from "@/components/Patient/PatientHeader";
import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import { Classification } from "@/types/emr/activityDefinition/activityDefinition";
import activityDefinitionApi from "@/types/emr/activityDefinition/activityDefinitionApi";
import { DiagnosticReportStatus } from "@/types/emr/diagnosticReport/diagnosticReport";
import { EDITABLE_SERVICE_REQUEST_STATUSES } from "@/types/emr/serviceRequest/serviceRequest";
import serviceRequestApi from "@/types/emr/serviceRequest/serviceRequestApi";
import { ServiceRequestActions } from "./components/ServiceRequestActions";
import { ServiceRequestCompletion } from "./components/ServiceRequestCompletion";
import { ServiceRequestDetails } from "./components/ServiceRequestDetails";
import { ServiceRequestReportWorkflow } from "./components/ServiceRequestReportWorkflow";
import { ServiceRequestSpecimenWorkflow } from "./components/ServiceRequestSpecimenWorkflow";

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
        className={`mx-auto w-full p-4 max-w-4xl ${canShowMarkAsCompleteFootBar ? "pb-28" : ""}`}
      >
        <div className="space-y-6">
          <ServiceRequestActions
            request={request}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            hasFinalizedReport={hasFinalizedReport}
          />
          <div className="px-2">
            <PatientHeader
              patient={request.encounter.patient}
              facilityId={facilityId}
            />
          </div>

          <ServiceRequestDetails
            request={request}
            activityDefinition={activityDefinition}
            facilityId={facilityId}
          />
          <div className="space-y-3">
            <ChargeItemsSection
              facilityId={facilityId}
              resourceId={serviceRequestId}
              encounterId={request.encounter.id}
              serviceResourceType={ChargeItemServiceResource.service_request}
              sourceUrl={`/facility/${facilityId}${locationId ? `/locations/${locationId}` : ""}/service_requests/${serviceRequestId}`}
              patientId={request.encounter.patient.id}
              viewOnly={disableEdit}
              disableCreateChargeItems
            />
          </div>

          <ServiceRequestSpecimenWorkflow
            request={request}
            requirements={specimenRequirements}
            facilityId={facilityId}
            serviceRequestId={serviceRequestId}
            disableEdit={disableEdit}
          />

          <ServiceRequestReportWorkflow
            request={request}
            activityDefinition={activityDefinition}
            diagnosticReports={diagnosticReports}
            pendingReports={pendingReports}
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
