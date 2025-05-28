import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { CardGridSkeleton } from "@/components/Common/SkeletonLoading";

import { getPermissions } from "@/common/Permissions";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { usePermissions } from "@/context/PermissionContext";
import { ReportTemplateType } from "@/types/reportTemplate/reportTemplate";
import reportTemplateApi from "@/types/reportTemplate/reportTemplateApi";

import ReportCard from "./ReportCard";

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
  patientId,
  trigger,
  permissions,
  onSuccess,
}: ReportBuilderSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { canListTemplate } = getPermissions(hasPermission, permissions);
  const { data: reportTemplateData, isLoading: isReportTemplateLoading } =
    useQuery({
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
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-6">
          {isReportTemplateLoading ? (
            <CardGridSkeleton count={5} />
          ) : !reportTemplateData?.results ||
            reportTemplateData?.results?.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-10 border border-dashed border-gray-300 rounded-lg bg-gray-50 my-4">
              <div className="text-center max-w-md">
                <div className="flex flex-row items-center justify-center gap-2">
                  <div className="bg-gray-50 p-2 rounded-full size-10 flex items-center justify-center border border-gray-200 shadow-sm">
                    <CareIcon
                      icon="l-file-medical"
                      className="text-green-500 text-2xl"
                    />
                  </div>
                  <h4 className="text-xl font-normal text-gray-800">
                    {t("no_templates_found")}
                  </h4>
                </div>
                <p className="text-gray-600 text-sm mt-4">
                  {t("report_template_description")}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="space-y-2 m-4">
                {reportTemplateData?.results?.map((reportTemplate) => (
                  <ReportCard
                    key={reportTemplate.id}
                    template={reportTemplate}
                    buttons={
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleGenerateReport(reportTemplate)}
                      >
                        {t("generate_report")}
                      </Button>
                    }
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
