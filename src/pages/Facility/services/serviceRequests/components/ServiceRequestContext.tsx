import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { LocationNode } from "@/components/Location/LocationTree";

import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import { ServiceRequestReadSpec } from "@/types/emr/serviceRequest/serviceRequest";
import { formatName } from "@/Utils/utils";

interface ServiceRequestContextProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
}
export function ServiceRequestContext({
  request,
  activityDefinition,
}: ServiceRequestContextProps) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-5 text-sm">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5">
        {activityDefinition.healthcare_service && (
          <div className="space-y-1.5">
            <dt className="text-gray-600">{t("healthcare_service")}</dt>
            <dd className="font-semibold text-gray-700 wrap-break-word">
              {activityDefinition.healthcare_service.name}
            </dd>
          </div>
        )}
        <div className="space-y-1">
          <dt className="text-gray-600">{t("intent")}</dt>
          <dd className="font-semibold text-gray-700">{t(request.intent)}</dd>
        </div>
        {request.requester && (
          <div className="space-y-1">
            <dt className="text-gray-600">{t("requested by")}</dt>
            <dd className="font-semibold text-gray-700 wrap-break-word">
              {formatName(request.requester)}
            </dd>
          </div>
        )}
        {request.created_date && (
          <div className="space-y-1">
            <dt className="text-gray-600">{t("requested_on")}</dt>
            <dd className="font-semibold text-gray-700">
              {format(request.created_date, "MMM d, yyyy, h:mm a")}
            </dd>
          </div>
        )}
      </dl>
      {request.encounter.current_location && (
        <dl className="space-y-1">
          <dt className="text-gray-600">{t("patient_location")}</dt>
          <dd className="wrap-break-word">
            <LocationNode
              location={request.encounter.current_location}
              isLast={true}
            />
          </dd>
        </dl>
      )}
      {request.patient_instruction && (
        <dl className="space-y-1">
          <dt className="text-gray-600">{t("patient_instruction")}</dt>
          <dd className="whitespace-pre-wrap text-gray-950 wrap-break-word">
            {request.patient_instruction}
          </dd>
        </dl>
      )}
    </div>
  );
}
