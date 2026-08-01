import { Check, ChevronDown, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

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

import {
  STRUCTURED_QUESTIONS,
  StructuredQuestionType,
} from "@/components/Questionnaire/data/StructuredFormData";
import { QUESTION_TYPE_ICONS } from "@/components/QuestionnaireV2/shared/questionTypeIcons";

import {
  Question,
  QuestionType,
  SUPPORTED_QUESTION_TYPES,
} from "@/types/questionnaire/question";

const FREQUENTLY_USED: QuestionType[] = [
  "group",
  "display",
  "date",
  "structured",
];

function TypeIconTile({ type }: { type: QuestionType }) {
  const { icon: Icon, tint } = QUESTION_TYPE_ICONS[type];
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-md",
        tint,
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}

interface QuestionTypePickerProps {
  value: QuestionType;
  structuredType?: StructuredQuestionType;
  onChange: (patch: Partial<Question>) => void;
}

export function QuestionTypePicker({
  value,
  structuredType,
  onChange,
}: QuestionTypePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"list" | "structured">("list");

  const frequentlyUsed = SUPPORTED_QUESTION_TYPES.filter((entry) =>
    FREQUENTLY_USED.includes(entry.value),
  );
  const otherTypes = SUPPORTED_QUESTION_TYPES.filter(
    (entry) => !FREQUENTLY_USED.includes(entry.value),
  );

  const handleSelectType = (type: QuestionType) => {
    if (type === "structured") {
      setStep("structured");
      return;
    }
    onChange({ type });
    setOpen(false);
  };

  const handleSelectStructured = (
    nextStructuredType: StructuredQuestionType,
  ) => {
    onChange({ type: "structured", structured_type: nextStructuredType });
    setOpen(false);
    setStep("list");
  };

  const renderTypeRow = (entry: (typeof SUPPORTED_QUESTION_TYPES)[number]) => {
    const type = entry.value;
    return (
      <CommandItem
        key={type}
        value={type}
        // Let the search box match what the user actually sees (the
        // translated label), not just the internal type token.
        keywords={[t(`question_type__${type}`)]}
        onSelect={() => handleSelectType(type)}
        className="items-start gap-3 py-2"
      >
        <TypeIconTile type={type} />
        <span className="flex min-w-0 flex-col">
          <span className="font-bold text-gray-900">
            {t(`question_type__${type}`)}
          </span>
          <span className="truncate text-xs italic text-gray-500">
            {t(entry.description)}
          </span>
        </span>
        {value === type && <Check className="ml-auto size-4 shrink-0" />}
      </CommandItem>
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setStep("list");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          // Named for a11y — the editor card shows no visible label for the
          // picker (the control is self-describing), so without this the
          // combobox would be named by its current value alone.
          aria-label={t("question_type")}
          className="w-full justify-between gap-2 px-2 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <TypeIconTile type={value} />
            <span className="truncate">{t(`question_type__${value}`)}</span>
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) min-w-80 p-0"
        align="start"
      >
        {step === "list" ? (
          <Command>
            <CommandInput placeholder={t("search")} />
            <CommandList className="max-h-[60vh]">
              <CommandEmpty>{t("no_results_found")}</CommandEmpty>
              <CommandGroup heading={t("frequently_used")}>
                {frequentlyUsed.map(renderTypeRow)}
              </CommandGroup>
              <CommandGroup heading={t("other_question_types")}>
                {otherTypes.map(renderTypeRow)}
              </CommandGroup>
            </CommandList>
          </Command>
        ) : (
          <Command>
            <div className="flex items-center gap-2 border-b border-gray-100 p-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6"
                onClick={() => setStep("list")}
                aria-label={t("back")}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="text-sm font-semibold text-gray-900">
                {t("question_type__structured")}
              </span>
            </div>
            <CommandList className="max-h-[60vh]">
              <CommandEmpty>{t("no_results_found")}</CommandEmpty>
              <CommandGroup>
                {STRUCTURED_QUESTIONS.map((entry) => (
                  <CommandItem
                    key={entry.value}
                    value={entry.value}
                    keywords={[t(`structured_type__${entry.value}`)]}
                    onSelect={() => handleSelectStructured(entry.value)}
                  >
                    {t(`structured_type__${entry.value}`)}
                    {value === "structured" &&
                      structuredType === entry.value && (
                        <Check className="ml-auto size-4 shrink-0" />
                      )}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  );
}
