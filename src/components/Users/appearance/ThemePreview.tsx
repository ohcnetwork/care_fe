import { AppearanceTheme } from "@/context/AppearanceContext";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  theme: AppearanceTheme;
}

/** The miniature layouts and palette samples from CareUI's settings page. */
export function ThemePreview({ theme }: ThemePreviewProps) {
  const accent = {
    light: "bg-emerald-400",
    "light-protanopia": "bg-blue-500",
    "light-tritanopia": "bg-rose-600",
  }[theme];

  return (
    <span
      aria-hidden="true"
      className="block h-10 w-full rounded-md border border-neutral-200 bg-white shadow-sm"
    >
      <span className="flex h-full items-start gap-1.5 p-1.5">
        <span className="h-full w-2/5 rounded bg-neutral-100" />
        <span className="flex h-full flex-1 flex-col gap-1">
          <span className="h-1.5 w-full rounded bg-neutral-200" />
          <span className="h-1.5 w-4/5 rounded bg-neutral-200" />
          <span className={cn("mt-auto h-2 w-1/2 rounded", accent)} />
        </span>
      </span>
    </span>
  );
}
