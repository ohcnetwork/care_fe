import { t } from "i18next";
import { Building } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

import { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import { QuestionnaireTagModel } from "@/types/questionnaire/tags";

export default function QuestionnairePreviewProperties({
  questionnaire,
}: {
  questionnaire: QuestionnaireDetail;
}) {
  return (
    <Card className="border-none bg-transparent shadow-none space-y-4 mt-2 ml-2">
      <CardHeader className="p-0">
        <CardTitle>{t("properties")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 p-0">
        <div className="flex flex-col gap-8">
          <div className="flex flex-row lg:gap-2 justify-between">
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-gray-500">{t("status")}</Label>
              <div className="text-sm font-semibold">
                {t(questionnaire.status)}
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-gray-500">
                {t("subject_type")}
              </Label>
              <div className="text-sm font-semibold">
                {t(questionnaire.subject_type)}
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <Label className="text-xs text-gray-500">{t("version")}</Label>
              <div className="text-sm font-semibold">
                {questionnaire.version || "0.0.1"}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <Label className="text-xs text-gray-500">{t("tags")}</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {questionnaire.tags.map((tag: QuestionnaireTagModel) => (
                <Badge
                  key={tag.id}
                  variant="primary"
                  className="flex items-center gap-1"
                >
                  <Building className="size-3" />
                  {tag.name}
                </Badge>
              ))}
              {questionnaire.tags.length === 0 && (
                <p className="text-sm text-gray-500">{t("no_tags_selected")}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
