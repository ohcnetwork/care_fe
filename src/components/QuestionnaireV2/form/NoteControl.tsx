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
export function NoteControl({
  questionId,
  locked = false,
}: {
  questionId: string;
  /** The owning question's PERSISTENT lock: `read_only`, or
   *  enable_when-disabled while `disabled_display: protected`. A question
   *  whose input is inert must not accept a note either. Deliberately not
   *  the input's whole disabled state — the submit freeze belongs to
   *  `frozen` below, and folding it in here would unmount the affordance
   *  for the length of a request. */
  locked?: boolean;
}) {
  const { t } = useTranslation();
  const { mode, frozen } = useFormRenderer();
  const noteStateId = useId();
  const [response, updateResponse] = useQuestionResponse(questionId);

  // Readonly mode and a locked question read the same way: an existing note
  // stays visible, a new one can never be recorded — so with nothing to
  // show there is no affordance at all. The submit freeze is deliberately
  // NOT part of this: it is transient, and a control that disappears for the
  // length of an in-flight submit takes an already-written note off screen
  // with it. Frozen only disables (below).
  const viewOnly = mode === "readonly" || locked;

  if (!response) return null;
  if (viewOnly && !response.note) return null;

  // The amber dot is decorative; the sr-only sibling carries the "a note
  // exists" state through aria-describedby without changing the button name.
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
