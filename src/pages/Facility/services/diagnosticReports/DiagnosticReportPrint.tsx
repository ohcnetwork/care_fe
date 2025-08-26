import careConfig from "@careConfig";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Document, Page, pdfjs } from "react-pdf";

import PrintPreview from "@/CAREUI/misc/PrintPreview";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { formatName } from "@/Utils/utils";
import diagnosticReportApi from "@/types/emr/diagnosticReport/diagnosticReportApi";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";

import { DiagnosticReportResultsTable } from "./components/DiagnosticReportResultsTable";

pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

// TODO: Replace with PDFViewer or extract this to a component
function PDFRenderer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const { t } = useTranslation();

  return (
    <Document
      file={fileUrl}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
      error={<div className="text-red-500">{t("error_loading_pdf")}</div>}
      loading={<div className="text-gray-500">{t("loading")}</div>}
    >
      <div className="flex flex-col justify-center w-full">
        {Array.from(new Array(numPages), (_, index) => (
          <Page
            key={`page_${index + 1}`}
            pageNumber={index + 1}
            width={Math.min(window.innerWidth * 0.9, 600)}
            scale={1.2}
          />
        ))}
      </div>
    </Document>
  );
}

export default function DiagnosticReportPrint({
  patientId,
  diagnosticReportId,
}: {
  patientId: string;
  diagnosticReportId: string;
}) {
  const { t } = useTranslation();

  const { data: report, isLoading } = useQuery({
    queryKey: ["diagnosticReport", diagnosticReportId],
    queryFn: query(diagnosticReportApi.retrieveDiagnosticReport, {
      pathParams: {
        patient_external_id: patientId,
        external_id: diagnosticReportId,
      },
    }),
  });

  // Query to fetch files for the diagnostic report
  const { data: files = { results: [], count: 0 } } = useQuery<
    PaginatedResponse<FileReadMinimal>
  >({
    queryKey: ["files", "diagnostic_report", report?.id],
    queryFn: query(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report?.id,
        limit: 100,
        offset: 0,
      },
    }),
    enabled: !!report?.id,
  });

  // Function to get signed URL for a file
  const getFileUrl = async (file: FileReadMinimal) => {
    if (!file.id || !report?.id) return null;

    try {
      const data = await query(fileApi.get, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: report.id,
        },
        pathParams: { fileId: file.id },
      })({} as any);

      return data?.read_signed_url as string;
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      return null;
    }
  };

  // Store file URLs
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});

  // Fetch signed URLs for all files
  useEffect(() => {
    if (!files.results.length) return;

    const fetchAllUrls = async () => {
      const urls: Record<string, string> = {};

      for (const file of files.results) {
        if (!file.id) continue;
        const url = await getFileUrl(file);
        if (url) {
          urls[file.id] = url;
        }
      }

      setFileUrls(urls);
    };

    fetchAllUrls();
  }, [files.results, report?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          {t("diagnostic_report_not_found")}
        </div>
      </div>
    );
  }

  // Filter files - only include PDFs with URLs
  const pdfFiles = files.results.filter((file) => {
    if (!file.id || !fileUrls[file.id] || !file.extension) return false;
    return file.extension.toLowerCase().endsWith("pdf");
  });

  return (
    <div className="flex justify-center items-center">
      <PrintPreview
        title={`${t("diagnostic_report")} - ${report.code?.display || "diagnostic_report"}`}
      >
        <div className="min-h-screen py-8 max-w-4xl mx-auto">
          {/* Header with Facility Name and Logo */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200">
            <div className="space-y-4 flex-1">
              <div>
                <h1 className="text-3xl font-semibold">
                  {report.encounter?.facility?.name}
                </h1>
                <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mt-1">
                  {t("diagnostic_report")}
                </h2>
              </div>
            </div>
            <img
              src={careConfig.mainLogo?.dark}
              alt="Care Logo"
              className="h-10 w-auto object-contain ml-6"
            />
          </div>

          {/* Patient Details */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("patient")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold break-words">
                {report.encounter?.patient?.name}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("category")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold break-words">
                {report.category?.display || "-"}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("status")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold capitalize">
                {t(report.status)}
              </span>
            </div>

            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("date")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold">
                {report.encounter?.created_date &&
                  format(
                    new Date(report.encounter.created_date),
                    "dd MMM yyyy, EEEE",
                  )}
              </span>
            </div>
            <div className="grid grid-cols-[10rem_auto_1fr] md:grid-cols-[8rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("report_created_by")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold">
                {formatName(report.created_by)}
              </span>
            </div>
          </div>

          <div className="mt-8 space-y-8">
            {/* Test Results */}
            <div>
              <h2 className="text-lg font-semibold mb-4">
                {t("test_results")}
              </h2>
              <DiagnosticReportResultsTable
                observations={report.observations}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
            {report.note && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t("notes")}
                </div>
                <div className="whitespace-pre-wrap text-sm">{report.note}</div>
              </div>
            )}
            {report.conclusion && (
              <div className="col-span-full">
                <div className="text-sm font-medium text-gray-500 mb-1">
                  {t("conclusion")}
                </div>
                <div className="whitespace-pre-wrap text-sm">
                  {report.conclusion}
                </div>
              </div>
            )}
          </div>

          {files.results.length > 0 && (
            <div className="mt-8">
              {pdfFiles.length > 0 && (
                <div className="mt-8">
                  <div className="space-y-12">
                    {pdfFiles.map((file) => (
                      <div key={`content-${file.id}`}>
                        <PDFRenderer fileUrl={fileUrls[file.id!]} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-4 border-t text-[10px] text-gray-500 flex justify-between">
            <p>
              {t("generated_on")} {format(new Date(), "PPP 'at' p")}
            </p>
            <p>
              {t("generated_by")} {formatName(report.created_by)}
            </p>
          </div>
        </div>
      </PrintPreview>
    </div>
  );
}
