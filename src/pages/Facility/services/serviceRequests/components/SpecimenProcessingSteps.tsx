import { CircleCheckBig } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { ProcessingReadSpec } from "@/types/emr/specimen/specimen";
import { formatDateTime, formatName } from "@/Utils/utils";

interface SpecimenProcessingStepsProps {
  steps: ProcessingReadSpec[];
  renderAction?: (step: ProcessingReadSpec, index: number) => ReactNode;
}

/** Stored processing rows; mutation controls are supplied by the native editor. */
export function SpecimenProcessingSteps({
  steps,
  renderAction,
}: SpecimenProcessingStepsProps) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      {steps.map((process, index) => (
        <div
          key={index}
          className="flex flex-wrap items-center gap-2 rounded-md bg-primary-100 border border-primary-300 px-3 py-2"
        >
          <CircleCheckBig
            aria-hidden="true"
            className="size-4 shrink-0 text-green-600"
          />
          <div className="min-w-0 flex-1 basis-40">
            <div className="font-medium text-sm text-primary-950 break-words">
              {process.method?.display ||
                process.method?.code ||
                process.description}
            </div>
            {process.method &&
              process.description !== process.method.display && (
                <div className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap break-words">
                  {process.description}
                </div>
              )}
          </div>
          <div className="min-w-0 text-sm text-gray-600">
            {process.performer_object && (
              <div className="mt-0.5 break-words">
                {t("performed_by")}: {formatName(process.performer_object)}
              </div>
            )}
            <div className="mt-0.5">
              {t("performed_on")}:{" "}
              {process.time_date_time
                ? formatDateTime(process.time_date_time)
                : t("na")}
            </div>
          </div>
          {renderAction?.(process, index)}
        </div>
      ))}
    </div>
  );
}
