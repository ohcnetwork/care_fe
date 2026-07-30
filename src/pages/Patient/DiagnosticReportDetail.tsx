import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Skeleton } from "@/components/ui/skeleton";

import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { PatientBadge } from "@/components/Patient/PatientBadge";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";

import {
  isObservationFlagged,
  observationInterpretation,
  observationLabel,
  observationValueLabel,
  referenceRangeLabel,
  reportFlagSummary,
  reportTitle,
} from "./records/reportUtils";

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-semibold text-gray-900">{value}</span>
    </div>
  );
}

export default function DiagnosticReportDetail({ id }: { id: string }) {
  const { t } = useTranslation();
  const { tokenData } = usePatientContext();

  const { data: report, isLoading } = useQuery({
    queryKey: ["portal-diagnostic-report", id],
    queryFn: query(patientPortalApi.getDiagnosticReport, {
      pathParams: { id },
      headers: { Authorization: `Bearer ${tokenData?.token}` },
    }),
    enabled: !!tokenData?.token,
  });

  const observations = report?.observations ?? [];
  const flags = report ? reportFlagSummary(report) : 0;
  // The report itself carries no collection time — the earliest sample time
  // across its observations is the closest stand-in.
  const collectedAt = observations
    .map((observation) => observation.effective_datetime)
    .filter(Boolean)
    .sort()[0];

  return (
    <PatientAppShell
      title={report ? reportTitle(report, t) : t("diagnostic_report")}
      backTo="/patient/records?tab=reports"
      hideTabs
    >
      <div className="flex flex-col gap-3 p-4">
        {isLoading || !report ? (
          <>
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </>
        ) : (
          <>
            <div className="flex flex-wrap gap-4 rounded-2xl border border-gray-200 bg-white p-4">
              {collectedAt && (
                <MetaField
                  label={t("collected")}
                  value={dayjs(collectedAt).format("DD MMM, h:mm A")}
                />
              )}
              <MetaField
                label={t("reported")}
                value={dayjs(report.created_date).format("DD MMM, h:mm A")}
              />
              {report.encounter?.facility?.name && (
                <MetaField
                  label={t("lab")}
                  value={report.encounter.facility.name}
                />
              )}
              {report.encounter?.patient?.name && (
                <MetaField
                  label={t("patient")}
                  value={report.encounter.patient.name}
                />
              )}
            </div>

            {flags > 0 && (
              <PatientBadge tone="warning" className="self-start">
                {t("patient_records__flagged_count", { count: flags })}
              </PatientBadge>
            )}

            {observations.length > 0 && (
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
                <div className="grid grid-cols-[1.5fr_0.9fr_1fr] gap-2 border-b border-gray-200 bg-gray-50 px-3.5 py-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {t("test")}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {t("result")}
                  </span>
                  <span className="text-right text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {t("patient_records__reference")}
                  </span>
                </div>
                {observations.map((observation) => {
                  const flagged = isObservationFlagged(observation);
                  const reference = referenceRangeLabel(observation);
                  const interpretation = observationInterpretation(observation);
                  return (
                    <div
                      key={observation.id}
                      className="grid grid-cols-[1.5fr_0.9fr_1fr] items-center gap-2 border-b border-gray-100 px-3.5 py-3 last:border-b-0"
                    >
                      <span className="text-sm text-gray-900">
                        {observationLabel(observation, t)}
                      </span>
                      <span
                        className={cn(
                          "flex flex-col font-mono text-sm font-bold",
                          flagged ? "text-warning-700" : "text-gray-900",
                        )}
                      >
                        <span>
                          {observationValueLabel(observation)}
                          {/* The reference band already carries the unit; only
                              repeat it here when there is no band to show. */}
                          {!reference && observation.value?.unit?.display && (
                            <span className="ml-1 font-sans text-xs font-normal text-gray-500">
                              {observation.value.unit.display}
                            </span>
                          )}
                        </span>
                        {flagged && interpretation && (
                          <span className="font-sans text-[10px] font-semibold">
                            {interpretation}
                          </span>
                        )}
                      </span>
                      <span className="text-right text-xs text-gray-600">
                        {reference ?? "-"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {report.conclusion && (
              <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <span className="text-sm font-bold text-gray-900">
                  {t("conclusion")}
                </span>
                <span className="text-xs leading-relaxed text-gray-600">
                  {report.conclusion}
                </span>
              </div>
            )}

            {report.note && (
              <p className="rounded-2xl border border-gray-100 bg-gray-50 p-4 text-xs leading-relaxed text-gray-600">
                {report.note}
              </p>
            )}

            <div className="rounded-2xl border border-gray-100 bg-gray-50 px-3.5 py-3">
              <span className="text-xs text-gray-600">
                {t("patient_records__verified_by")}{" "}
                <span className="font-semibold text-gray-900">
                  {formatName(report.updated_by ?? report.created_by)}
                </span>
              </span>
            </div>
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
