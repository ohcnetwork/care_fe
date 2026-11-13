import { useQueryClient } from "@tanstack/react-query";
import { Tag as TagIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ChargeItemsSection } from "@/components/Billing/ChargeItems/ChargeItemsSection";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";
import { TagBadges } from "@/components/Tags/TagBadges";

import { ChargeItemServiceResource } from "@/types/billing/chargeItem/chargeItem";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { formatName } from "@/Utils/utils";

import { ServiceRequestContext } from "./ServiceRequestContext";
import { ServiceRequestRequirements } from "./ServiceRequestRequirements";

interface ServiceRequestDetailsProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  facilityId: string;
  locationId?: string;
  disableEdit: boolean;
}

export function ServiceRequestDetails({
  request,
  activityDefinition,
  facilityId,
  locationId,
  disableEdit,
}: ServiceRequestDetailsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const titleId = `service-request-title-${request.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border border-gray-200 bg-gray-100"
    >
      <div className="relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <span
          aria-hidden="true"
          className="absolute left-0 top-4 h-8 w-1.5 rounded-r-sm bg-primary-500"
        />
        <div className="min-w-0 flex-1 sm:ml-2">
          <h2
            id={titleId}
            className="text-xl font-semibold text-gray-700 wrap-break-word"
          >
            {activityDefinition.title}
          </h2>
          <p className="text-sm text-gray-600">
            {t("request id")}:
            <span className="ml-1 break-all text-gray-700 font-medium">
              {request.id}
            </span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
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
      </div>

      <div className="mx-1.5 mb-3 rounded-lg bg-white p-4 pb-2 shadow-md">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <div className="min-w-0 space-y-5">
            <ServiceRequestContext
              request={request}
              activityDefinition={activityDefinition}
            />
            <ServiceRequestRequirements
              activityDefinition={activityDefinition}
            />
          </div>
          <div className="min-w-0 space-y-3 border-t border-gray-200 pt-5 text-sm md:border-t-0 md:border-l md:pt-0 md:pl-6">
            <p className="text-gray-600">{t("tags")}</p>
            <TagBadges tags={request.tags} className="pb-1" />
            <TagAssignmentSheet
              entityType="service_request"
              entityId={request.id}
              facilityId={facilityId}
              currentTags={request.tags}
              onUpdate={() => {
                queryClient.invalidateQueries({
                  queryKey: ["serviceRequest", facilityId, request.id],
                });
              }}
              patientId={request.encounter.patient.id}
              trigger={
                <Button variant="outline" size="sm">
                  <TagIcon className="size-4" />
                  {t("add_tags")}
                </Button>
              }
            />
            {request.note && (
              <dl className="pt-4">
                <div className="space-y-1">
                  <dt className="text-gray-600">{t("note")}</dt>
                  <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
                    {request.note}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
        {request.created_by && (
          <div className="mt-4 flex flex-wrap border-t border-gray-100 pt-2 text-xs text-gray-500">
            <span className="min-w-0 wrap-break-word">
              {t("created_by")}: {formatName(request.created_by)}
            </span>
          </div>
        )}
      </div>
      <ChargeItemsSection
        facilityId={facilityId}
        resourceId={request.id}
        encounterId={request.encounter.id}
        serviceResourceType={ChargeItemServiceResource.service_request}
        sourceUrl={`/facility/${facilityId}${locationId ? `/locations/${locationId}` : ""}/service_requests/${request.id}`}
        patientId={request.encounter.patient.id}
        viewOnly={disableEdit}
        disableCreateChargeItems
        className="m-2 pt-2"
      />
    </section>
  );
}
