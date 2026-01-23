import { useQuery } from "@tanstack/react-query";
import { FileTextIcon, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import query from "@/Utils/request/query";
import { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

interface ResponseTemplateSelectProps {
  questionnaireId?: string;
  onTemplateSelect: (template: QuestionnaireResponseTemplateReadSpec) => void;
  disabled?: boolean;
}

export function ResponseTemplateSelect({
  questionnaireId,
  onTemplateSelect,
  disabled,
}: ResponseTemplateSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ["questionnaireResponseTemplates", questionnaireId],
    queryFn: query(questionnaireResponseTemplateApi.list, {
      queryParams: {
        questionnaire: questionnaireId,
        limit: 50,
      },
    }),
    enabled: !!questionnaireId && open,
  });

  const templates = templatesResponse?.results ?? [];

  if (!questionnaireId) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <FileTextIcon className="size-4" />
          {t("apply_template")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : templates.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-gray-500">
            {t("no_templates_available")}
          </div>
        ) : (
          templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => {
                onTemplateSelect(template);
                setOpen(false);
              }}
              className="cursor-pointer"
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{template.name}</span>
                {template.description && (
                  <span className="text-xs text-gray-500 line-clamp-1">
                    {template.description}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
