import { NotebookPen } from "lucide-react";
import { useTranslation } from "react-i18next";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import { useRenderer } from "@/components/QuestionnaireV2/renderer/RendererContext";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function NoteAffordance({ questionId }: { questionId: string }) {
  const { t } = useTranslation();
  const { mode } = useRenderer();
  const [response, updateResponse] = useQuestionResponse(questionId);

  if (!response) return null;
  if (mode === "readonly" && !response.note) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t("add_note")}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center border-l border-gray-200 text-gray-400 hover:text-gray-600"
        >
          <NotebookPen className="size-4" />
          {response.note && (
            <span className="absolute bottom-2 right-2 size-1.5 rounded-full bg-amber-500" />
          )}
        </button>
      </PopoverTrigger>
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
