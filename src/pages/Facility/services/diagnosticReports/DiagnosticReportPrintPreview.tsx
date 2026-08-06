import PrintPreview from "@/CAREUI/misc/PrintPreview";
import PrintFooter from "@/components/Common/PrintFooter";
import { DiagnosticReportResultsTable } from "@/pages/Facility/services/diagnosticReports/components/DiagnosticReportResultsTable";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { ObservationStatus } from "@/types/emr/observation/observation";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import fileApi from "@/types/files/fileApi";
import { PatientIdentifierUse } from "@/types/patient/patientIdentifierConfig/patientIdentifierConfig";
import query from "@/Utils/request/query";
import { formatName, formatPatientAge } from "@/Utils/utils";
import { useQueries, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import "@/lib/pdfWorker";
import { Document, Page } from "react-pdf";

// TODO: Replace with PDFViewer or extract this to a component
function PDFRenderer({ fileUrl }: { fileUrl: string }) {
  const [numPages, setNumPages] = useState<number>(0);
  const { t } = useTranslation();

  return (
    <div className="break-before-page">
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
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </div>
      </Document>
    </div>
  );
}

function ImageRenderer({
  fileUrl,
  fileName,
}: {
  fileUrl: string;
  fileName?: string;
}) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div className="break-before-page flex flex-col justify-center w-full">
      {isLoading && (
        <div className="text-gray-500 text-center py-4">{t("loading")}</div>
      )}
      {hasError && (
        <div className="text-red-500 text-center py-4">
          {t("error_loading_image")}
        </div>
      )}
      <img
        src={fileUrl}
        alt={fileName || t("diagnostic_report_image")}
        className={`max-w-full h-auto mx-auto ${isLoading || hasError ? "hidden" : ""}`}
        style={{ maxWidth: "600px" }}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}
export const DiagnosticReportPrintPreview = ({
  diagnosticReports,
}: {
  diagnosticReports: DiagnosticReportRead[];
}) => {
  const { facility } = useCurrentFacility();
  const { t } = useTranslation();

  const diagnosticReportDetail = diagnosticReports[0];

  const diagnosticReportLength = diagnosticReports.length;

  return (
    <div className="flex justify-center items-center">
      <PrintPreview
        title={`${t("diagnostic_report", { count: diagnosticReportLength })} - ${diagnosticReportDetail?.service_request?.title || t("diagnostic_report", { count: diagnosticReportLength })}`}
        facility={facility}
        templateSlug={PrintTemplateType.diagnostic_report}
      >
        <div>
          <h2 className="text-gray-500 uppercase text-sm tracking-wide font-semibold mb-2">
            {diagnosticReportDetail?.service_request?.title ||
              t("diagnostic_report", { count: 1 })}
          </h2>

          {/* Patient Details */}
          <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 border-t border-gray-200 pt-2">
            <div className="grid grid-cols-[6rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("patient")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold ml-2 wrap-break-word">
                {diagnosticReportDetail?.encounter.patient.name}
              </span>
            </div>
            {diagnosticReportDetail?.encounter.patient &&
              "instance_identifiers" in
                diagnosticReportDetail.encounter.patient &&
              diagnosticReportDetail.encounter.patient.instance_identifiers
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
                {diagnosticReportDetail?.encounter.patient && (
                  <>
                    {formatPatientAge(
                      diagnosticReportDetail.encounter.patient,
                      true,
                    )}{" "}
                    /
                    <span className="capitalize ml-1">
                      {t(
                        `GENDER__${diagnosticReportDetail.encounter.patient.gender}`,
                      )}
                    </span>
                  </>
                )}
              </span>
            </div>
          </div>
          {diagnosticReports.map((report) => (
            <DiagnosticReportPreviewItem key={report.id} report={report} />
          ))}

          {/* Footer */}
          <PrintFooter showPrintedBy className="mt-12 pt-4 border-t" />
        </div>
      </PrintPreview>
    </div>
  );
};

const DiagnosticReportPreviewItem = ({
  report,
}: {
  report: DiagnosticReportRead;
}) => {
  const { t } = useTranslation();
  // Query to fetch files for the diagnostic report
  const { data: files = { results: [], count: 0 } } = useQuery({
    queryKey: ["files", "diagnostic_report", report?.id],
    queryFn: query.paginated(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: report?.id,
      },
    }),
  });

  // Fetch a signed URL for each file via parallel queries.
  const filesWithId = files.results.filter((file) => file.id);

  const fileUrlQueries = useQueries({
    queries: filesWithId.map((file) => ({
      queryKey: ["diagnostic_report_file_url", report?.id, file.id],
      queryFn: query(fileApi.get, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: report?.id,
        },
        pathParams: { fileId: file.id! },
      }),
    })),
  });

  const fileUrls: Record<string, string> = {};
  filesWithId.forEach((file, index) => {
    const url = fileUrlQueries[index]?.data?.read_signed_url;
    if (file.id && url) {
      fileUrls[file.id] = url;
    }
  });

  if (!report) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          {t("diagnostic_report_not_found")}
        </div>
      </div>
    );
  }

  // Filter files - separate PDFs and images with URLs
  const pdfFiles = files.results.filter((file) => {
    if (!file.id || !fileUrls[file.id] || !file.extension || file.is_archived)
      return false;
    return /pdf$/i.test(file.extension);
  });

  const imageFiles = files.results.filter((file) => {
    if (!file.id || !fileUrls[file.id] || !file.extension || file.is_archived)
      return false;
    return /(jpg|jpeg|png|gif|webp)$/i.test(file.extension);
  });

  return (
    <div className="mt-8 border-t border-gray-300 pt-6">
      {/* Report header with per-report details */}
      <div className="break-inside-avoid">
        <h2 className="text-lg font-semibold mb-3">{report.code?.display}</h2>
        <div className="grid md:grid-cols-2 print:grid-cols-2 gap-x-6 gap-y-1 mb-6">
          <div className="grid grid-cols-[6rem_auto_1fr] items-center">
            <span className="text-gray-600">{t("category")}</span>
            <span className="text-gray-600">:</span>
            <span className="font-semibold ml-2 wrap-break-word">
              {report.category?.display || "-"}
            </span>
          </div>
          <div className="grid grid-cols-[6rem_auto_1fr] items-center">
            <span className="text-gray-600">{t("report_date")}</span>
            <span className="text-gray-600">:</span>
            <span className="font-semibold ml-2">
              {report.created_date &&
                format(new Date(report.created_date), "dd-MM-yyyy")}
            </span>
          </div>
          <div className="grid grid-cols-[6rem_auto_1fr] items-center">
            <span className="text-gray-600">{t("requested_by")}</span>
            <span className="text-gray-600">:</span>
            <span className="font-semibold ml-2">
              {formatName(report.requester)}
            </span>
          </div>
          {report.encounter?.current_location && (
            <div className="grid grid-cols-[6rem_auto_1fr] items-center">
              <span className="text-gray-600">{t("location")}</span>
              <span className="text-gray-600">:</span>
              <span className="font-semibold ml-2">
                {report.encounter.current_location.name}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-8">
        {/* Test Results */}
        {!!report.observations && report.observations.length > 0 && (
          <div>
            <DiagnosticReportResultsTable
              observations={report.observations.filter(
                (obs) => obs.status !== ObservationStatus.ENTERED_IN_ERROR,
              )}
            />
          </div>
        )}
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
              <div className="text-sm font-medium text-gray-950 mb-1">
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
            {imageFiles.length > 0 && (
              <div className="mt-8">
                <div className="space-y-12">
                  {imageFiles.map((file) => (
                    <div key={`content-${file.id}`}>
                      <ImageRenderer
                        fileUrl={fileUrls[file.id!]}
                        fileName={file.name}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
