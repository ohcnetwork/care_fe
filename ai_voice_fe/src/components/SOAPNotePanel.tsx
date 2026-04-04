import { useState } from "react";
import { Check, Edit3, Loader2, AlertTriangle, ClipboardCheck } from "lucide-react";
import type { SOAPNote } from "@/types";

interface SOAPNotePanelProps {
  note: SOAPNote | null;
  isGenerating: boolean;
  onUpdate: (id: string, data: Partial<SOAPNote>) => Promise<void>;
  onMarkReviewed: (id: string) => Promise<void>;
}

const SOAP_SECTIONS = [
  {
    key: "subjective" as const,
    label: "Subjective",
    color: "blue",
    description: "Patient's reported symptoms, history, and concerns",
  },
  {
    key: "objective" as const,
    label: "Objective",
    color: "green",
    description: "Clinical findings, vital signs, examination results",
  },
  {
    key: "assessment" as const,
    label: "Assessment",
    color: "amber",
    description: "Clinical assessment and differential diagnoses",
  },
  {
    key: "plan" as const,
    label: "Plan",
    color: "purple",
    description: "Treatment plan, medications, follow-up",
  },
];

type SoapField = "subjective" | "objective" | "assessment" | "plan";

export default function SOAPNotePanel({
  note,
  isGenerating,
  onUpdate,
  onMarkReviewed,
}: SOAPNotePanelProps) {
  const [editingField, setEditingField] = useState<SoapField | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-gray-600">Generating SOAP note from transcript...</p>
        <p className="text-xs text-gray-400">This may take a few seconds</p>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        <p>Complete a transcription session to generate SOAP notes</p>
      </div>
    );
  }

  if (note.status === "failed") {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2 text-red-500">
        <AlertTriangle className="w-8 h-8" />
        <p>Failed to generate SOAP note</p>
        <p className="text-xs text-gray-400">Please try again</p>
      </div>
    );
  }

  const startEdit = (field: SoapField) => {
    setEditingField(field);
    setEditValue(note[field]);
  };

  const saveEdit = async () => {
    if (!editingField || !note) return;
    setIsSaving(true);
    try {
      await onUpdate(note.id, { [editingField]: editValue });
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const colorMap: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50",
    green: "border-green-200 bg-green-50",
    amber: "border-amber-200 bg-amber-50",
    purple: "border-purple-200 bg-purple-50",
  };

  const labelColorMap: Record<string, string> = {
    blue: "text-blue-700 bg-blue-100",
    green: "text-green-700 bg-green-100",
    amber: "text-amber-700 bg-amber-100",
    purple: "text-purple-700 bg-purple-100",
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Disclaimer */}
      <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span>
          AI-generated content - Requires physician review before use in
          clinical documentation.
        </span>
      </div>

      {/* Summary */}
      {note.summary && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-600 mb-1">Summary</h4>
          <p className="text-gray-800">{note.summary}</p>
        </div>
      )}

      {/* SOAP Sections */}
      {SOAP_SECTIONS.map((section) => (
        <div
          key={section.key}
          className={`border rounded-lg overflow-hidden ${colorMap[section.color]}`}
        >
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded ${labelColorMap[section.color]}`}
              >
                {section.label[0]}
              </span>
              <h4 className="font-semibold text-gray-800">{section.label}</h4>
            </div>
            {note.status !== "reviewed" && editingField !== section.key && (
              <button
                onClick={() => startEdit(section.key)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title={`Edit ${section.label}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="px-3 pb-3">
            {editingField === section.key ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded text-sm bg-white min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-300"
                  rows={4}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={cancelEdit}
                    className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-200 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={isSaving}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                  >
                    {isSaving ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {note[section.key] || (
                  <span className="italic text-gray-400">
                    Not documented in this encounter.
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      ))}

      {/* Review Button */}
      {note.status === "completed" && (
        <button
          onClick={() => onMarkReviewed(note.id)}
          className="flex items-center justify-center gap-2 w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
        >
          <ClipboardCheck className="w-5 h-5" />
          Mark as Reviewed
        </button>
      )}

      {note.status === "reviewed" && (
        <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <Check className="w-5 h-5" />
          <span>
            Reviewed{note.reviewed_at ? ` on ${new Date(note.reviewed_at).toLocaleDateString()}` : ""}
          </span>
        </div>
      )}
    </div>
  );
}
