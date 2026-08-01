import { NotebookPen } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { useFormRenderer } from "./FormContext";

/** Per-question note popover — same variants and semantics as the old
 *  renderer's NoteAffordance, re-hosted on the form context. */
export function NoteControl({
  questionId,
  variant = "merged",
}: {
  questionId: string;
  /**
   * "merged": shares the input's bordered frame, separated by a full-height
   * left rule. "standalone" (chip rows): free-standing rounded button pushed
   * to the far right behind a short vertical rule.
   */
  variant?: "merged" | "standalone";
}) {
  const { t } = useTranslation();
  const { mode } = useFormRenderer();
  const [response, updateResponse] = useQuestionResponse(questionId);

  if (!response) return null;
  if (mode === "readonly" && !response.note) return null;

  const noteDot = response.note && (
    <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-amber-500" />
  );

  return (
    <Popover>
      {variant === "standalone" ? (
        <div className="ml-auto flex shrink-0 items-center gap-2 self-center">
          <span aria-hidden className="h-6 w-px bg-gray-200" />
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("add_note")}
              className="relative flex size-10 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <NotebookPen className="size-4" />
              {noteDot}
            </button>
          </PopoverTrigger>
        </div>
      ) : (
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={t("add_note")}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center border-l border-gray-200 text-gray-400 hover:text-gray-600"
          >
            <NotebookPen className="size-4" />
            {noteDot}
          </button>
        </PopoverTrigger>
      )}
      <PopoverContent align="end" className="w-72">
        <Textarea
          value={response.note ?? ""}
          readOnly={mode === "readonly"}
          placeholder={t("add_note")}
          onChange={(e) => updateResponse({ note: e.target.value })}
        />
      </PopoverContent>
    </Popover>
  );
}
