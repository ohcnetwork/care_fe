import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";

import { CORE_WIDGET_CATALOG } from "./workspaceEditorCatalog";

interface WorkspaceSampleContentProps {
  type: string;
  denied?: boolean;
  unavailable?: boolean;
  deniedMessage?: string;
}

/** Illustrative stand-ins only: no clinical components mount in the studio. */
export function WorkspaceSampleContent({
  type,
  denied = false,
  unavailable = false,
  deniedMessage,
}: WorkspaceSampleContentProps) {
  const { t } = useTranslation();
  const definition = CORE_WIDGET_CATALOG.find((item) => item.type === type);

  if (denied) {
    return <p className="text-sm text-soft-foreground">{deniedMessage}</p>;
  }
  if (unavailable) {
    return (
      <p className="text-sm text-soft-foreground">
        {t("encounter_workspace_widget_unavailable")}
      </p>
    );
  }
  if (definition?.group === "workflow") {
    return (
      <div className="grid grid-cols-1 gap-2 @sm:grid-cols-2">
        {["allergies", "medications", "service_requests"].map((key) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            disabled
            tabIndex={-1}
          >
            {t(key)}
          </Button>
        ))}
      </div>
    );
  }
  if (type === "plots" || type === "observation_chart") {
    return (
      <svg
        viewBox="0 0 320 120"
        role="img"
        aria-label={t("workspace_preview_sample_chart")}
        className="w-full text-primary-600"
      >
        <path d="M10 100H310M10 10V100" fill="none" stroke="#d1d5db" />
        <path
          d="M10 85L60 60L110 70L160 30L210 50L260 20L310 35"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        />
      </svg>
    );
  }
  if (type === "vitals") {
    return (
      <ul aria-hidden="true" className="grid grid-cols-2 gap-2 @md:grid-cols-4">
        {[82, 118, 98, 37].map((value) => (
          <li
            key={value}
            className="rounded-lg border border-soft-border bg-soft-background p-2.5"
          >
            <div className="h-1.5 w-1/2 rounded bg-strong-background" />
            <p className="mt-2 text-lg font-semibold text-muted-foreground">
              {value}
            </p>
            <div className="mt-1.5 h-1.5 w-1/3 rounded bg-muted-background" />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="space-y-2" aria-hidden="true">
      {[1, 2, 3].map((number) => (
        <div
          key={number}
          className="flex min-w-0 items-center gap-3 rounded-md border border-soft-border p-2"
        >
          <span className="size-7 shrink-0 rounded-md bg-primary-50" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-soft-foreground">
              {t("workspace_preview_sample_record", { number })}
            </p>
            <div className="mt-2 h-1.5 w-2/3 rounded bg-muted-background" />
          </div>
        </div>
      ))}
    </div>
  );
}
