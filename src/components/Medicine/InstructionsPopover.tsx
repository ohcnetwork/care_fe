import { ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import { Code } from "@/types/base/code/code";

interface InstructionsPopoverProps {
  currentInstructions: Code[];
  removeInstruction: (code: string) => void;
  addInstruction: (instruction: Code) => void;
  isReadOnly?: boolean;
  disabled?: boolean;
}

interface InstructionContentSectionProps {
  currentInstructions: Code[];
  isReadOnly: boolean;
  disabled: boolean;
  removeInstruction: (code: string) => void;
  addInstruction: (instruction: Code) => void;
}

function InstructionContentSection({
  currentInstructions,
  isReadOnly,
  disabled,
  removeInstruction,
  addInstruction,
}: InstructionContentSectionProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {currentInstructions.length > 0 && (
        <div className="max-h-32 overflow-y-auto p-1">
          <div className="flex flex-wrap gap-2 mb-1">
            {currentInstructions.map((instruction) => (
              <Badge
                key={instruction.code}
                variant="secondary"
                className="flex items-center gap-1 break-words"
              >
                <span className="whitespace-normal">{instruction.display}</span>
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
        </div>
      )}

      {!isReadOnly && (
        <div data-cy="medication-instructions-dropdown">
          <ValueSetSelect
            system="system-additional-instruction"
            value={null}
            hideTrigger={true}
            controlledOpen={true}
            onSelect={(instruction: Code) => {
              if (instruction) addInstruction(instruction);
            }}
            placeholder={
              currentInstructions.length > 0
                ? t("add_more_instructions")
                : t("select_additional_instructions")
            }
            disabled={disabled || isReadOnly}
            data-cy="medication-instructions"
          />
        </div>
      )}
    </div>
  );
}

const TriggerButton = (
  currentInstructions: Code[],
  disabledButton: boolean,
) => {
  const { t } = useTranslation();
  return (
    <Button
      variant="outline"
      data-cy="instructions"
      className="w-full justify-between"
      disabled={disabledButton}
    >
      <span className="truncate block max-w-full">
        {currentInstructions.length === 0
          ? t("no_instructions_selected")
          : currentInstructions
              .map((i) => i.display)
              .filter(Boolean)
              .join(", ")}
      </span>
      <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
    </Button>
  );
};

export default function InstructionsPopover({
  currentInstructions,
  removeInstruction,
  addInstruction,
  isReadOnly = false,
  disabled = false,
}: InstructionsPopoverProps) {
  const { t } = useTranslation();
  const isMobile = useBreakpoints({ default: true, sm: false });
  const disabledButton =
    (isReadOnly || disabled) && currentInstructions.length <= 1;

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          {TriggerButton(currentInstructions, disabledButton)}
        </SheetTrigger>
        <SheetContent side="bottom" className="p-4">
          <SheetHeader className="mb-2">
            {t("additional_instructions")}
          </SheetHeader>
          <InstructionContentSection
            currentInstructions={currentInstructions}
            isReadOnly={isReadOnly}
            disabled={disabled}
            removeInstruction={removeInstruction}
            addInstruction={addInstruction}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        {TriggerButton(currentInstructions, disabledButton)}
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-xl p-0">
        <InstructionContentSection
          currentInstructions={currentInstructions}
          isReadOnly={isReadOnly}
          disabled={disabled}
          removeInstruction={removeInstruction}
          addInstruction={addInstruction}
        />
      </PopoverContent>
    </Popover>
  );
}
