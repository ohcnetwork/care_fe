import { Eye, LucideIcon, SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface EditPreviewToggleProps {
  view: "edit" | "preview";
  onChange: (view: "edit" | "preview") => void;
}

/** Pill toggle between the builder's edit and preview views. */
export function EditPreviewToggle({ view, onChange }: EditPreviewToggleProps) {
  const { t } = useTranslation();

  const pill = (value: "edit" | "preview", label: string, Icon: LucideIcon) => (
    <ToggleGroupItem
      value={value}
      className="cursor-pointer gap-1.5 rounded-full px-3 py-1.5 text-muted-foreground transition-colors aria-pressed:bg-background data-pressed:bg-background aria-pressed:text-foreground aria-pressed:shadow-sm"
    >
      <Icon className="size-4" />
      {label}
    </ToggleGroupItem>
  );

  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(values) => {
        const nextView = values[0];
        if (nextView === "edit" || nextView === "preview") onChange(nextView);
      }}
      multiple={false}
      aria-label={t("view")}
      size="sm"
      spacing={1}
      className="rounded-full bg-muted p-1"
    >
      {pill("edit", t("edit"), SquarePen)}
      {pill("preview", t("preview"), Eye)}
    </ToggleGroup>
  );
}
