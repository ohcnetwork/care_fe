import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  SPECIMEN_STATUS_COLORS,
  SpecimenBase,
  SpecimenStatus,
} from "@/types/emr/specimen/specimen";
import { formatDateTime } from "@/Utils/utils";

import { SpecimenCollectionDetails } from "./SpecimenCollectionDetails";
import { SpecimenProcessingSteps } from "./SpecimenProcessingSteps";

/** Read-only specimen data; no definition, source chart, or workflow fetches. */
export function SpecimenDetails({
  specimen,
  className,
}: {
  specimen: SpecimenBase;
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words text-base">
            {specimen.specimen_type?.display ||
              specimen.specimen_type?.code ||
              t("specimen")}
          </CardTitle>
          <Badge variant={SPECIMEN_STATUS_COLORS[specimen.status]}>
            {specimen.status === SpecimenStatus.available && (
              <CheckCircle2 aria-hidden="true" className="size-4 mr-1" />
            )}
            {t(specimen.status)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-4 sm:grid-cols-2">
          {specimen.accession_identifier && (
            <div className="min-w-0">
              <dt className="text-sm text-gray-600">
                {t("accession_identifier")}
              </dt>
              <dd className="break-words text-sm font-medium">
                {specimen.accession_identifier}
              </dd>
            </div>
          )}
          {specimen.received_time && (
            <div>
              <dt className="text-sm text-gray-600">{t("received_time")}</dt>
              <dd className="text-sm font-medium">
                {formatDateTime(specimen.received_time)}
              </dd>
            </div>
          )}
          {!!specimen.condition?.length && (
            <div className="col-span-full">
              <dt className="text-sm text-gray-600">{t("condition")}</dt>
              <dd className="break-words text-sm font-medium">
                {specimen.condition
                  .map((code) => code.display || code.code)
                  .join(", ")}
              </dd>
            </div>
          )}
          {specimen.note && (
            <div className="col-span-full min-w-0">
              <dt className="text-sm text-gray-600">{t("note")}</dt>
              <dd className="whitespace-pre-wrap break-words text-sm">
                {specimen.note}
              </dd>
            </div>
          )}
        </dl>
        {specimen.collection && (
          <SpecimenCollectionDetails collection={specimen.collection} />
        )}
        {!!specimen.processing?.length && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">{t("processing")}</h4>
            <SpecimenProcessingSteps steps={specimen.processing} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
