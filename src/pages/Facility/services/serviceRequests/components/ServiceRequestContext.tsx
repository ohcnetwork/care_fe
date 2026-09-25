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
  if (
    !activityDefinition.healthcare_service &&
    !request.requester &&
    !request.encounter.current_location &&
    !request.patient_instruction
  ) {
    return null;
  }

  return (
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
  );
}
