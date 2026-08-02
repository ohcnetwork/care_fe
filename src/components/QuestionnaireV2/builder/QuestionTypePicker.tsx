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
import { structuredDefinitionFor } from "@/components/QuestionnaireV2/structured/registry";

import {
  Question,
  QuestionType,
  SUPPORTED_QUESTION_TYPES,
} from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";

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
  /** The questionnaire being edited's subject type — gates which structured
   *  tiles appear (a device/location questionnaire can't offer a patient-
   *  bound type like Allergies). */
  subjectType: SubjectType;
  onChange: (patch: Partial<Question>) => void;
}

export function QuestionTypePicker({
  value,
  structuredType,
  subjectType,
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
  // Only structured types declared for this questionnaire's subject_type —
  // an out-of-subject type shows nowhere in the picker, not as a disabled
  // tile (it can never be authored onto this questionnaire).
  const availableStructuredQuestions = STRUCTURED_QUESTIONS.filter((entry) =>
    structuredDefinitionFor(entry.value).subjects.includes(subjectType),
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
    // The Structured row names the ACTIVE structured type — without it the
    // only way to see which one is selected is drilling into the sub-list.
    const activeStructured =
      type === "structured" && value === "structured" && structuredType
        ? t(`structured_type__${structuredType}`)
        : undefined;
    return (
      <CommandItem
        key={type}
        value={type}
        // Let the search box match what the user actually sees (the
        // translated label and, for Structured, its active sub-type), not
        // just the internal type token.
        keywords={[t(`question_type__${type}`), activeStructured ?? ""]}
        onSelect={() => handleSelectType(type)}
        className="items-start gap-3 py-2"
      >
        <TypeIconTile type={type} />
        <span className="flex min-w-0 flex-col">
          <span className="font-bold text-gray-900">
            {t(`question_type__${type}`)}
          </span>
          <span
            className={cn(
              "truncate text-xs italic text-gray-500",
              activeStructured && "not-italic font-medium text-indigo-700",
            )}
          >
            {activeStructured ?? t(entry.description)}
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
          className="h-auto w-full justify-between gap-2 px-2 py-1.5 font-normal"
        >
          <span className="flex min-w-0 items-center gap-2.5 text-left">
            <TypeIconTile type={value} />
            <span className="flex min-w-0 flex-col">
              <span className="truncate text-sm font-semibold text-gray-900">
                {value === "structured" && structuredType
                  ? t(`structured_type__${structuredType}`)
                  : t(`question_type__${value}`)}
              </span>
              {/* The reference trigger carries the type's hint line so the
                  picker reads as a described choice, not a bare value. */}
              <span className="truncate text-xs text-gray-500">
                {value === "structured" && structuredType
                  ? t("question_type__structured")
                  : t(
                      SUPPORTED_QUESTION_TYPES.find(
                        (entry) => entry.value === value,
                      )?.description ?? "",
                    )}
              </span>
            </span>
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
                {availableStructuredQuestions.map((entry) => (
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
