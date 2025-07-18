import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { ReportTemplateModel } from "@/types/reportTemplate/reportTemplate";

export default function ReportCard({
  template,
  buttons,
}: {
  template: ReportTemplateModel;
  buttons: React.ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Card
      key={template.id}
      className="flex flex-col justify-between gap-2 rounded-md bg-gray-100 p-3"
    >
      <div className="flex flex-col sm:flex-row justify-between">
        <span>{template.slug}</span>
        <span className="text-xs text-gray-500">
          {t(template.type.toString())}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 justify-between">
        <div className="flex flex-row gap-2 justify-start">
          {template?.facility ? (
            <Badge variant="primary" className="text-xs">
              {t("facility")}
            </Badge>
          ) : (
            <Badge variant="blue" className="text-xs">
              {t("instance")}
            </Badge>
          )}
        </div>
        {buttons && (
          <div className="flex flex-col sm:flex-row gap-2">{buttons}</div>
        )}
      </div>
    </Card>
  );
}
