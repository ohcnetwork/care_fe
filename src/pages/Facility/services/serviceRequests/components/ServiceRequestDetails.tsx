import { t } from "i18next";
import React from "react";

import { Badge } from "@/components/ui/badge";

import { formatName } from "@/Utils/utils";
import { ActivityDefinitionReadSpec } from "@/types/emr/activityDefinition/activityDefinition";
import { ObservationDefinitionReadSpec } from "@/types/emr/observationDefinition/observationDefinition";
import {
  SERVICE_REQUEST_PRIORITY_COLORS,
  SERVICE_REQUEST_STATUS_COLORS,
  ServiceRequestReadSpec,
} from "@/types/emr/serviceRequest/serviceRequest";
import { SpecimenDefinitionRead } from "@/types/emr/specimenDefinition/specimenDefinition";

function formatSpecimenRequirements(
  specimens: SpecimenDefinitionRead[],
): React.ReactNode {
  const counts = specimens.reduce(
    (acc: { [key: string]: number }, specimen) => {
      const type = specimen.type_collected?.display;
      if (type) {
        acc[type] = (acc[type] || 0) + 1;
      }
      return acc;
    },
    {},
  );

  return Object.entries(counts).map(
    ([type, count]: [string, number], index) => (
      <span key={type}>
        <span className="font-semibold">{type}</span>
        {count > 1 && <span> x {count}</span>}
        {index < Object.entries(counts).length - 1 && ", "}
      </span>
    ),
  );
}

interface ServiceRequestDetailsProps {
  request: ServiceRequestReadSpec;
  activityDefinition: ActivityDefinitionReadSpec;
}

export function ServiceRequestDetails({
  request,
  activityDefinition,
}: ServiceRequestDetailsProps) {
  const specimenRequirements = activityDefinition?.specimen_requirements ?? [];
  const observationRequirements =
    activityDefinition?.observation_result_requirements ?? [];

  return (
    <div className="bg-gray-100 rounded-lg border border-gray-200">
      <div className="py-3 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <div className="font-semibold text-gray-600 text-xl flex items-center gap-2">
            <div className="h-8 w-1.5 bg-gray-400 rounded-r-sm" />
            <div className="flex items-center gap-2 text-gray-700">
              {activityDefinition.title}
            </div>
          </div>
          <div className="font-medium px-3">
            {t("request id")}: {request.id}
          </div>
        </div>
        <div className="flex gap-2 items-center mr-4">
          {request.do_not_perform && (
            <Badge variant="destructive">{t("do not perform")}</Badge>
          )}
          <div className="gap-2">
            <div className="text-sm text-gray-600 mb-1">{t("intent")}</div>
            <div className="flex gap-2 font-semibold">{t(request.intent)}</div>
          </div>
        </div>
      </div>

      <div className="p-4 m-3 mt-1 bg-white rounded-lg shadow-md ">
        <div className="flex flex-col md:flex-row">
          <div className="flex flex-col gap-6 mb-4 min-w-[50%]">
            <div className="flex  gap-4">
              <div className="gap-2">
                <div className="text-sm text-gray-600 mb-1">
                  {t("priority")}
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={SERVICE_REQUEST_PRIORITY_COLORS[request.priority]}
                  >
                    {t(request.priority)}
                  </Badge>
                </div>
              </div>
              <div className="gap-2">
                <div className="text-sm text-gray-600 mb-1">{t("status")}</div>
                <div className="flex gap-2">
                  <Badge
                    variant={SERVICE_REQUEST_STATUS_COLORS[request.status]}
                  >
                    {t(request.status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">
                {t("observation_definitions")}
              </div>
              <div className="font-sm font-normal flex flex-wrap gap-1">
                {observationRequirements.map(
                  (test: ObservationDefinitionReadSpec) => (
                    <Badge key={test.id} variant="secondary">
                      {test.title}
                    </Badge>
                  ),
                )}
              </div>
            </div>
          </div>
          <div className="border-l border-gray-200 mx-4" />
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">{t("specimen")}</div>
              <div className="font-sm font-normal flex flex-wrap gap-1">
                {formatSpecimenRequirements(specimenRequirements)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">
                {t("requested by")}
              </div>
              <div className="font-semibold text-gray-700">
                {request.requester && formatName(request.requester)}
              </div>
            </div>
          </div>
        </div>

        {request.note && (
          <div className="mt-4">
            <div className="text-sm text-gray-600 mb-1">{t("note")}:</div>
            <div className="text-sm text-gray-950 ">{request.note}</div>
          </div>
        )}
      </div>
    </div>
  );
}
