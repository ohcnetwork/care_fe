import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import careConfig from "@careConfig";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import PrintFooter from "@/components/Common/PrintFooter";

import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";

import { DiagnosticReportResultsTable } from "./components/DiagnosticReportResultsTable";

interface CategoryGroup {
  category: {
    code: string;
    display: string;
  };
  reports: DiagnosticReportRead[];
}

export default function DiagnosticReportMultiPrint({
  patientId,
  ids,
}: {
  patientId: string;
  ids: string;
}) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacility();

  // Parse IDs from query string
  const reportIds = useMemo(() => ids.split(",").filter(Boolean), [ids]);

  // Fetch all reports in parallel
  const reportQueries = useQueries({
    queries: reportIds.map((id) => ({
      queryKey: ["diagnosticReport", id],
      queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
        pathParams: {
          patient_external_id: patientId,
          external_id: id,
        },
      }),
    })),
  });

  const isLoading = reportQueries.some((q) => q.isLoading);
  const reports = reportQueries
    .map((q) => q.data)
    .filter((r): r is DiagnosticReportRead => !!r);

  // Group reports by category (using service_request.category which matches Classification enum)
  const groupedReports = useMemo(() => {
    const groups: CategoryGroup[] = [];
    const categoryMap = new Map<string, CategoryGroup>();

    reports.forEach((report) => {
      // Use service_request.category for grouping (matches Classification enum)
      const categoryCode =
        report.service_request?.category ||
        report.category?.code ||
        "uncategorized";
      // Use category.display for display name, fallback to translated category code
      const categoryDisplay =
        report.category?.display || t(categoryCode) || t("uncategorized");

      if (!categoryMap.has(categoryCode)) {
        const group: CategoryGroup = {
          category: {
            code: categoryCode,
            display: categoryDisplay,
          },
          reports: [],
        };
        categoryMap.set(categoryCode, group);
        groups.push(group);
      }

      categoryMap.get(categoryCode)!.reports.push(report);
    });

    return groups;
  }, [reports, t]);

  // Get patient info from first report
  const patient = reports[0]?.encounter?.patient;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          {t("no_reports_selected")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center">
      <PrintPreview title={`${t("diagnostic_reports")} - ${t("multi_print")}`}>
        <div className="max-w-4xl mx-auto">
          {/* Header with Facility Name and Logo */}
          <div className="flex justify-between items-start pb-2 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="text-left">
                <h1 className="text-2xl font-medium">{facility?.name}</h1>
                {facility?.address && (
                  <div className="text-gray-500 whitespace-pre-wrap wrap-break-word text-sm">
                    {facility.address}
                    {facility.phone_number && (
                      <p className="text-gray-500 text-sm">
                        {t("phone")}: {facility.phone_number}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold my-2">
            {t("diagnostic_reports")}
          </h2>

          {/* Patient Details */}
          {patient && (
            <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-200 pt-2">
              <div className="grid grid-cols-[6rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("patient")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold ml-2 wrap-break-word">
                  {patient.name}
                </span>
              </div>
              {"instance_identifiers" in patient &&
                patient.instance_identifiers
                  .filter(
                    ({ config }) =>
                      config.config.use === PatientIdentifierUse.official,
                  )
                  .map((identifier) => (
                    <div
                      key={identifier.config.id}
                      className="grid grid-cols-[6rem_auto_1fr] items-center"
                    >
                      <span className="text-gray-600">
                        {identifier.config.config.display}
                      </span>
                      <span className="text-gray-600">:</span>
                      <span className="font-semibold ml-2">
                        {identifier.value}
                      </span>
                    </div>
                  ))}
              <div className="grid grid-cols-[6rem_auto_1fr] items-center">
                <span className="text-gray-600">
                  {t("age")} / {t("sex")}
                </span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold ml-2">
                  {formatPatientAge(patient, true)} /
                  <span className="capitalize ml-1">
                    {t(`GENDER__${patient.gender}`)}
                  </span>
                </span>
              </div>
              <div className="grid grid-cols-[6rem_auto_1fr] items-center">
                <span className="text-gray-600">{t("report_date")}</span>
                <span className="text-gray-600">:</span>
                <span className="font-semibold ml-2">
                  {format(new Date(), "dd-MM-yyyy")}
                </span>
              </div>
            </div>
          )}

          {/* Grouped Results by Category */}
          <div className="mt-8 space-y-8">
            {groupedReports.map((group) => (
              <div key={group.category.code} className="space-y-4">
                {/* Category Header */}
                <h3 className="text-lg font-semibold uppercase text-gray-700 border-b border-gray-300 pb-1">
                  {group.category.display} {t("results")}
                </h3>

                {/* Combined Results Table - merge all observations from reports in this category */}
                <DiagnosticReportResultsTable
                  observations={group.reports.flatMap((report) =>
                    report.observations.filter(
                      (obs) =>
                        obs.status !== ObservationStatus.ENTERED_IN_ERROR,
                    ),
                  )}
                />

                {/* Individual Report Details (notes, conclusions, requesters) */}
                <div className="space-y-4 mt-4">
                  {group.reports.map((report) => (
                    <div key={report.id} className="text-sm">
                      {/* Report Title */}
                      <div className="font-medium text-gray-700">
                        {report.code?.display}
                        {report.requester && (
                          <span className="text-gray-500 font-normal ml-2">
                            ({t("requested_by")}: {formatName(report.requester)}
                            )
                          </span>
                        )}
                      </div>

                      {/* Notes */}
                      {report.note && (
                        <div className="mt-1">
                          <span className="text-gray-500">{t("notes")}: </span>
                          <span className="whitespace-pre-wrap">
                            {report.note}
                          </span>
                        </div>
                      )}

                      {/* Conclusion */}
                      {report.conclusion && (
                        <div className="mt-1">
                          <span className="text-gray-500">
                            {t("conclusion")}:{" "}
                          </span>
                          <span className="whitespace-pre-wrap">
                            {report.conclusion}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <PrintFooter showPrintedBy className="mt-12 pt-4 border-t" />
        </div>
      </PrintPreview>
    </div>
  );
}
