import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import query from "@/Utils/request/query";
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";

import { ReportType } from "@/types/emr/report/report";

export function getReportBasePath(
  reportType: ReportType | undefined,
  associatingId: string,
  facilityId?: string,
  patientId?: string,
): string | null {
  switch (reportType) {
    case ReportType.DISCHARGE_SUMMARY:
      return facilityId && patientId
        ? `/facility/${facilityId}/patient/${patientId}/encounter/${associatingId}`
        : null;
    case ReportType.ACCOUNT_REPORT:
      return facilityId
        ? `/facility/${facilityId}/billing/account/${associatingId}`
        : null;
    case ReportType.PATIENT_SUMMARY:
      return facilityId && patientId
        ? `/facility/${facilityId}/patient/${patientId}`
        : null;
    default:
      return null;
  }
}

export interface ReportTemplateOption {
  template: TemplateBaseRead;
  url: string;
}

// Templates are searched server-side so that reports beyond the first page (backend default is 14) stay reachable.
export function useReportTemplateOptions({
  facilityId,
  patientId,
  associatingId,
  reportType,
  enabled,
}: {
  facilityId: string;
  patientId?: string;
  associatingId: string;
  reportType?: ReportType;
  enabled: boolean;
}) {
  const [search, setSearch] = useState("");

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["templates", facilityId, reportType, search],
    queryFn: query.debounced(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        template_type: reportType,
        status: "active",
        name: search || undefined,
      },
    }),
    enabled: enabled && !!reportType,
  });

  const basePath = getReportBasePath(
    reportType,
    associatingId,
    facilityId,
    patientId,
  );

  const templates: ReportTemplateOption[] = basePath
    ? (templatesData?.results ?? []).map((template) => ({
        template,
        url: `${basePath}/report/template/${template.slug}`,
      }))
    : [];

  return { templates, isLoading, search, setSearch };
}
