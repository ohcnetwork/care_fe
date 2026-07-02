import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  ANNOTATION_TYPES,
  BodyAnnotation,
  annotationColor,
} from "@/components/BodySite/bodyAnnotation";

interface Props {
  annotations: BodyAnnotation[];
  onFocus?: (annotation: BodyAnnotation) => void;
  onDelete?: (id: string) => void;
  onClear?: () => void;
  className?: string;
}

const SEVERITY_LABEL: Record<
  NonNullable<BodyAnnotation["severity"]>,
  string
> = {
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
};

export default function AnnotationList({
  annotations,
  onFocus,
  onDelete,
  onClear,
  className,
}: Props) {
  const { t } = useTranslation();

  if (annotations.length === 0) {
    return (
      <div
        className={cn(
          "rounded-md border border-dashed border-gray-300 bg-white p-4 text-center text-xs text-gray-500",
          className,
        )}
      >
        {t("body_site_annotation_list_empty")}
      </div>
    );
  }

  // Group by view (front / back) for clarity
  const grouped = annotations.reduce<Record<string, BodyAnnotation[]>>(
    (acc, anno) => {
      (acc[anno.view] = acc[anno.view] ?? []).push(anno);
      return acc;
    },
    {},
  );

  const typeLabel = (anno: BodyAnnotation) =>
    ANNOTATION_TYPES.find((m) => m.type === anno.type)?.labelKey ?? anno.type;

  return (
    <div
      className={cn("rounded-md border border-gray-200 bg-white", className)}
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
        <span className="text-xs font-medium text-gray-700">
          {t("body_site_annotation_list_title", { count: annotations.length })}
        </span>
        {onClear && annotations.length > 0 && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={onClear}
          >
            {t("clear_all")}
          </Button>
        )}
      </div>

      <div className="max-h-64 overflow-auto">
        {Object.entries(grouped).map(([view, items]) => (
          <div key={view}>
            <div className="px-3 py-1 text-[10px] uppercase tracking-wide text-gray-400 bg-gray-50">
              {t(`body_site_view_${view}`)}
            </div>
            {items.map((anno) => (
              <div
                key={anno.id}
                className="flex items-start gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 hover:bg-gray-50"
              >
                <button
                  type="button"
                  onClick={() => onFocus?.(anno)}
                  className="flex flex-1 items-start gap-2 text-left"
                >
                  <span
                    className="mt-1 inline-block size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: annotationColor(anno.type) }}
                    aria-hidden
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-900">
                        {t(typeLabel(anno))}
                      </span>
                      {anno.severity && (
                        <span className="rounded-full bg-sky-100 text-sky-700 px-1.5 py-0.5 text-[10px] font-medium">
                          {t("body_site_annotation_severity")}{" "}
                          {SEVERITY_LABEL[anno.severity]}
                        </span>
                      )}
                    </div>
                    {anno.label && (
                      <div className="text-xs text-gray-600 truncate">
                        {anno.label}
                      </div>
                    )}
                    {anno.associatedRegion && (
                      <div className="text-[11px] text-gray-400 truncate">
                        {anno.associatedRegion.code.display}
                      </div>
                    )}
                  </div>
                </button>
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(anno.id)}
                    aria-label={t("delete")}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
