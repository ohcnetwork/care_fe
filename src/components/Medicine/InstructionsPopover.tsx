import { ChevronDown, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  fillHeight?: boolean;
}

function InstructionContentSection({
  currentInstructions,
  isReadOnly,
  disabled,
  removeInstruction,
  addInstruction,
  fillHeight = false,
}: InstructionContentSectionProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "space-y-3",
        fillHeight && "flex min-h-0 flex-1 flex-col space-y-0 gap-3",
      )}
    >
      {currentInstructions.length > 0 && (
        <div
          className={cn(
            "flex flex-nowrap overflow-x-auto p-2 sm:flex-wrap sm:max-h-32 sm:overflow-y-auto gap-2 mb-1",
            fillHeight && "shrink-0",
            isReadOnly && "h-auto overflow-y-auto flex-wrap overflow-x-hidden",
          )}
        >
          {currentInstructions.map((instruction) => (
            <Badge
              key={instruction.code}
              variant="secondary"
              className="flex items-center gap-1 break-words"
            >
              <span
                className={cn(
                  "whitespace-nowrap",
                  isReadOnly && "whitespace-normal",
                )}
              >
                {instruction.display}
              </span>
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
      )}

      {!isReadOnly && (
        <div className={cn(fillHeight && "flex min-h-0 flex-1 flex-col")}>
          <ValueSetSelect
            system="system-additional-instruction"
            value={null}
            hideTrigger={true}
            onSelect={(instruction: Code) => {
              if (instruction) addInstruction(instruction);
            }}
            placeholder={
              currentInstructions.length > 0
                ? t("add_more_instructions")
                : t("select_additional_instructions")
            }
            disabled={disabled || isReadOnly}
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
      variant="white"
      className={cn(
        "w-full justify-between border-gray-300 font-normal shadow-xs",
        currentInstructions.length === 0 && "text-gray-500 hover:bg-white",
      )}
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
      <Drawer>
        <DrawerTrigger asChild>
          {TriggerButton(currentInstructions, disabledButton)}
        </DrawerTrigger>
        <DrawerContent height="child" className="p-1.5">
          <DrawerHeader>
            <DrawerTitle className="sr-only">
              {t("additional_instructions")}
            </DrawerTitle>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)]">
            <InstructionContentSection
              currentInstructions={currentInstructions}
              isReadOnly={isReadOnly}
              disabled={disabled}
              removeInstruction={removeInstruction}
              addInstruction={addInstruction}
              fillHeight
            />
          </div>
        </DrawerContent>
      </Drawer>
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
