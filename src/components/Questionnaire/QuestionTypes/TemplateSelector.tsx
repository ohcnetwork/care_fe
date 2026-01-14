import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { TemplateConfig } from "@/types/questionnaire/question";

interface TemplateSelectorProps {
  templates: TemplateConfig[];
  onAddTemplates: (contents: string[]) => void;
  disabled?: boolean;
}

export function TemplateSelector({
  templates,
  onAddTemplates,
  disabled = false,
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleAddTemplates = () => {
    if (selectedTemplates.length === 0) return;

    const contents = selectedTemplates
      .map((templateName) => {
        const template = templates.find((t) => t.name === templateName);
        return template?.content;
      })
      .filter((content): content is string => content !== undefined);

    onAddTemplates(contents);
    setSelectedTemplates([]);
    setIsDropdownOpen(false);
  };

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <div className="mt-2">
      <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" disabled={disabled}>
            <CareIcon icon="l-plus" className="mr-2 size-4" />
            {t("add_template")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel>{t("available_templates")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {templates.map((template) => (
            <div
              key={template.name}
              className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
              onClick={() => {
                setSelectedTemplates((prev) =>
                  prev.includes(template.name)
                    ? prev.filter((t) => t !== template.name)
                    : [...prev, template.name],
                );
              }}
            >
              <Checkbox
                checked={selectedTemplates.includes(template.name)}
                onCheckedChange={(checked) => {
                  setSelectedTemplates((prev) =>
                    checked
                      ? [...prev, template.name]
                      : prev.filter((t) => t !== template.name),
                  );
                }}
              />
              <span className="text-sm font-medium text-gray-900">
                {template.name}
              </span>
            </div>
          ))}
          <DropdownMenuSeparator />
          <div className="p-1">
            <Button
              onClick={handleAddTemplates}
              disabled={selectedTemplates.length === 0}
              className="w-full"
              size="sm"
            >
              <CareIcon icon="l-plus" className="mr-2 size-4" />
              {t("add_template")}
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
