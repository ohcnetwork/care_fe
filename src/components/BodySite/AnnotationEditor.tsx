import { Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  ANNOTATION_TYPES,
  AnnotationType,
  BodyAnnotation,
  annotationColor,
} from "@/components/BodySite/bodyAnnotation";

interface Props {
  annotation: BodyAnnotation;
  /** Position in container-relative pixels where the editor should open */
  anchor: { x: number; y: number };
  containerWidth: number;
  containerHeight: number;
  onSave: (updated: BodyAnnotation) => void;
  onDelete: () => void;
  onClose: () => void;
}

const SEVERITY_LEVELS: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

export default function AnnotationEditor({
  annotation,
  anchor,
  containerWidth,
  containerHeight,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const [label, setLabel] = useState(annotation.label ?? "");
  const [severity, setSeverity] = useState<BodyAnnotation["severity"]>(
    annotation.severity,
  );
  const [type, setType] = useState<AnnotationType>(annotation.type);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep within container bounds
  const editorWidth = 280;
  const editorHeight = 220;
  const padding = 8;
  const left = Math.max(
    padding,
    Math.min(
      containerWidth - editorWidth - padding,
      anchor.x - editorWidth / 2,
    ),
  );
  const top = Math.max(
    padding,
    Math.min(containerHeight - editorHeight - padding, anchor.y - editorHeight),
  );

  const handleSave = () => {
    onSave({
      ...annotation,
      type,
      label: label.trim() || undefined,
      severity,
    });
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    } else if (
      event.key === "Enter" &&
      event.target instanceof HTMLInputElement
    ) {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <div
      role="dialog"
      aria-label={t("body_site_annotation_editor")}
      className="absolute z-30 rounded-lg border border-gray-200 bg-white shadow-xl"
      style={{
        left,
        top,
        width: editorWidth,
      }}
      onKeyDown={handleKeyDown}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <span
            className="inline-block size-3 rounded-full"
            style={{ backgroundColor: annotationColor(type) }}
            aria-hidden
          />
          {t("body_site_annotation_editor")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("close")}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="space-y-3 p-3">
        <div>
          <Label className="text-xs text-gray-600">
            {t("body_site_annotation_type")}
          </Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {ANNOTATION_TYPES.map((meta) => (
              <button
                key={meta.type}
                type="button"
                onClick={() => setType(meta.type)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium border",
                  type === meta.type
                    ? "text-white border-transparent"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
                )}
                style={
                  type === meta.type
                    ? { backgroundColor: meta.color }
                    : undefined
                }
              >
                {t(meta.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="anno-label" className="text-xs text-gray-600">
            {t("body_site_annotation_note")}
          </Label>
          <Input
            id="anno-label"
            ref={inputRef}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={t("body_site_annotation_note_placeholder")}
            className="mt-1 h-8 text-sm"
          />
        </div>

        <div>
          <Label className="text-xs text-gray-600">
            {t("body_site_annotation_severity")}
          </Label>
          <div className="mt-1 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSeverity(undefined)}
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                severity === undefined
                  ? "bg-gray-200 text-gray-900"
                  : "text-gray-600 hover:bg-gray-100",
              )}
            >
              {t("body_site_annotation_severity_none")}
            </button>
            {SEVERITY_LEVELS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSeverity(s)}
                aria-label={`severity ${s}`}
                className={cn(
                  "rounded-md w-7 h-7 text-xs font-medium",
                  severity === s
                    ? "bg-sky-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {annotation.associatedRegion && (
          <div className="text-xs text-gray-500">
            <span className="font-medium text-gray-700">
              {t("body_site_associated_region")}:
            </span>{" "}
            {annotation.associatedRegion.code.display}{" "}
            <span className="text-gray-400">
              ({annotation.associatedRegion.code.code})
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            onDelete();
            onClose();
          }}
        >
          <Trash2 className="size-3.5 mr-1" aria-hidden />
          {t("delete")}
        </Button>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={onClose}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={handleSave}
          >
            {t("save")}
          </Button>
        </div>
      </div>
    </div>
  );
}
