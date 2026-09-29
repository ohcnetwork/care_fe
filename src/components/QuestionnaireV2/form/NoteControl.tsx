import { NotebookPen } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { useFormRenderer } from "./FormContext";

/** Per-question note popover beside the input. */
export function NoteControl({
  questionId,
  locked = false,
}: {
  questionId: string;
  /** The question's persistent lock (`read_only` or enable_when-disabled),
   *  not the transient submit freeze. */
  locked?: boolean;
}) {
  const { t } = useTranslation();
  const { mode, frozen } = useFormRenderer();
  const noteStateId = useId();
  const [response, updateResponse] = useQuestionResponse(questionId);

  const viewOnly = mode === "readonly" || locked;

  if (!response) return null;
  if (viewOnly && !response.note) return null;

  const noteIndicator = response.note && (
    <>
      <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-amber-500" />
      <span id={noteStateId} className="sr-only">
        {t("note_added")}
      </span>
    </>
  );

  return (
    <Popover>
      <div className="ml-auto flex shrink-0 items-center gap-1.5 self-center pl-1.5">
        <span aria-hidden className="h-6 w-px bg-gray-200" />
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={viewOnly ? t("note") : t("add_note")}
            aria-describedby={response.note ? noteStateId : undefined}
            disabled={frozen}
            className="relative flex size-9 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <NotebookPen className="size-4" />
            {noteIndicator}
          </button>
        </PopoverTrigger>
      </div>
      <PopoverContent align="end" className="w-72">
        <Textarea
          value={response.note ?? ""}
          readOnly={viewOnly}
          disabled={frozen}
          placeholder={t("add_note")}
          onChange={(e) => updateResponse({ note: e.target.value })}
        />
      </PopoverContent>
    </Popover>
  );
}
