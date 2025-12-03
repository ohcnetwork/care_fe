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
import { TemplateBaseRead } from "@/types/emr/template/template";
import templateApi from "@/types/emr/template/templateApi";

import reportApi from "@/types/emr/report/reportApi";
import { navigate } from "raviger";
import TemplateCard from "./TemplateCard";
interface TemplateReportSheetProps {
  facilityId: string;
  encounterId?: string;
  patientId?: string;
  associatingId: string;
  reportType: string;
  trigger: React.ReactNode;
  onSuccess?: () => void;
  permissions: string[];
}

export default function TemplateReportSheet({
  facilityId,
  associatingId,
  reportType,
  trigger,
  permissions,
  onSuccess,
}: TemplateReportSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { canListTemplate } = getPermissions(hasPermission, permissions);

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["templates", facilityId, reportType],
    queryFn: query(templateApi.listTemplates, {
      queryParams: {
        facility: facilityId,
        status: "active",
      },
    }),
    enabled: open && canListTemplate,
  });

  const { mutate: generateReport, isPending: isGenerating } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
      setOpen(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
    },
  });

  const handleGenerateReport = (template: TemplateBaseRead) => {
    generateReport({
      template_id: template.id,
      associating_id: associatingId,
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex flex-col sm:flex-row justify-between mt-4">
            <span>{t("available_templates")}</span>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() =>
                navigate(`/facility/${facilityId}/template/builder/`)
              }
            >
              {t("create_template")}
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-3">
          {isTemplatesLoading ? (
            <CardGridSkeleton count={5} />
          ) : !templatesData?.results ||
            templatesData?.results?.length === 0 ? (
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
                  {t("template_description")}
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="space-y-2 mt-3">
                {templatesData?.results?.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    buttons={
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            navigate(
                              `/facility/${facilityId}/template/builder/${template.slug}`,
                            )
                          }
                          disabled={isGenerating}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleGenerateReport(template)}
                          disabled={
                            isGenerating || template.status !== "active"
                          }
                        >
                          {isGenerating
                            ? t("generating")
                            : t("generate_report")}
                        </Button>
                      </>
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
