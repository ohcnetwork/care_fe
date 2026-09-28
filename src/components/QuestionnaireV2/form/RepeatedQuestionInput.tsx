import { Plus, X } from "lucide-react";
import { useState, type ComponentType } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { NoteControl } from "./NoteControl";
import { emptyEntry } from "./engine/inputs/withEntryAt";
import type { RendererInputProps } from "./engine/questionTypeRegistry";
import { EMPTY_ROW_KEYS, dropRowKey, growRowKeys } from "./engine/rowKeys";
import { useQuestionResponse } from "./engine/store";

interface RepeatedQuestionInputProps extends RendererInputProps {
  locked: boolean;
  component: ComponentType<RendererInputProps>;
}

/** Own positional entries and stable row keys only for questions using repeats. */
export function RepeatedQuestionInput({
  question,
  disabled,
  locked,
  inputId,
  labelId,
  errorId,
  component: InputComponent,
}: RepeatedQuestionInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  const entryCount = Math.max(response?.values.length ?? 0, 1);
  const canRemoveEntries = (response?.values.length ?? 0) > 1;

  // Rows added by editing or draft restoration claim keys at render time.
  // Removing one carries every surviving row's local control state with it.
  const [rowKeys, setRowKeys] = useState(EMPTY_ROW_KEYS);
  const visibleRowKeys = growRowKeys(rowKeys, entryCount);
  if (visibleRowKeys !== rowKeys) setRowKeys(visibleRowKeys);

  const handleAddEntry = () => {
    const current = response?.values ?? [];
    // Materialize the placeholder too so Add never swallows the visible row.
    const next = current.length === 0 ? [emptyEntry()] : [...current];
    next.push(emptyEntry());
    updateResponse({ values: next });
  };
  const handleRemoveEntry = (index: number) => {
    setRowKeys((current) => dropRowKey(current, entryCount, index));
    updateResponse({
      values: (response?.values ?? []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-2">
      {Array.from({ length: entryCount }, (_, index) => (
        <div
          key={visibleRowKeys.keys[index]}
          className="flex items-center gap-2"
        >
          <div className="min-w-0 flex-1">
            <InputComponent
              question={question}
              disabled={disabled}
              inputId={index === 0 ? inputId : `${inputId}-${index}`}
              labelId={labelId}
              errorId={errorId}
              valueIndex={index}
            />
          </div>
          {canRemoveEntries && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              disabled={disabled}
              onClick={() => handleRemoveEntry(index)}
              aria-label={t("remove")}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={handleAddEntry}
        >
          <Plus className="size-4" />
          {t("add_another")}
        </Button>
        <NoteControl questionId={question.id} locked={locked} />
      </div>
    </div>
  );
}
