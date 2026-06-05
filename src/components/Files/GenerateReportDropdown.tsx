import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2, Plus } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NavigationHelper from "@/components/ui/multi-filter/utils/navigation-helper";

import query from "@/Utils/request/query";
import { ReportType } from "@/types/emr/report/report";
import templateApi from "@/types/emr/template/templateApi";

interface GenerateReportDropdownProps {
  facilityId: string;
  reportType?: ReportType;
  getReportUrl: (templateSlug: string) => string;
}

export function GenerateReportDropdown({
  facilityId,
  reportType,
  getReportUrl,
}: GenerateReportDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: templatesData, isLoading } = useQuery({
    queryKey: ["templates", facilityId, reportType, "active"],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        template_type: reportType,
        status: "active",
      },
    }),
    enabled: open,
  });

  const templates = templatesData?.results ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
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
        <div className="px-2 pt-2">
          <div className="max-h-[30vh] overflow-y-auto">
            {isLoading && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center flex items-center justify-center gap-2">
                <Loader2 className="size-4 animate-spin" />
                {t("loading")}
              </div>
            )}
            {!isLoading && templatesData && templates.length === 0 && (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                {t("no_templates_found")}
              </div>
            )}
            {templates.map((template) => (
              <DropdownMenuItem key={template.id} asChild>
                <Link
                  href={getReportUrl(template.slug)}
                  className="flex items-center gap-2 px-3 py-2 cursor-pointer"
                >
                  <FileText className="size-4 shrink-0 text-gray-500" />
                  <span className="text-sm truncate">{template.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
          {!isLoading && templatesData && templates.length > 0 && (
            <NavigationHelper hideRight />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
