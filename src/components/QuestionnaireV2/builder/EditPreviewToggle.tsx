import { Eye, LucideIcon, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

interface EditPreviewToggleProps {
  view: "edit" | "preview";
  onChange: (view: "edit" | "preview") => void;
}

/** Pill toggle between the builder's edit and preview views. */
export function EditPreviewToggle({ view, onChange }: EditPreviewToggleProps) {
  const { t } = useTranslation();

  const pill = (value: "edit" | "preview", label: string, Icon: LucideIcon) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        view === value
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
      {pill("edit", t("edit"), SquarePen)}
      {pill("preview", t("preview"), Eye)}
    </div>
  );
}
