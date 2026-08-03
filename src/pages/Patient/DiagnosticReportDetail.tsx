import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useTranslation } from "react-i18next";

import { Skeleton } from "@/components/ui/skeleton";

import { PatientAppShell } from "@/components/Patient/PatientAppShell";
import { PatientBadge } from "@/components/Patient/PatientBadge";

import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";

import { usePatientContext } from "@/hooks/usePatientUser";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import patientPortalApi from "@/types/emr/patientPortal/patientPortalApi";

import { reportFlagSummary, reportTitle } from "./records/reportUtils";

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
              <DiagnosticReportResultsTable
                observations={observations}
                highlightAbnormal
                className="rounded-2xl border-gray-200"
              />
            )}

            {report.conclusion && (
              <div className="flex flex-col gap-1.5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
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

            <span className="text-xs text-gray-600">
              {t("patient_records__verified_by")}{" "}
              <span className="font-semibold text-gray-900">
                {formatName(report.updated_by ?? report.created_by)}
              </span>
            </span>
          </>
        )}
      </div>
    </PatientAppShell>
  );
}
