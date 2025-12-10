import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
  trigger: React.ReactNode;
  onSuccess?: () => void;
  permissions: string[];
}

export default function TemplateReportSheet({
  facilityId,
  associatingId,
  trigger,
  permissions,
  onSuccess,
}: TemplateReportSheetProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  const { canListTemplate, canWriteTemplate, canGenerateReportFromTemplate } =
    getPermissions(hasPermission, permissions);

  const { data: templatesData, isLoading: isTemplatesLoading } = useQuery({
    queryKey: ["templates", facilityId],
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
            {canWriteTemplate && (
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
            )}
          </SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-3">
          {isTemplatesLoading ? (
            <CardGridSkeleton count={5} />
          ) : !templatesData?.results ||
            templatesData?.results?.length === 0 ? (
            <EmptyState
              icon={
                <CareIcon
                  icon="l-file-medical"
                  className="text-green-500 text-2xl"
                />
              }
              title={t("no_templates_found")}
              description={t("template_description")}
              className="my-4 bg-gray-50"
            />
          ) : (
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <div className="space-y-2 mt-3">
                {templatesData?.results?.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    buttons={
                      <>
                        {canWriteTemplate && (
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
                        )}
                        {canGenerateReportFromTemplate && (
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
                        )}
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
