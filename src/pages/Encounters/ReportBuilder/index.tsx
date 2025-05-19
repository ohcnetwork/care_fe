import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { ReportTemplateType } from "@/types/reportTemplate/reportTemplate";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

interface ReportBuilderSheetProps {
  facilityId: string;
  encounterId: string;
  patientId: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  permissions: string[];
}

export default function ReportBuilderSheet({
  facilityId,
  encounterId,
  patientId,
  trigger,
  permissions,
  onSuccess,
}: ReportBuilderSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { canManageTemplate, canListTemplate } = getPermissions(
    hasPermission,
    permissions,
  );
  const { data: reportTemplateData } = useQuery({
    queryKey: ["report-templates", facilityId],
    queryFn: query(reportTemplateApi.list, {
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: open && canListTemplate,
  });

  const { mutate: generateReport } = useMutation({
    mutationFn: mutate(reportTemplateApi.generateReport),
  });

  const handleGenerateReport = (reportTemplate: {
    type: ReportTemplateType;
    slug: string;
  }) => {
    generateReport({
      render_format: "typst",
      type: reportTemplate.type,
      slug: reportTemplate.slug,
      patient_external_id: patientId,
      facility: facilityId,
    });
    toast.success(
      t("report_builder_will_be_generated", {
        reportSlug: reportTemplate.slug,
      }),
    );
    onSuccess?.();
  };
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex flex-col sm:flex-row justify-between mt-4">
            <span>{t("available_reports")}</span>
            {canManageTemplate && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/reportbuilder/new`}
                >
                  {t("create_new_report")}
                </Link>
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="space-y-2 m-4">
              {reportTemplateData?.results?.map((reportTemplate) => (
                <Card
                  key={reportTemplate.id}
                  className="flex flex-col sm:flex-row justify-between gap-2 rounded-md bg-gray-100 p-3"
                >
                  <div className="flex flex-col">
                    <span>{reportTemplate.slug}</span>
                    <span className="text-xs text-gray-500">
                      {t(reportTemplate.type.toString())}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {canManageTemplate && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <Link
                          href={`/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/reportbuilder/${reportTemplate.id}`}
                        >
                          {t("edit_template")}
                        </Link>
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => handleGenerateReport(reportTemplate)}
                    >
                      {t("generate_report")}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
