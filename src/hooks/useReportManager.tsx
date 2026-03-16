import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import FilePreviewDialog, {
  StateInterface,
} from "@/components/Common/FilePreviewDialog";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ReportRead,
  ReportReadList,
  ReportType,
} from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { FILE_EXTENSIONS, FileReadMinimal } from "@/types/files/file";

export interface UseReportManagerOptions {
  associatingId: string;
  enabled?: boolean;
  qParams?: Record<string, string>;
  reportType?: ReportType;
}

export interface UseReportManagerResult {
  reports: ReportReadList[];
  isLoading: boolean;
  viewFile: (report: ReportReadList) => void;
  downloadFile: (report: ReportReadList) => Promise<void>;
  archiveReport: (report: ReportRead) => void;
  refetch: () => void;
  Dialogs: React.ReactNode;
}

export default function useReportManager({
  associatingId,
  enabled = true,
  qParams,
  reportType = ReportType.DISCHARGE_SUMMARY,
}: UseReportManagerOptions): UseReportManagerResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState<ReportRead | null>(
    null,
  );
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");

  // File preview state
  const [fileState, setFileState] = useState<StateInterface>({
    open: false,
    isImage: false,
    name: "",
    extension: "",
    isZoomInDisabled: false,
    isZoomOutDisabled: false,
  });
  const [fileUrl, setFileUrl] = useState<string>("");
  const [downloadURL, setDownloadURL] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // Fetch reports
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reports", associatingId, qParams],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        ...qParams,
        associating_id: associatingId,
        upload_completed: "true",
        report_type: reportType,
      },
    }),
    enabled: enabled && !!associatingId,
  });

  const retrieveReport = async (reportId: string) => {
    return queryClient.fetchQuery({
      queryKey: ["report", reportId],
      queryFn: () =>
        query(reportApi.retrieveReport, {
          pathParams: { id: reportId },
        })({} as any),
    });
  };

  // Get file extension from URL
  const getExtension = (url: string) => {
    const fileNameSplit = url.split("?")[0].split(".");
    return fileNameSplit[fileNameSplit.length - 1].toLowerCase();
  };

  // View file handler
  const viewFile = useCallback(
    async (report: ReportReadList) => {
      const index =
        reportsData?.results?.findIndex((r) => r.id === report.id) ?? -1;
      setCurrentIndex(index);
      setFileUrl("");
      setFileState((prev) => ({ ...prev, open: true }));

      const data = await retrieveReport(report.id);
      if (!data) return;

      const signedUrl = data.read_signed_url;
      const extension = getExtension(signedUrl);

      setFileState({
        open: true,
        name: data.name,
        extension,
        isImage: FILE_EXTENSIONS.IMAGE.includes(
          extension as (typeof FILE_EXTENSIONS.IMAGE)[number],
        ),
        isZoomInDisabled: false,
        isZoomOutDisabled: false,
      });
      setDownloadURL(signedUrl);
      setFileUrl(signedUrl);
    },
    [reportsData?.results],
  );

  // Download file handler
  const downloadFile = async (report: ReportReadList) => {
    try {
      toast.success(t("file_download_started"));
      const data = await retrieveReport(report.id);
      const response = await fetch(data?.read_signed_url || "");
      if (!response.ok) throw new Error("Network response was not ok.");

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = report.name || "report";
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
      toast.success(t("file_download_completed"));
    } catch {
      toast.error(t("file_download_failed"));
    }
  };

  // Handle file preview close
  const handleFilePreviewClose = () => {
    setDownloadURL("");
    setFileState((prev) => ({
      ...prev,
      open: false,
      isZoomInDisabled: false,
      isZoomOutDisabled: false,
    }));
  };

  // Archive report mutation
  const { mutateAsync: archiveReportMutation, isPending: isArchiving } =
    useMutation({
      mutationFn: (data: { reportId: string; archive_reason: string }) =>
        mutate(reportApi.archiveReport, {
          pathParams: { id: data.reportId },
        })({ archive_reason: data.archive_reason }),
      onSuccess: () => {
        toast.success(t("report_archived_successfully"));
        queryClient.invalidateQueries({
          queryKey: ["reports", associatingId],
        });
        setArchiveDialogOpen(null);
        setArchiveReason("");
        setArchiveReasonError("");
      },
      onError: (error: Error) => {
        toast.error(error.message || t("archive_failed"));
      },
    });

  // Archive report handler
  const archiveReport = (report: ReportRead) => {
    setArchiveDialogOpen(report);
  };

  // Validate archive reason
  const validateArchiveReason = (reason: string) => {
    if (reason.trim() === "") {
      setArchiveReasonError(t("please_enter_a_valid_reason"));
      return false;
    }
    setArchiveReasonError("");
    return true;
  };

  // Handle archive confirmation
  const handleArchiveConfirm = async () => {
    if (!archiveDialogOpen) return;

    if (!validateArchiveReason(archiveReason)) {
      return;
    }

    await archiveReportMutation({
      reportId: archiveDialogOpen.id,
      archive_reason: archiveReason,
    });
  };

  // Convert reports to format expected by FilePreviewDialog
  const uploadedFiles = reportsData?.results?.map((report) => ({
    id: report.id,
    name: report.name,
    extension: `.${report.extension}`,
    associating_id: report.associating_id,
    archived_by: report.archived_by,
    archived_datetime: report.archived_datetime,
    upload_completed: report.upload_completed,
    is_archived: report.is_archived,
    archive_reason: report.archive_reason,
    created_date: report.created_date,
    uploaded_by: report.uploaded_by,
  })) as FileReadMinimal[] | undefined;

  // Wrapper to adapt loadFile signature for FilePreviewDialog
  const handleLoadFile = useCallback(
    (file: FileReadMinimal) => {
      const report = reportsData?.results?.find((r) => r.id === file.id);
      if (report) {
        viewFile(report);
      }
    },
    [reportsData?.results, viewFile],
  );

  // Dialogs
  const Dialogs = (
    <>
      <FilePreviewDialog
        show={fileState.open}
        fileUrl={fileUrl}
        file_state={fileState}
        downloadURL={downloadURL}
        uploadedFiles={uploadedFiles}
        onClose={handleFilePreviewClose}
        className="h-[80vh] w-full md:h-screen"
        loadFile={handleLoadFile}
        currentIndex={currentIndex}
      />
      <Dialog
        open={!!archiveDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setArchiveDialogOpen(null);
            setArchiveReason("");
            setArchiveReasonError("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("archive_report")}</DialogTitle>
            <DialogDescription>
              {t("archive_report_confirmation")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="archive-reason">
                {t("reason")}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Textarea
                id="archive-reason"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder={t("enter_reason_for_archiving")}
                className={archiveReasonError ? "border-destructive" : ""}
              />
              {archiveReasonError && (
                <p className="text-sm text-destructive">{archiveReasonError}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setArchiveDialogOpen(null);
                setArchiveReason("");
                setArchiveReasonError("");
              }}
              disabled={isArchiving}
            >
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchiveConfirm}
              disabled={isArchiving}
            >
              {isArchiving ? t("archiving") : t("archive")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return {
    reports: reportsData?.results || [],
    isLoading,
    viewFile,
    downloadFile,
    archiveReport,
    refetch,
    Dialogs,
  };
}
