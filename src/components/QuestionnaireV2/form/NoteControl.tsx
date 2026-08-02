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

/** Per-question note popover — the reference design's affordance: a slim
 *  vertical rule and a free-standing icon button beside the input, never a
 *  shared frame (that read as a second border around the control). */
export function NoteControl({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const { mode } = useFormRenderer();
  const noteStateId = useId();
  const [response, updateResponse] = useQuestionResponse(questionId);

  if (!response) return null;
  if (mode === "readonly" && !response.note) return null;

  // The amber dot is decorative — the sr-only sibling carries the "a note
  // exists" state, referenced via aria-describedby so the button's name
  // stays "Add note" (a spec contract).
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
            aria-label={mode === "readonly" ? t("note") : t("add_note")}
            aria-describedby={response.note ? noteStateId : undefined}
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
          readOnly={mode === "readonly"}
          placeholder={t("add_note")}
          onChange={(e) => updateResponse({ note: e.target.value })}
        />
      </PopoverContent>
    </Popover>
  );
}
