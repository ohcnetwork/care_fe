import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";

interface NotesInputProps {
  questionnaireResponse: QuestionnaireResponse;
  handleUpdateNote: (note: string) => void;
  disabled?: boolean;
  className?: string;
}

export function NotesInput({
  questionnaireResponse,
  handleUpdateNote,
  disabled,
  className,
}: NotesInputProps) {
  const [open, setOpen] = useState(false);
  const notes = questionnaireResponse.note || "";
  const hasNotes = notes.length > 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      // Use a small delay to ensure the textarea is fully rendered and ready
      const timeoutId = setTimeout(() => {
        if (textareaRef.current) {
          const length = textareaRef.current.value.length || 0;
          textareaRef.current.setSelectionRange(length, length);
          textareaRef.current.focus();
        }
      }, 50); // Using a 50ms delay as a balance

      // Clean up the timeout if the popover closes before the timeout fires
      return () => clearTimeout(timeoutId);
    }
  }, [open]);

  return (
    <div className={cn("space-y-2 rounded-md flex items-center", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-full w-28 text-sm font-normal text-gray-700 hover:text-gray-900"
            disabled={disabled}
            data-cy="notes"
          >
            {hasNotes ? (
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 " />
            ) : (
              <span className=" text-base">+</span>
            )}
            {hasNotes ? "View Note" : "Add Note"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="bg-yellow-100 border border-yellow-200 text-gray-900 shadow-lg p-2">
          <Textarea
            value={notes}
            onChange={(e) => handleUpdateNote(e.target.value)}
            className=" border-yellow-200 focus-visible:border-yellow-300 focus-visible:ring-yellow-300"
            placeholder="Add notes..."
            disabled={disabled}
            data-cy="notes-textarea"
            ref={textareaRef}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
