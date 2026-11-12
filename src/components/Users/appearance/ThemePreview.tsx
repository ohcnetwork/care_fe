import { AppearanceTheme } from "@/context/AppearanceContext";
import { cn } from "@/lib/utils";

interface ThemePreviewProps {
  theme: AppearanceTheme;
}

// Literal colors: the neutral palette is remapped in dark mode (src/style/dark.css),
// but each preview must look the same whichever theme is active.
const PALETTES = {
  light: {
    frame: "border-[oklch(0.922_0_0)] bg-[oklch(1_0_0)]",
    panel: "bg-[oklch(0.97_0_0)]",
    line: "bg-[oklch(0.922_0_0)]",
  },
  dark: {
    frame: "border-[oklch(0.371_0_0)] bg-[oklch(0.205_0_0)]",
    panel: "bg-[oklch(0.269_0_0)]",
    line: "bg-[oklch(0.371_0_0)]",
  },
};

function PreviewLayout({
  palette,
  accent,
}: {
  palette: (typeof PALETTES)["light"];
  accent: string;
}) {
  return (
    <span className="flex h-full items-start gap-1.5 p-1.5">
      <span className={cn("h-full w-2/5 rounded", palette.panel)} />
      <span className="flex h-full flex-1 flex-col gap-1">
        <span className={cn("h-1.5 w-full rounded", palette.line)} />
        <span className={cn("h-1.5 w-4/5 rounded", palette.line)} />
        <span className={cn("mt-auto h-2 w-1/2 rounded", accent)} />
      </span>
    </span>
  );
}

/** The miniature layouts and palette samples from CareUI's settings page. */
export function ThemePreview({ theme }: ThemePreviewProps) {
  const accent = {
    light: "bg-emerald-400",
    dark: "bg-emerald-400",
    system: "bg-emerald-400",
    "light-protanopia": "bg-blue-500",
    "light-tritanopia": "bg-rose-600",
  }[theme];

  if (theme === "system") {
    return (
      <span
        aria-hidden="true"
        className={cn(
          "relative block h-10 w-full overflow-hidden rounded-md border shadow-sm",
          PALETTES.light.frame,
        )}
      >
        <PreviewLayout palette={PALETTES.light} accent={accent} />
        <span
          className={cn(
            "absolute inset-0 [clip-path:inset(0_0_0_50%)]",
            PALETTES.dark.frame,
          )}
        >
          <PreviewLayout palette={PALETTES.dark} accent={accent} />
        </span>
      </span>
    );
  }

  const palette = theme === "dark" ? PALETTES.dark : PALETTES.light;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block h-10 w-full rounded-md border shadow-sm",
        palette.frame,
      )}
    >
      <PreviewLayout palette={palette} accent={accent} />
    </span>
  );
}
