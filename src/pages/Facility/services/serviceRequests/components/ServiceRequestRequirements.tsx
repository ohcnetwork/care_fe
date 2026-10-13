import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";

interface ServiceRequestRequirementsProps {
  activityDefinition: ActivityDefinitionReadSpec;
}
export function ServiceRequestRequirements({
  activityDefinition,
}: ServiceRequestRequirementsProps) {
  const { t } = useTranslation();
  const observationRequirements =
    activityDefinition.observation_result_requirements ?? [];

  if (observationRequirements.length === 0) {
    return null;
  }

  return (
    <dl className="space-y-1.5 text-sm">
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
    </dl>
  );
}
