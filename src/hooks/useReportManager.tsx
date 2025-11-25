import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import {
  ReportDownloadRead,
  ReportRead,
  ReportReadList,
} from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";

export interface UseReportManagerOptions {
  associatingId: string;
  enabled?: boolean;
}

export interface UseReportManagerResult {
  reports: ReportReadList[];
  isLoading: boolean;
  downloadReport: (reportId: string) => Promise<void>;
  archiveReport: (report: ReportRead) => void;
  refetch: () => void;
  Dialogs: React.ReactNode;
}

export default function useReportManager({
  associatingId,
  enabled = true,
}: UseReportManagerOptions): UseReportManagerResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [archiveDialogOpen, setArchiveDialogOpen] = useState<ReportRead | null>(
    null,
  );
  const [archiveReason, setArchiveReason] = useState("");
  const [archiveReasonError, setArchiveReasonError] = useState("");

  // Fetch reports
  const {
    data: reportsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["reports", associatingId],
    queryFn: query(reportApi.listReports, {
      queryParams: {
        associating_id: associatingId,
        upload_completed: "true",
      },
    }),
    enabled: enabled && !!associatingId,
  });

  // Download report mutation
  const { mutateAsync: downloadReportMutation } = useMutation({
    mutationFn: (reportId: string) =>
      query(reportApi.downloadReport, {
        pathParams: { report_id: reportId },
      })({} as any),
    onSuccess: (data: ReportDownloadRead) => {
      // Open download URL in new tab
      if (data.download_url) {
        window.open(data.download_url, "_blank");
        toast.success(t("download_started"));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t("download_failed"));
    },
  });

  // Archive report mutation
  const { mutateAsync: archiveReportMutation, isPending: isArchiving } =
    useMutation({
      mutationFn: (data: { reportId: string; archive_reason: string }) =>
        mutate(reportApi.archiveReport, {
          pathParams: { report_id: data.reportId },
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

  // Download report handler
  const downloadReport = async (reportId: string) => {
    await downloadReportMutation(reportId);
  };

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

  // Archive dialog
  const Dialogs = (
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
  );

  return {
    reports: reportsData?.results || [],
    isLoading,
    downloadReport,
    archiveReport,
    refetch,
    Dialogs,
  };
}
