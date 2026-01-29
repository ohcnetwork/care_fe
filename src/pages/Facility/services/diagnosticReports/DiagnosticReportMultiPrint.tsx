import careConfig from "@careConfig";
import { useQueries } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import PrintFooter from "@/components/Common/PrintFooter";

import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName, formatPatientAge } from "@/Utils/utils";

import { DiagnosticReportResultsTable } from "./components/DiagnosticReportResultsTable";
import { ImageRenderer, PDFRenderer } from "./components/FileRenderers";

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

  const isLoadingReports = reportQueries.some((q) => q.isLoading);
  const reports = reportQueries
    .map((q) => q.data)
    .filter((r): r is DiagnosticReportRead => !!r);

  // Fetch files for all reports in parallel
  const fileQueries = useQueries({
    queries: reports.map((report) => ({
      queryKey: ["files", "diagnostic_report", report.id],
      queryFn: query(fileApi.list, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: report.id,
          limit: 100,
          offset: 0,
        },
      }),
      enabled: !!report.id,
    })),
  });

  const isLoadingFiles = fileQueries.some((q) => q.isLoading);

  // Organize files by report ID
  const filesByReport = useMemo(() => {
    const map = new Map<string, FileReadMinimal[]>();
    reports.forEach((report, index) => {
      const filesData = fileQueries[index]?.data as
        | PaginatedResponse<FileReadMinimal>
        | undefined;
      if (filesData?.results) {
        map.set(report.id, filesData.results);
      }
    });
    return map;
  }, [reports, fileQueries]);

  // Store file URLs
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const fetchedFileIdsRef = useRef<Set<string>>(new Set());

  // Function to get signed URL for a file
  const getFileUrl = async (file: FileReadMinimal, reportId: string) => {
    if (!file.id || !reportId) return null;

    try {
      const data = await query(fileApi.get, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: reportId,
        },
        pathParams: { fileId: file.id },
      })({} as any);

      return data?.read_signed_url as string;
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      return null;
    }
  };

  // Get all file IDs that need to be fetched
  const allFileIds = useMemo(() => {
    const ids: string[] = [];
    for (const files of filesByReport.values()) {
      for (const file of files) {
        if (file.id) ids.push(file.id);
      }
    }
    return ids.sort().join(",");
  }, [filesByReport]);

  // Fetch signed URLs for all files
  useEffect(() => {
    if (isLoadingReports || isLoadingFiles) return;
    if (filesByReport.size === 0) return;
    if (!allFileIds) return;

    // Check if we've already fetched these files
    const currentFileIds = allFileIds.split(",").filter(Boolean);
    const needsFetch = currentFileIds.some(
      (id) => !fetchedFileIdsRef.current.has(id),
    );
    if (!needsFetch) return;

    const fetchAllUrls = async () => {
      setIsLoadingUrls(true);
      const urls: Record<string, string> = {};

      for (const [reportId, files] of filesByReport) {
        for (const file of files) {
          if (!file.id) continue;
          // Skip if already fetched
          if (fetchedFileIdsRef.current.has(file.id)) continue;

          const url = await getFileUrl(file, reportId);
          if (url) {
            urls[file.id] = url;
            fetchedFileIdsRef.current.add(file.id);
          }
        }
      }

      setFileUrls((prev) => ({ ...prev, ...urls }));
      setIsLoadingUrls(false);
    };

    fetchAllUrls();
  }, [allFileIds, isLoadingReports, isLoadingFiles]);

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

  // Helper to get PDF and image files for a report
  const getReportFiles = (reportId: string) => {
    const files = filesByReport.get(reportId) || [];

    const pdfFiles = files.filter((file) => {
      if (!file.id || !fileUrls[file.id] || !file.extension || file.is_archived)
        return false;
      return file.extension.toLowerCase().endsWith("pdf");
    });

    const imageFiles = files.filter((file) => {
      if (!file.id || !fileUrls[file.id] || !file.extension || file.is_archived)
        return false;
      const ext = file.extension.toLowerCase();
      return (
        ext.endsWith("jpg") ||
        ext.endsWith("jpeg") ||
        ext.endsWith("png") ||
        ext.endsWith("gif") ||
        ext.endsWith("webp")
      );
    });

    return { pdfFiles, imageFiles };
  };

  // Get patient info from first report
  const patient = reports[0]?.encounter?.patient;

  const isLoading = isLoadingReports || isLoadingFiles || isLoadingUrls;

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
      <PrintPreview
        title={`${t("diagnostic_report_other")} - ${t("multi_print")}`}
      >
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
            {t("diagnostic_report_other")}
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
            </div>
          )}

          {/* Grouped Results by Category */}
          <div className="mt-8 space-y-8">
            {groupedReports.map((group) => (
              <div key={group.category.code} className="space-y-4">
                {/* Category Header */}
                <h3 className="text-lg font-semibold uppercase text-gray-700 border-b border-gray-300 pb-1">
                  {t(group.category.code)} {t("results")}
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

                {/* Individual Report Details (notes, conclusions, requesters, files) */}
                <div className="space-y-4 mt-4">
                  {group.reports.map((report) => {
                    const { pdfFiles, imageFiles } = getReportFiles(report.id);
                    const hasFiles =
                      pdfFiles.length > 0 || imageFiles.length > 0;

                    return (
                      <div key={report.id} className="text-sm">
                        {/* Report Title */}
                        <div className="font-medium text-gray-700">
                          {report.code?.display}
                          {report.requester && (
                            <span className="text-gray-500 font-normal ml-2">
                              ({t("requested_by")}:{" "}
                              {formatName(report.requester)})
                            </span>
                          )}
                          {report.created_date && (
                            <span className="text-gray-500 font-normal ml-2">
                              -{" "}
                              {format(
                                new Date(report.created_date),
                                "dd-MM-yyyy",
                              )}
                            </span>
                          )}
                        </div>

                        {/* Notes */}
                        {report.note && (
                          <div className="mt-1">
                            <span className="text-gray-500">
                              {t("notes")}:{" "}
                            </span>
                            <span className="whitespace-pre-wrap">
                              {report.note}
                            </span>
                          </div>
                        )}

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

                        {hasFiles && (
                          <div className="mt-4">
                            {pdfFiles.length > 0 && (
                              <div className="space-y-4">
                                {pdfFiles.map((file) => (
                                  <div key={`pdf-${file.id}`}>
                                    <PDFRenderer fileUrl={fileUrls[file.id!]} />
                                  </div>
                                ))}
                              </div>
                            )}
                            {imageFiles.length > 0 && (
                              <div className="space-y-4">
                                {imageFiles.map((file) => (
                                  <div key={`img-${file.id}`}>
                                    <ImageRenderer
                                      fileUrl={fileUrls[file.id!]}
                                      fileName={file.name}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <PrintFooter showPrintedBy className="mt-12 pt-4 border-t" />
        </div>
      </PrintPreview>
    </div>
  );
}
