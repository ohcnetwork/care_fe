import { ChevronDown, X } from "lucide-react";
import type * as React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { Code } from "@/types/questionnaire/code";

interface InstructionsPopoverProps {
  currentInstructions: Code[];
  removeInstruction: (code: string) => void;
  addInstruction: (instruction: Code) => void;
  isReadOnly?: boolean;
  disabled?: boolean;
}

export default function InstructionsPopover({
  currentInstructions,
  removeInstruction,
  addInstruction,
  isReadOnly = false,
  disabled = false,
}: InstructionsPopoverProps) {
  const { t } = useTranslation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-cy="instructions"
          className="w-full justify-between"
          disabled={(isReadOnly || disabled) && currentInstructions.length <= 1}
        >
          <span className="truncate block max-w-full">
            {currentInstructions.length === 0
              ? t("no_instructions_selected")
              : currentInstructions
                  .map((i) => i.display)
                  .filter(Boolean)
                  .join(", ")}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-4"
        align="start"
      >
        <div className="space-y-4">
          {currentInstructions.length > 0 && (
            <ScrollArea className="max-h-60">
              <div className="flex flex-wrap gap-2 mb-2">
                {currentInstructions.map((instruction) => (
                  <Badge
                    key={instruction.code}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {instruction.display}
                    {!isReadOnly && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-4 p-0 rounded-full"
                        onClick={() => removeInstruction(instruction.code)}
                        disabled={disabled}
                      >
                        <X className="size-3" />
                        <span className="sr-only">{t("remove")}</span>
                      </Button>
                    )}
                  </Badge>
                ))}
              </div>
            </ScrollArea>
          )}

          {!isReadOnly && (
            <div data-cy="medication-instructions-dropdown">
              <ValueSetSelect
                system="system-additional-instruction"
                value={null}
                onSelect={(instruction: Code) => {
                  if (instruction) {
                    addInstruction(instruction);
                  }
                }}
                placeholder={
                  currentInstructions.length > 0
                    ? t("add_more_instructions")
                    : t("select_additional_instructions")
                }
                disabled={disabled || isReadOnly}
                data-cy="medication-instructions"
                wrapTextForSmallScreen
              />
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
