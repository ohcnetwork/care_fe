import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import type { TemplateConfig } from "@/types/questionnaire/question";

interface TemplateSelectorProps {
  templates: TemplateConfig[];
  onAddTemplates: (contents: string[]) => void;
  disabled?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TemplateSelector({
  templates,
  onAddTemplates,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
}: TemplateSelectorProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);

  // Support both controlled and uncontrolled modes
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value);
    }
    setInternalOpen(value);
  };

  const handleSelectTemplate = (
    template: TemplateConfig,
    keepOpen: boolean,
  ) => {
    onAddTemplates([template.content]);
    if (!keepOpen) {
      setIsOpen(false);
    }
  };

  if (!templates || templates.length === 0) {
    return null;
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={disabled}
          className="h-8 px-3 text-gray-900 hover:bg-transparent"
        >
          <CareIcon icon="l-file-upload-alt" className="size-4" />
          <span className="font-semibold underline">
            {t("insert_template")}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput
            placeholder={t("search_template")}
            className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
          />
          <CommandList>
            <CommandEmpty>{t("no_templates_found")}</CommandEmpty>
            <CommandGroup>
              {templates.map((template) => (
                <CommandItem
                  key={template.name}
                  value={template.name}
                  onSelect={() => handleSelectTemplate(template, false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.shiftKey) {
                      e.preventDefault();
                      handleSelectTemplate(template, true);
                    }
                  }}
                  className="cursor-pointer"
                >
                  {template.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
        {/* Keyboard shortcuts - not translatable text */}
        {/* eslint-disable i18next/no-literal-string */}
        <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-gray-500 mt-2">
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-gray-100 px-1">↑</kbd>
            <kbd className="rounded border bg-gray-100 px-1">↓</kbd>
            <span>{t("navigate")}</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-gray-100 px-1">⇧</kbd>
            <kbd className="rounded border bg-gray-100 px-1">↵</kbd>
            <span>{t("keep_open")}</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="rounded border bg-gray-100 px-1">↵</kbd>
            <span>{t("insert")}</span>
          </div>
        </div>
        {/* eslint-enable i18next/no-literal-string */}
      </PopoverContent>
    </Popover>
  );
}
