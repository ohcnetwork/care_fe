import { useQueries, useQuery } from "@tanstack/react-query";
import { TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import TypstPrintPreview from "@/CAREUI/misc/TypstPrintPreview";

import useAuthUser from "@/hooks/useAuthUser";
import { buildDiagnosticReportPrintContent } from "@/pages/Facility/services/diagnosticReports/diagnosticReportPrintData";
import {
  type ReportAttachment,
  renderReportAttachments,
} from "@/pages/Facility/services/diagnosticReports/reportAttachments";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { DiagnosticReportRead } from "@/types/emr/diagnosticReport/diagnosticReport";
import { PrintTemplateType } from "@/types/facility/printTemplate";
import { FileReadMinimal } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";

export const DiagnosticReportPrintPreview = ({
  diagnosticReports,
  allFiles,
  isLoading,
}: {
  diagnosticReports: DiagnosticReportRead[];
  allFiles: { reportId: string; file: FileReadMinimal }[];
  isLoading?: boolean;
}) => {
  const { facility } = useCurrentFacilitySilently();
  const user = useAuthUser();
  const { t } = useTranslation();

  const printableFiles = allFiles.filter(
    ({ file }) =>
      file.upload_completed &&
      !file.is_archived &&
      /(pdf|jpg|jpeg|png|gif|webp)$/i.test(file.extension),
  );

  const diagnosticReportLength = diagnosticReports.length;

  // Fetch a signed URL for each file across all reports via parallel queries.
  const { fileUrls, isFetchingFileUrls, isFileUrlsError } = useQueries({
    queries: printableFiles.map(({ reportId, file }) => ({
      queryKey: ["diagnostic_report_file_url", reportId, file.id],
      queryFn: query(fileApi.get, {
        queryParams: {
          file_type: "diagnostic_report",
          associating_id: reportId,
        },
        pathParams: { fileId: file.id },
      }),
    })),
    combine: (results) => {
      const fileUrls: Record<string, string> = {};
      printableFiles.forEach(({ file }, index) => {
        const url = results[index]?.data?.read_signed_url;
        if (url) {
          fileUrls[file.id] = url;
        }
      });
      return {
        fileUrls,
        isFetchingFileUrls: results.some((result) => result.isFetching),
        isFileUrlsError: results.some(
          (result) =>
            result.isError ||
            (result.isSuccess && !result.data.read_signed_url),
        ),
      };
    },
  });

  const attachments: ReportAttachment[] = printableFiles.flatMap(
    ({ reportId, file }) =>
      fileUrls[file.id]
        ? [
            {
              reportId,
              fileId: file.id,
              url: fileUrls[file.id],
              isPdf: /pdf$/i.test(file.extension),
            },
          ]
        : [],
  );

  const rendered = useQuery({
    queryKey: ["diagnostic_report_attachments", attachments.map((a) => a.url)],
    queryFn: () => renderReportAttachments(attachments),
    enabled: !isFetchingFileUrls,
    staleTime: Infinity,
    retry: false,
  });

  if (rendered.isError) {
    return (
      <div role="alert" className="text-red-600">
        {t("diagnostic_report_print_load_error")}
      </div>
    );
  }

  const isReady = !isLoading && !isFetchingFileUrls && !!rendered.data;

  // Show the report without attachments that couldn't be loaded, but don't let
  // an incomplete report be printed.
  const failedFileIds = new Set(rendered.data?.failedFileIds);
  const failedFiles = isReady
    ? printableFiles.filter(
        ({ file }) => !fileUrls[file.id] || failedFileIds.has(file.id),
      )
    : [];
  const hasAttachmentError = isFileUrlsError || failedFiles.length > 0;
  const failedFileNames = failedFiles
    .map(({ file }) => file.name)
    .filter(Boolean);

  return (
    <TypstPrintPreview
      template="diagnostic-report"
      title={`${t("diagnostic_report", { count: diagnosticReportLength })} - ${diagnosticReports[0]?.service_request?.title || t("diagnostic_report", { count: diagnosticReportLength })}`}
      content={
        isReady
          ? buildDiagnosticReportPrintContent({
              diagnosticReports,
              attachmentPaths: rendered.data.paths,
              printedBy: formatName(user),
              t,
            })
          : undefined
      }
      facility={facility}
      templateSlug={PrintTemplateType.diagnostic_report}
      files={rendered.data?.files}
      printDisabled={hasAttachmentError}
      toolbar={
        hasAttachmentError && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertTitle>{t("diagnostic_report_print_load_error")}</AlertTitle>
            {failedFileNames.length > 0 && (
              <AlertDescription>
                {t("diagnostic_report_print_failed_attachments", {
                  files: failedFileNames.join(", "),
                })}
              </AlertDescription>
            )}
          </Alert>
        )
      }
    />
  );
};
