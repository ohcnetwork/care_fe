import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

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

interface ServiceRequestRequirementsProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
}
export function ServiceRequestRequirements({
  request,
  activityDefinition,
}: ServiceRequestRequirementsProps) {
  const { t } = useTranslation();
  const specimenRequirements = formatSpecimenRequirements(
    activityDefinition.specimen_requirements ?? [],
  );
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];
  return (
    <dl className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)] content-start gap-x-6 gap-y-5 text-sm">
      <div className="space-y-1.5">
        <dt className="text-gray-600">{t("priority")}</dt>
        <dd>
          <Badge variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}>
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
          <dt className="text-gray-600">{t("observation_definitions")}</dt>
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
  );
}
