import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, SearchIcon } from "lucide-react";
import { Link, navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NavigationHelper from "@/components/ui/multi-filter/utils/navigation-helper";

import { PERMISSION_LIST_TEMPLATE } from "@/common/Permissions";
import { usePermissions } from "@/context/PermissionContext";

import query from "@/Utils/request/query";
import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
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

  // Clear a stale search once the caller stops needing templates (e.g. the menu closed).
  const [prevEnabled, setPrevEnabled] = useState(enabled);
  if (enabled !== prevEnabled) {
    setPrevEnabled(enabled);
    if (!enabled && search) setSearch("");
  }

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

export function ReportTemplateSearchList({
  templates,
  isLoading,
  search,
  onSearchChange,
}: {
  templates: ReportTemplateOption[];
  isLoading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="px-2 pt-2">
      <div className="relative mb-2">
        <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
        <Input
          type="search"
          placeholder={t("search_templates")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          className="pl-8 h-8"
        />
      </div>
      <div className="max-h-[30vh] overflow-y-auto pb-2">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-3 text-sm text-gray-500">
            <CareIcon icon="l-spinner" className="size-4 animate-spin" />
            {t("loading")}
          </div>
        ) : templates.length === 0 ? (
          <p className="py-3 text-center text-sm text-gray-500">
            {t("no_templates_found")}
          </p>
        ) : (
          templates.map(({ template, url }) => (
            <DropdownMenuItem key={template.id} asChild>
              <Link href={url}>
                <FileText className="mr-2 size-4 shrink-0" />
                <span className="truncate">{template.name}</span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </div>
    </div>
  );
}

export function GenerateReportDropdown({
  facilityId,
  patientId,
  associatingId,
  reportType,
}: {
  facilityId: string;
  patientId?: string;
  associatingId: string;
  reportType?: ReportType;
}) {
  const { t } = useTranslation();
  const { facility } = useCurrentFacilitySilently();
  const { hasPermission } = usePermissions();

  const canListTemplate = hasPermission(
    PERMISSION_LIST_TEMPLATE,
    facility?.permissions,
  );

  const { templates, isLoading, search, setSearch } = useReportTemplateOptions({
    facilityId,
    patientId,
    associatingId,
    reportType,
    enabled: canListTemplate,
  });

  if (!isLoading && templates.length === 0 && !search) return null;

  // Freeze the single-button vs dropdown decision to the unfiltered result: once a search is
  // active, the loading state of a refetch must not unmount the open DropdownMenu.
  if (!search && (isLoading || templates.length === 1)) {
    return (
      <Button
        variant="outline_primary"
        disabled={isLoading}
        onClick={() => templates[0] && navigate(templates[0].url)}
      >
        {isLoading ? (
          <CareIcon icon="l-spinner" className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        <span>{t("generate_report")}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu onOpenChange={(open) => !open && setSearch("")}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline_primary">
          <Plus className="size-4" />
          <span>{t("generate_report")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-full max-w-[calc(100vw-3rem)] sm:max-w-xs p-0"
      >
        <ReportTemplateSearchList
          templates={templates}
          isLoading={isLoading}
          search={search}
          onSearchChange={setSearch}
        />
        <NavigationHelper hideRightArrow />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
