import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";

interface NotesInputProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (response: QuestionnaireResponse) => void;
  disabled?: boolean;
}

export function NotesInput({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
}: NotesInputProps) {
  const [showNotes, setShowNotes] = useState(false);
  const notes = questionnaireResponse.note || "";
  const hasNotes = notes.length > 0;

  return (
    <div className="space-y-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          setShowNotes(!showNotes);
        }}
        className={`h-6 px-2 ${
          hasNotes ? "text-blue-500" : "text-gray-500"
        } hover:bg-gray-100`}
        disabled={disabled}
      >
        <CareIcon icon="l-notes" className="mr-2 h-4 w-4" />
        {showNotes ? "Hide Notes" : hasNotes ? "Show Notes" : "Add Notes"}
      </Button>
      {showNotes && (
        <Textarea
          value={notes}
          onChange={(e) =>
            updateQuestionnaireResponseCB({
              ...questionnaireResponse,
              note: e.target.value,
            })
          }
          placeholder="Add notes..."
          className="min-h-[100px]"
          disabled={disabled}
        />
      )}
    </div>
  );
}
