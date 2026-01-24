import { useQuery } from "@tanstack/react-query";
import {
  BookmarkIcon,
  CheckIcon,
  FileTextIcon,
  Loader2,
  PillIcon,
  SparklesIcon,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import query from "@/Utils/request/query";
import { QuestionnaireResponseTemplateReadSpec } from "@/types/questionnaire/questionnaireResponseTemplate";
import { questionnaireResponseTemplateApi } from "@/types/questionnaire/questionnaireResponseTemplateApi";

interface ResponseTemplateSelectProps {
  questionnaireId?: string;
  onTemplateSelect: (template: QuestionnaireResponseTemplateReadSpec) => void;
  disabled?: boolean;
  key_filter?: "medication_request" | "service_request" | "questionnaire";
}

export function ResponseTemplateSelect({
  questionnaireId,
  onTemplateSelect,
  disabled,
  key_filter = "medication_request",
}: ResponseTemplateSelectProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [recentlyApplied, setRecentlyApplied] = useState<string | null>(null);

  const { data: templatesResponse, isLoading } = useQuery({
    queryKey: ["questionnaireResponseTemplates", questionnaireId],
    queryFn: query(questionnaireResponseTemplateApi.list, {
      queryParams: {
        ...(questionnaireId &&
        !["medication_request", "service_request"].includes(key_filter)
          ? { questionnaire: questionnaireId }
          : {}),
        limit: 50,
        key_filter: key_filter,
      },
    }),
    enabled: !!questionnaireId && open,
  });

  const templates = templatesResponse?.results ?? [];

  if (!questionnaireId) {
    return null;
  }

  const handleSelect = (template: QuestionnaireResponseTemplateReadSpec) => {
    onTemplateSelect(template);
    setRecentlyApplied(template.id ?? null);
    setTimeout(() => {
      setRecentlyApplied(null);
      setOpen(false);
    }, 500);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <BookmarkIcon className="size-4" />
          {t("apply_template")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel className="flex items-center gap-2 text-xs font-normal text-gray-500">
          <SparklesIcon className="size-3" />
          {t("quick_fill_templates")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <div className="px-3 py-6 text-center">
            <div className="rounded-full bg-gray-100 p-2 w-fit mx-auto mb-2">
              <FileTextIcon className="size-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              {t("no_templates_available")}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t("create_templates_in_settings")}
            </p>
          </div>
        ) : (
          templates.map((template) => {
            const medicationCount =
              template.template_data?.medication_request?.length ?? 0;
            const isApplied = recentlyApplied === template.id;

            return (
              <DropdownMenuItem
                key={template.id}
                onClick={() => handleSelect(template)}
                className={cn(
                  "cursor-pointer py-2.5 px-3",
                  isApplied && "bg-green-50",
                )}
              >
                <div className="flex items-start gap-3 w-full">
                  <div
                    className={cn(
                      "rounded-lg p-1.5 mt-0.5",
                      isApplied ? "bg-green-100" : "bg-gray-100",
                    )}
                  >
                    {isApplied ? (
                      <CheckIcon className="size-3.5 text-green-600" />
                    ) : (
                      <FileTextIcon className="size-3.5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "font-medium truncate",
                          isApplied && "text-green-700",
                        )}
                      >
                        {template.name}
                      </span>
                      {medicationCount > 0 && (
                        <Badge
                          variant="blue"
                          className="text-[10px] px-1.5 py-0 gap-1"
                        >
                          <PillIcon className="size-2.5" />
                          {medicationCount}
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <span className="text-xs text-gray-500 line-clamp-1">
                        {template.description}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
