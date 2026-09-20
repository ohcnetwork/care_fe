import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { LocationNode } from "@/components/Location/LocationTree";
import TagAssignmentSheet from "@/components/Tags/TagAssignmentSheet";

import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";
import { formatName } from "@/Utils/utils";

function formatSpecimenRequirements(specimens: SpecimenDefinitionRead[]) {
  const counts = specimens.reduce<Record<string, number>>((acc, specimen) => {
    const type = specimen.type_collected?.display;
    if (type) {
      acc[type] = (acc[type] || 0) + 1;
    }
    return acc;
  }, {});

  const types = Object.entries(counts);
  return types.map(([type, count], index) => (
    <span key={type}>
      {type}
      {count > 1 && <span> × {count}</span>}
      {index < types.length - 1 && ", "}
    </span>
  ));
}

interface ServiceRequestDetailsProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
  facilityId: string;
}

export function ServiceRequestDetails({
  request,
  activityDefinition,
  facilityId,
}: ServiceRequestDetailsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const specimenRequirements = formatSpecimenRequirements(
    activityDefinition.specimen_requirements ?? [],
  );
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const titleId = `service-request-title-${request.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border border-gray-200 bg-gray-100"
    >
      <div className="relative flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <span
          aria-hidden="true"
          className="absolute left-0 top-4 h-8 w-1.5 rounded-r-sm bg-gray-400"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id={titleId}
            className="text-xl font-semibold text-gray-700 wrap-break-word"
          >
            {activityDefinition.title}
          </h2>
          <p className="text-sm text-gray-600">
            {t("request id")}: <span className="break-all">{request.id}</span>
          </p>
          <div className="flex flex-wrap gap-1 pt-1">
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
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4 sm:shrink-0">
          {request.do_not_perform && (
            <Badge variant="destructive">{t("do not perform")}</Badge>
          )}
          <dl>
            <div className="flex items-baseline gap-2 sm:block sm:space-y-1">
              <dt className="text-sm text-gray-600">{t("intent")}</dt>
              <dd className="font-semibold text-gray-700">
                {t(request.intent)}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-lg bg-white p-4 shadow-md">
        <div className="grid gap-5 md:grid-cols-2 md:gap-6">
          <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] content-start gap-x-6 gap-y-5 text-sm">
            <div className="space-y-1.5">
              <dt className="text-gray-600">{t("priority")}</dt>
              <dd>
                <Badge
                  variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
                >
                  {t(request.priority)}
                </Badge>
              </dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-gray-600">{t("status")}</dt>
              <dd>
                <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
                  {t(request.status)}
                </Badge>
              </dd>
            </div>
            {observationRequirements.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <dt className="text-gray-600">
                  {t("observation_definitions")}
                </dt>
                <dd className="flex flex-wrap gap-1.5">
                  {observationRequirements.map((definition) => (
                    <Badge
                      key={definition.id}
                      variant="secondary"
                      className="max-w-full whitespace-normal wrap-break-word"
                    >
                      {definition.title}
                    </Badge>
                  ))}
                </dd>
              </div>
            )}
            {specimenRequirements.length > 0 && (
              <div className="col-span-2 space-y-1.5">
                <dt className="text-gray-600">{t("specimen")}</dt>
                <dd className="font-semibold text-gray-700 wrap-break-word">
                  {specimenRequirements}
                </dd>
              </div>
            )}
            {request.body_site && (
              <div className="col-span-2 space-y-1.5">
                <dt className="text-gray-600">{t("body_site")}</dt>
                <dd className="font-semibold text-gray-700 wrap-break-word">
                  {request.body_site.display}
                </dd>
              </div>
            )}
          </dl>
          {(activityDefinition.healthcare_service ||
            request.requester ||
            request.encounter.current_location ||
            request.patient_instruction) && (
            <dl className="min-w-0 space-y-5 border-t border-gray-200 pt-5 text-sm md:border-t-0 md:border-l md:pt-0 md:pl-6">
              {activityDefinition.healthcare_service && (
                <div className="space-y-1.5">
                  <dt className="text-gray-600">{t("healthcare_service")}</dt>
                  <dd className="font-semibold text-gray-700 wrap-break-word">
                    {activityDefinition.healthcare_service.name}
                  </dd>
                </div>
              )}
              {request.requester && (
                <div className="space-y-1.5">
                  <dt className="text-gray-600">{t("requested by")}</dt>
                  <dd className="font-semibold text-gray-700 wrap-break-word">
                    {formatName(request.requester)}
                  </dd>
                </div>
              )}
              {request.encounter.current_location && (
                <div className="space-y-1.5">
                  <dt className="text-gray-600">{t("patient_location")}</dt>
                  <dd className="wrap-break-word">
                    <LocationNode
                      location={request.encounter.current_location}
                      isLast={true}
                    />
                  </dd>
                </div>
              )}
              {request.patient_instruction && (
                <div className="space-y-1.5">
                  <dt className="text-gray-600">{t("patient_instruction")}</dt>
                  <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
                    {request.patient_instruction}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
        {request.note && (
          <dl className="mt-5 border-t border-gray-200 pt-4 text-sm">
            <div className="space-y-1.5">
              <dt className="text-gray-600">{t("note")}</dt>
              <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
                {request.note}
              </dd>
            </div>
          </dl>
        )}
        {(request.created_date || request.created_by) && (
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t border-gray-100 pt-3 text-xs text-gray-500">
            {request.created_date && (
              <span>
                {t("created_at")}:{" "}
                <time dateTime={request.created_date}>
                  {format(request.created_date, "MMM d, yyyy, h:mm a")}
                </time>
              </span>
            )}
            {request.created_by && (
              <span className="min-w-0 wrap-break-word">
                {t("created_by")}: {formatName(request.created_by)}
              </span>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
