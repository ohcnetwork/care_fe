import { useQuery, useQueryClient } from "@tanstack/react-query";

import useFileUpload from "@/hooks/useFileUpload";
import { BACKEND_ALLOWED_EXTENSIONS, FileType } from "@/types/files/file";
import fileApi from "@/types/files/fileApi";
import query from "@/Utils/request/query";

export function useDiagnosticReportAttachments(
  reportId: string,
  isExpanded: boolean,
  disableEdit: boolean,
) {
  const queryClient = useQueryClient();
  // Query to fetch files for the diagnostic report
  const { data: files } = useQuery({
    queryKey: ["files", "diagnostic_report", reportId],
    queryFn: query.paginated(fileApi.list, {
      queryParams: {
        file_type: "diagnostic_report",
        associating_id: reportId,
      },
    }),
    enabled: !!reportId && isExpanded,
  });

  // Initialize file upload hook
  const inputId = `file_upload_diagnostic_report_${reportId}`;
  const fileUpload = useFileUpload({
    type: FileType.DIAGNOSTIC_REPORT,
    inputId,
    multiple: true,
    allowedExtensions: BACKEND_ALLOWED_EXTENSIONS,
    allowNameFallback: false,
    onUpload: () => {
      queryClient.invalidateQueries({
        queryKey: ["diagnosticReport", reportId],
      });
    },
    compress: false,
  });

  const openUploadDialog =
    !disableEdit && fileUpload.files.length > 0 && !fileUpload.previewing;
  return { files, fileUpload, inputId, openUploadDialog };
}

export type DiagnosticReportAttachmentState = ReturnType<
  typeof useDiagnosticReportAttachments
>;
