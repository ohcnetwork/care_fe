import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

import { TemplateBaseRead } from "@/types/emr/template/template";

export default function TemplateCard({
  template,
  buttons,
}: {
  template: TemplateBaseRead;
  buttons: React.ReactNode;
}) {
  const { t } = useTranslation();
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
        {buttons && (
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {buttons}
          </div>
        )}
      </div>
    </Card>
  );
}
