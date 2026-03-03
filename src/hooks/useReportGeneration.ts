import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ReportReadList } from "@/types/emr/report/report";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";
import mutate from "@/Utils/request/mutate";
import query, { callApi } from "@/Utils/request/query";

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 10000;

interface UseReportGenerationOptions {
  encounterId: string;
}

interface UseReportGenerationResult {
  generatingTemplateId: string | null;
  downloadingTemplateId: string | null;
  generate: (template: TemplateBaseRead) => void;
  download: (report: ReportReadList, templateId: string) => Promise<void>;
}

export default function useReportGeneration({
  encounterId,
}: UseReportGenerationOptions): UseReportGenerationResult {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [generatingTemplateId, setGeneratingTemplateId] = useState<
    string | null
  >(null);
  const [downloadingTemplateId, setDownloadingTemplateId] = useState<
    string | null
  >(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const generationStartRef = useRef<Date | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
      pollTimeoutRef.current = null;
    }
    generationStartRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => stopPolling, [stopPolling]);

  const invalidateReports = useCallback(
    () =>
      queryClient.invalidateQueries({
        queryKey: ["reports", encounterId],
      }),
    [queryClient, encounterId],
  );

  const downloadReportFile = useCallback(
    async (report: ReportReadList) => {
      const data = await queryClient.fetchQuery({
        queryKey: ["report", report.id],
        queryFn: query(reportApi.retrieveReport, {
          pathParams: { id: report.id },
        }),
      });

      if (!data?.read_signed_url) {
        throw new Error("Download URL not available");
      }

      const response = await fetch(data.read_signed_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = report.name || report.report_type || "report";
      anchor.click();
      window.URL.revokeObjectURL(url);
    },
    [queryClient],
  );

  const fetchLatestReport = useCallback(
    async (templateSlug: string) => {
      await invalidateReports();

      const data = await queryClient.fetchQuery({
        queryKey: [
          "reports",
          encounterId,
          "template",
          templateSlug,
          "fresh",
          Date.now(),
        ],
        queryFn: query(reportApi.listReports, {
          queryParams: {
            associating_id: encounterId,
            upload_completed: "true",
            report_type: "discharge_summary",
            is_archived: "false",
            template: templateSlug,
            limit: 1,
          },
        }),
      });

      return data?.results?.[0];
    },
    [queryClient, encounterId, invalidateReports],
  );

  const pollStatus = useCallback(
    async (template: TemplateBaseRead) => {
      try {
        const response = await callApi(reportApi.createReport, {
          body: {
            template_id: template.id,
            associating_id: encounterId,
            output_format: template.default_format,
            options: JSON.stringify({}),
            force: false,
            status_check: true,
          },
        });

        // Non-empty response means still generating
        if (response && Object.keys(response).length > 0) return;

        const startTime = generationStartRef.current;
        stopPolling();

        const report = await fetchLatestReport(template.slug);
        const isNew =
          report && startTime && new Date(report.created_date) > startTime;

        if (isNew) {
          await downloadReportFile(report);
          toast.success(t("file_download_completed"));
        } else {
          toast.error(t("report_generation_failed"));
        }

        await invalidateReports();
        setGeneratingTemplateId(null);
      } catch {
        // Continue polling on transient errors
      }
    },
    [
      encounterId,
      stopPolling,
      fetchLatestReport,
      downloadReportFile,
      invalidateReports,
      t,
    ],
  );

  const startPolling = useCallback(
    (template: TemplateBaseRead) => {
      if (pollIntervalRef.current || pollTimeoutRef.current) return;

      pollIntervalRef.current = setInterval(
        () => pollStatus(template),
        POLL_INTERVAL_MS,
      );

      pollTimeoutRef.current = setTimeout(() => {
        stopPolling();
        setGeneratingTemplateId(null);
        toast.error(t("report_generation_taking_longer"));
      }, POLL_TIMEOUT_MS);
    },
    [pollStatus, stopPolling, t],
  );

  const { mutate: triggerGeneration } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
      stopPolling();
      setGeneratingTemplateId(null);
    },
  });

  const generate = useCallback(
    (template: TemplateBaseRead) => {
      if (generatingTemplateId || pollIntervalRef.current) {
        toast.info(t("report_generation_in_progress"));
        return;
      }

      setGeneratingTemplateId(template.id);
      generationStartRef.current = new Date();

      triggerGeneration(
        {
          template_id: template.id,
          associating_id: encounterId,
          output_format: template.default_format,
          options: JSON.stringify({}),
          force: false,
        },
        {
          onSuccess: () => {
            toast.success(t("report_generation_started"));
            startPolling(template);
          },
        },
      );
    },
    [generatingTemplateId, encounterId, triggerGeneration, startPolling, t],
  );

  const download = useCallback(
    async (report: ReportReadList, templateId: string) => {
      setDownloadingTemplateId(templateId);
      try {
        await downloadReportFile(report);
        toast.success(t("file_download_completed"));
      } catch {
        toast.error(t("file_download_failed"));
      } finally {
        setDownloadingTemplateId(null);
      }
    },
    [downloadReportFile, t],
  );

  return {
    generatingTemplateId,
    downloadingTemplateId,
    generate,
    download,
  };
}
