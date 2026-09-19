import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { LocationNode } from "@/components/Location/LocationTree";

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
}

export function ServiceRequestDetails({
  request,
  activityDefinition,
}: ServiceRequestDetailsProps) {
  const { t } = useTranslation();
  const specimenRequirements = formatSpecimenRequirements(
    activityDefinition.specimen_requirements ?? [],
  );
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  const titleId = `service-request-title-${request.id}`;

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-lg border border-gray-200 bg-white"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1 space-y-1">
          <h2
            id={titleId}
            className="text-lg font-semibold text-gray-950 wrap-break-word"
          >
            {activityDefinition.title}
          </h2>
          <p className="text-xs text-gray-500">
            {t("request id")}:{" "}
            <span className="font-mono break-all">{request.id}</span>
          </p>
        </div>
        {request.do_not_perform && (
          <Badge variant="destructive">{t("do not perform")}</Badge>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-4 py-4 text-sm sm:grid-cols-3 sm:px-5 lg:grid-cols-4">
        <div className="min-w-0 space-y-1.5">
          <dt className="text-gray-500">{t("status")}</dt>
          <dd>
            <Badge variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}>
              {t(request.status)}
            </Badge>
          </dd>
        </div>
        <div className="min-w-0 space-y-1.5">
          <dt className="text-gray-500">{t("priority")}</dt>
          <dd>
            <Badge variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}>
              {t(request.priority)}
            </Badge>
          </dd>
        </div>
        <div className="min-w-0 space-y-1.5">
          <dt className="text-gray-500">{t("intent")}</dt>
          <dd className="font-medium text-gray-950">{t(request.intent)}</dd>
        </div>
        {request.requester && (
          <div className="min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("requested by")}</dt>
            <dd className="font-medium text-gray-950 wrap-break-word">
              {formatName(request.requester)}
            </dd>
          </div>
        )}
        {activityDefinition.healthcare_service && (
          <div className="min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("healthcare_service")}</dt>
            <dd className="font-medium text-gray-950 wrap-break-word">
              {activityDefinition.healthcare_service.name}
            </dd>
          </div>
        )}
        {request.encounter.current_location && (
          <div className="col-span-2 min-w-0 space-y-1.5 sm:col-span-1">
            <dt className="text-gray-500">{t("patient_location")}</dt>
            <dd className="wrap-break-word">
              <LocationNode
                location={request.encounter.current_location}
                isLast={true}
              />
            </dd>
          </div>
        )}
        {request.body_site && (
          <div className="min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("body_site")}</dt>
            <dd className="font-medium text-gray-950 wrap-break-word">
              {request.body_site.display}
            </dd>
          </div>
        )}
        {specimenRequirements.length > 0 && (
          <div className="min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("specimen")}</dt>
            <dd className="font-medium text-gray-950 wrap-break-word">
              {specimenRequirements}
            </dd>
          </div>
        )}
        {observationRequirements.length > 0 && (
          <div className="col-span-full min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("observation_definitions")}</dt>
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
        {request.patient_instruction && (
          <div className="col-span-full min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("patient_instruction")}</dt>
            <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
              {request.patient_instruction}
            </dd>
          </div>
        )}
        {request.note && (
          <div className="col-span-full min-w-0 space-y-1.5">
            <dt className="text-gray-500">{t("note")}</dt>
            <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
              {request.note}
            </dd>
          </div>
        )}
      </dl>

      {(request.created_date || request.created_by) && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-gray-100 px-4 py-3 text-xs text-gray-500 sm:px-5">
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
    </section>
  );
}
