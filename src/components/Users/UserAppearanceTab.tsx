import { Contrast, Eye, Monitor, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import { userChildProps } from "@/components/Common/UserColumns";

import { useContrast } from "@/Providers/ContrastProvider";
import { type FontSize, useFontSize } from "@/Providers/FontSizeProvider";
import { type Theme, useTheme } from "@/Providers/ThemeProvider";

import { cn } from "@/lib/utils";

const themeOptions: {
  value: Theme;
  label: string;
  descriptionKey: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}[] = [
  {
    value: "light",
    label: "Light",
    descriptionKey: "theme_light_description",
    icon: Sun,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-100" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-200" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-200" />
            <div className="mt-auto h-2 w-1/2 rounded bg-emerald-400" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    descriptionKey: "theme_dark_description",
    icon: Moon,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-800" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-700" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-700" />
            <div className="mt-auto h-2 w-1/2 rounded bg-emerald-600" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "system",
    label: "System",
    descriptionKey: "theme_system_description",
    icon: Monitor,
    preview: (
      <div className="h-10 w-full overflow-hidden rounded-md border border-neutral-300 shadow-sm">
        <div className="flex h-full">
          <div className="flex w-1/2 items-start gap-1 bg-white p-1.5">
            <div className="h-full w-2/5 rounded bg-neutral-100" />
            <div className="flex h-full flex-1 flex-col gap-1">
              <div className="h-1.5 w-full rounded bg-neutral-200" />
              <div className="mt-auto h-2 w-1/2 rounded bg-emerald-400" />
            </div>
          </div>
          <div className="flex w-1/2 items-start gap-1 bg-neutral-900 p-1.5">
            <div className="h-full w-2/5 rounded bg-neutral-800" />
            <div className="flex h-full flex-1 flex-col gap-1">
              <div className="h-1.5 w-full rounded bg-neutral-700" />
              <div className="mt-auto h-2 w-1/2 rounded bg-emerald-600" />
            </div>
          </div>
        </div>
      </div>
    ),
  },
];

const a11yThemeOptions: {
  value: Theme;
  label: string;
  description: string;
  subtextKey: string;
  icon: React.ElementType;
  preview: React.ReactNode;
}[] = [
  {
    value: "light-protanopia",
    label: "Light",
    description: "Protanopia & Deuteranopia",
    subtextKey: "theme_protanopia_subtext",
    icon: Eye,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-100" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-200" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-200" />
            <div className="mt-auto h-2 w-1/2 rounded bg-blue-500" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "dark-protanopia",
    label: "Dark",
    description: "Protanopia & Deuteranopia",
    subtextKey: "theme_protanopia_subtext",
    icon: Eye,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-800" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-700" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-700" />
            <div className="mt-auto h-2 w-1/2 rounded bg-blue-400" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "light-tritanopia",
    label: "Light",
    description: "Tritanopia",
    subtextKey: "theme_tritanopia_subtext",
    icon: Eye,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-200 bg-white shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-100" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-200" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-200" />
            <div className="mt-auto h-2 w-1/2 rounded bg-rose-600" />
          </div>
        </div>
      </div>
    ),
  },
  {
    value: "dark-tritanopia",
    label: "Dark",
    description: "Tritanopia",
    subtextKey: "theme_tritanopia_subtext",
    icon: Eye,
    preview: (
      <div className="h-10 w-full rounded-md border border-neutral-700 bg-neutral-900 shadow-sm">
        <div className="flex h-full items-start gap-1.5 p-1.5">
          <div className="h-full w-2/5 rounded bg-neutral-800" />
          <div className="flex h-full flex-1 flex-col gap-1">
            <div className="h-1.5 w-full rounded bg-neutral-700" />
            <div className="h-1.5 w-4/5 rounded bg-neutral-700" />
            <div className="mt-auto h-2 w-1/2 rounded bg-rose-400" />
          </div>
        </div>
      </div>
    ),
  },
];

const fontSizeOptions: {
  value: FontSize;
  label: string;
  description: string;
  sampleSize: string;
}[] = [
  {
    value: "small",
    label: "Small",
    description: "14px",
    sampleSize: "text-sm",
  },
  {
    value: "default",
    label: "Default",
    description: "16px",
    sampleSize: "text-base",
  },
  {
    value: "large",
    label: "Large",
    description: "18px",
    sampleSize: "text-lg",
  },
  {
    value: "larger",
    label: "Larger",
    description: "20px",
    sampleSize: "text-xl",
  },
];

export default function UserAppearanceTab(_props: userChildProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useFontSize();
  const { highContrast, setHighContrast } = useContrast();

  return (
    <section className="mt-6 max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t("appearance")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          {t("appearance_customize_description")}
        </p>
      </div>

      <Separator />

      {/* Theme */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">{t("theme")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("theme_choose_description")}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                  isActive
                    ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/30"
                    : "border-border hover:border-strong-border hover:bg-soft-background",
                )}
              >
                {option.preview}
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive ? "text-primary-500" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary-500" : "text-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs">
                  {t(option.descriptionKey)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* Color-blind friendly themes */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">{t("color_blind_friendly")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("color_blind_friendly_description")}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {a11yThemeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setTheme(option.value)}
                className={cn(
                  "flex cursor-pointer flex-col gap-2 rounded-lg border p-3 text-left transition-all",
                  isActive
                    ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/30"
                    : "border-border hover:border-strong-border hover:bg-soft-background",
                )}
              >
                {option.preview}
                <div className="flex items-center gap-1.5">
                  <Icon
                    className={cn(
                      "size-3.5 shrink-0",
                      isActive ? "text-primary-500" : "text-muted-foreground",
                    )}
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary-500" : "text-foreground",
                    )}
                  >
                    {option.label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">
                    {option.description}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t(option.subtextKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Separator />

      {/* High contrast */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Contrast className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{t("increase_contrast")}</p>
            <p className="text-sm text-muted-foreground">
              {t("increase_contrast_description")}
            </p>
          </div>
        </div>
        <Switch
          checked={highContrast}
          onCheckedChange={setHighContrast}
          aria-label={t("increase_contrast")}
        />
      </div>

      <Separator />

      {/* Font size */}
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium">{t("font_size")}</h3>
          <p className="text-muted-foreground text-sm">
            {t("font_size_description")}
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {fontSizeOptions.map((option) => {
            const isActive = fontSize === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setFontSize(option.value)}
                className={cn(
                  "flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 transition-all",
                  isActive
                    ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/30"
                    : "border-border hover:border-strong-border hover:bg-soft-background",
                )}
              >
                <span
                  className={cn(
                    "font-semibold leading-none",
                    option.sampleSize,
                    isActive ? "text-primary-500" : "text-foreground",
                  )}
                >
                  Aa
                </span>
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary-500" : "text-foreground",
                    )}
                  >
                    {option.label}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {option.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
