import {
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { SelectOrCreateValueset } from "@/components/Questionnaire/SelectOrCreateValueset";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";
import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import { AnswerOption, Question } from "@/types/questionnaire/question";

interface AnswerOptionsEditorProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

type Mode = "custom" | "valueset";

export function AnswerOptionsEditor({
  question,
  onChange,
}: AnswerOptionsEditorProps) {
  const { t } = useTranslation();
  // The valueset tab can be open before a valueset has actually been picked —
  // that transient UI state lives here (keyed by question id, since this
  // component instance is shared across selected questions) instead of
  // seeding an empty `answer_value_set: {}` on the question, which would
  // persist on save and break the picker in both renderers.
  const [modeOverride, setModeOverride] = useState<{
    questionId: string;
    mode: Mode;
  } | null>(null);

  if (question.type !== "choice" && question.type !== "quantity") {
    return null;
  }

  const derivedMode: Mode = question.answer_value_set ? "valueset" : "custom";
  const mode: Mode =
    modeOverride?.questionId === question.id ? modeOverride.mode : derivedMode;
  const options = question.answer_option ?? [];

  const handleModeChange = (next: Mode) => {
    if (next === mode) return;
    setModeOverride({ questionId: question.id, mode: next });
    if (next === "custom") {
      onChange({
        answer_value_set: undefined,
        answer_option: question.answer_option ?? [],
      });
    } else {
      // Keep answer_value_set undefined until SelectOrCreateValueset returns
      // a real valueset (see onValueSetChange below).
      onChange({ answer_option: undefined });
    }
  };

  const updateOptions = (next: AnswerOption[]) => {
    onChange({ answer_option: next, answer_value_set: undefined });
  };

  const handleOptionChange = (index: number, patch: Partial<AnswerOption>) => {
    updateOptions(
      options.map((option, i) =>
        i === index ? { ...option, ...patch } : option,
      ),
    );
  };

  const handleSetDefault = (index: number) => {
    updateOptions(
      options.map((option, i) => ({
        ...option,
        initial_selected: i === index,
      })),
    );
  };

  const handleClearDefault = () => {
    updateOptions(
      options.map((option) => ({ ...option, initial_selected: false })),
    );
  };

  const handleDeleteOption = (index: number) => {
    updateOptions(options.filter((_, i) => i !== index));
  };

  const handleMoveOption = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= options.length) return;
    const next = [...options];
    [next[index], next[target]] = [next[target], next[index]];
    updateOptions(next);
  };

  const handleAddOption = () => {
    updateOptions([...options, { value: "" }]);
  };

  return (
    <div className="space-y-3 rounded-lg bg-gray-50 p-4">
      <div>
        <h4 className="text-sm font-semibold text-gray-900">
          {t("answer_options")}
        </h4>
        <p className="text-sm text-gray-500">{t("answer_options_hint")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ChoiceChip
          control="radio"
          label={t("custom_options")}
          checked={mode === "custom"}
          onCheckedChange={() => handleModeChange("custom")}
        />
        <ChoiceChip
          control="radio"
          label={t("value_set")}
          checked={mode === "valueset"}
          onCheckedChange={() => handleModeChange("valueset")}
        />
      </div>

      {mode === "custom" ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h5 className="text-sm font-medium text-gray-900">
              {t("set_custom_options")}
            </h5>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!options.some((option) => option.initial_selected)}
              onClick={handleClearDefault}
            >
              <X className="size-4" />
              {t("clear_default")}
            </Button>
          </div>
          <div className="overflow-hidden rounded-md border border-gray-200 bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>{t("option_value")}</TableHead>
                  <TableHead>{t("display_text_optional")}</TableHead>
                  <TableHead className="w-32">{t("default")}</TableHead>
                  <TableHead className="w-24">{t("action")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {options.map((option, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-sm text-gray-500">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={option.value}
                        placeholder={t("option_value")}
                        onChange={(e) =>
                          handleOptionChange(index, { value: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={option.display ?? ""}
                        placeholder={t("display_text_optional")}
                        onChange={(e) =>
                          handleOptionChange(index, { display: e.target.value })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={!!option.initial_selected}
                          aria-label={t("default")}
                          onClick={() => handleSetDefault(index)}
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center rounded-full border",
                            option.initial_selected
                              ? "border-primary-700"
                              : "border-gray-300",
                          )}
                        >
                          {option.initial_selected && (
                            <span className="size-2 rounded-full bg-primary-700" />
                          )}
                        </button>
                        {option.initial_selected
                          ? t("default")
                          : t("set_as_default")}
                      </label>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          disabled={index === 0}
                          onClick={() => handleMoveOption(index, -1)}
                          aria-label={t("move_up")}
                        >
                          <ChevronUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-6"
                          disabled={index === options.length - 1}
                          onClick={() => handleMoveOption(index, 1)}
                          aria-label={t("move_down")}
                        >
                          <ChevronDown className="size-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-6"
                              aria-label={t("more_options")}
                            >
                              <MoreVertical className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => handleDeleteOption(index)}
                            >
                              <Trash2 className="size-4" />
                              {t("delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddOption}
          >
            <Plus className="size-4" />
            {t("add_option")}
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label>{t("select_a_value_set")}</Label>
          <SelectOrCreateValueset
            value={question.answer_value_set}
            onValueSetChange={(vs) =>
              onChange({ answer_value_set: vs, answer_option: undefined })
            }
          />
        </div>
      )}

      {question.type === "quantity" && (
        <div className="space-y-1.5">
          <Label>{t("unit")}</Label>
          <ValueSetSelect
            system="system-ucum-units"
            value={question.unit}
            onSelect={(code) => onChange({ unit: code })}
          />
        </div>
      )}
    </div>
  );
}
