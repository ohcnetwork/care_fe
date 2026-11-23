import { useTranslation } from "react-i18next";

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
    <div className="space-y-1.5 text-sm">
      <h3 className="text-sm font-normal text-soft-foreground">
        {t("observation_definitions")}
      </h3>
      <ul className="space-y-1">
        {observationRequirements.map((definition) => (
          <li
            key={definition.id}
            className="flex items-start gap-2 text-foreground"
          >
            <span
              aria-hidden="true"
              className="mt-2 size-1.5 shrink-0 rounded-full bg-stronger-border"
            />
            <span className="min-w-0 wrap-break-word">{definition.title}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
