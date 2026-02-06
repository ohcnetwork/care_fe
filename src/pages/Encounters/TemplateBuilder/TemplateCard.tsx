import { useMutation } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import mutate from "@/Utils/request/mutate";
import reportApi from "@/types/emr/report/reportApi";
import { TemplateBaseRead } from "@/types/emr/template/template";

import { toast } from "sonner";

interface TemplateCardProps {
  template: TemplateBaseRead;
  facilityId: string;
  canWriteTemplate?: boolean;
  canGenerate?: boolean;
  associatingId?: string;
  onSuccess?: () => void;
}

export default function TemplateCard({
  template,
  facilityId,
  canWriteTemplate,
  canGenerate,
  associatingId,
  onSuccess,
}: TemplateCardProps) {
  const { t } = useTranslation();

  const { mutate: generateReport, isPending } = useMutation({
    mutationFn: mutate(reportApi.createReport),
    onSuccess: () => {
      toast.success(t("report_generation_started"));
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || t("report_generation_failed"));
    },
  });

  const handleGenerateReport = () => {
    generateReport({
      template_id: template.id,
      associating_id: associatingId ?? "",
      output_format: template.default_format,
      options: JSON.stringify({}),
      force: false,
    });
  };

  return (
    <Card
      key={template.id}
      className="flex flex-col justify-between gap-2 rounded-md bg-gray-100 p-3"
    >
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <div className="flex flex-col">
          <span className="font-medium">{template.name}</span>
          <span className="text-xs text-gray-500">{template.slug}</span>
        </div>
        <Badge
          variant={template.status === "active" ? "primary" : "secondary"}
          className="text-xs self-start"
        >
          {t(template.status)}
        </Badge>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
        <div className="flex flex-row gap-2 justify-start items-center">
          <Badge variant="blue" className="text-xs">
            {template.default_format.toUpperCase()}
          </Badge>
          <span className="text-xs text-gray-500">
            {t(template.template_type)}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {canWriteTemplate && (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link
                href={`/facility/${facilityId}/template/builder/${template.slug}`}
              >
                <CareIcon icon="l-pen" className="mr-1" />
                <span>{t("edit")}</span>
              </Link>
            </Button>
          )}
          {canGenerate && associatingId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleGenerateReport}
              disabled={isPending || template.status !== "active"}
            >
              {isPending ? t("generating") : t("generate_report")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
