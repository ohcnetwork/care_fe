import { format } from "date-fns";
import { Hospital, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { ChargeItemsSection } from "@/components/Billing/ChargeItems/ChargeItemsSection";

import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { formatName } from "@/Utils/utils";

import { ServiceRequestActions } from "./ServiceRequestActions";

interface ServiceRequestHeaderProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  facilityId: string;
  serviceRequestId: string;
  hasFinalizedReport: boolean;
  pendingReports: number;
  locationId?: string;
  disableEdit: boolean;
}

export function ServiceRequestHeader({
  request,
  activityDefinition,
  facilityId,
  serviceRequestId,
  hasFinalizedReport,
  pendingReports,
  locationId,
  disableEdit,
}: ServiceRequestHeaderProps) {
  const { t } = useTranslation();
  const titleId = `service-request-title-${request.id}`;
  const requestedOn =
    request.created_date && format(request.created_date, "MMM d, yyyy, h:mm a");

  return (
    <section
      aria-labelledby={titleId}
      className="relative space-y-4 rounded-lg border border-border bg-white p-4 shadow-xs sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-[1_1_16rem] space-y-1">
          {activityDefinition.healthcare_service && (
            <p className="flex items-center gap-1.5 text-sm text-soft-foreground">
              <Hospital aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only">{t("healthcare_service")}:</span>
              <span className="min-w-0 wrap-break-word">
                {activityDefinition.healthcare_service.name}
              </span>
            </p>
          )}
          <div className="relative flex flex-wrap items-center gap-2">
            <span
              aria-hidden="true"
              className="absolute top-0 -left-4 h-8 w-1.5 rounded-r-sm bg-primary-500 sm:-left-5"
            />
            <h2
              id={titleId}
              className="mr-1 text-2xl leading-tight text-foreground wrap-break-word"
            >
              {activityDefinition.title}
            </h2>
            {request.do_not_perform && (
              <Badge variant="destructive">{t("do not perform")}</Badge>
            )}
            <Badge variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}>
              {t(request.priority)}
            </Badge>
            <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
              {t(request.status)}
            </Badge>
          </div>
          {request.requester ? (
            <p className="text-sm text-soft-foreground">
              {t("requested by")}{" "}
              <span className="font-medium text-foreground">
                {formatName(request.requester)}
              </span>
              {requestedOn && ` · ${requestedOn}`}
            </p>
          ) : (
            requestedOn && (
              <p className="text-sm text-soft-foreground">
                {t("requested_on")}: {requestedOn}
              </p>
            )
          )}
        </div>
        <ServiceRequestActions
          request={request}
          facilityId={facilityId}
          serviceRequestId={serviceRequestId}
          hasFinalizedReport={hasFinalizedReport}
          pendingReports={pendingReports}
        />
      </div>

      {request.patient_instruction && (
        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-soft-background px-3.5 py-2.5 text-sm text-foreground">
          <Info
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-soft-foreground"
          />
          <p className="min-w-0 whitespace-pre-wrap wrap-break-word">
            <span className="font-semibold">{t("patient_instruction")}:</span>{" "}
            {request.patient_instruction}
          </p>
        </div>
      )}

      {/* Billing stays in the header so its actions show on load at any width */}
      <div className="border-t border-border pt-4 empty:hidden">
        <ChargeItemsSection
          facilityId={facilityId}
          resourceId={request.id}
          encounterId={request.encounter.id}
          serviceResourceType={ChargeItemServiceResource.service_request}
          sourceUrl={`/facility/${facilityId}${locationId ? `/locations/${locationId}` : ""}/service_requests/${request.id}`}
          patientId={request.encounter.patient.id}
          viewOnly={disableEdit}
          compact
        />
      </div>
    </section>
  );
}
