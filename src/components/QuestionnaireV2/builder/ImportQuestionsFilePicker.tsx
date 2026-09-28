import { Upload } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

import useDragAndDrop from "@/hooks/useDragAndDrop";
import { cn } from "@/lib/utils";

interface ImportQuestionsFilePickerProps {
  error: string;
  onFile: (file: File) => void;
}

export function ImportQuestionsFilePicker({
  error,
  onFile,
}: ImportQuestionsFilePickerProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { dragOver, onDragOver, onDragLeave } = useDragAndDrop();
  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragOver
            ? "border-primary bg-primary/10"
            : "border-gray-200 hover:border-gray-300",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={(event) => {
          event.preventDefault();
          onDragLeave();
          const file = event.dataTransfer.files[0];
          if (file) onFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        <div className="flex flex-col items-center gap-2">
          <Upload className="size-10 text-gray-400" />
          <p className="text-sm text-gray-500 select-none">
            {dragOver
              ? t("drop_file_here")
              : t("drag_and_drop_or_click_to_select")}
          </p>
          <p className="text-xs text-gray-400 select-none">
            {t("json_files_only")}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) onFile(file);
          }}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
