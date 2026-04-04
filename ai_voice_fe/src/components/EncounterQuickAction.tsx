import { Mic } from "lucide-react";

interface EncounterQuickActionProps {
  encounter: { id: string };
  className?: string;
}

export default function EncounterQuickAction({
  className,
}: EncounterQuickActionProps) {
  return (
    <div className={className} title="AI Voice Transcription available in encounter tabs">
      <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
        <Mic className="w-3 h-3" />
        <span>AI Voice</span>
      </div>
    </div>
  );
}
