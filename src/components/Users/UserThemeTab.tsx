import { Contrast, Eye, Monitor, Sparkles, Sun, Zap } from "lucide-react";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Lead,
  Muted,
  SectionTitle,
  SubsectionTitle,
} from "@/components/ui/typography";

import { AppearanceChoiceCard } from "@/components/Users/appearance/AppearanceChoiceCard";
import { MotionPreview } from "@/components/Users/appearance/MotionPreview";
import { ThemePreview } from "@/components/Users/appearance/ThemePreview";

import {
  AppearanceFontSize,
  AppearanceMotion,
  AppearanceTheme,
  useAppearance,
} from "@/context/AppearanceContext";
import { cn } from "@/lib/utils";

/** Adapted from CareUI's settings page, with account-backed preferences. */
export default function UserThemeTab() {
  const { t } = useTranslation();
  const id = useId();
  const {
    preferences,
    reducedMotion,
    systemPrefersReduced,
    isSaving,
    saveError,
    updatePreferences,
    retrySave,
  } = useAppearance();

  const lightSelected = preferences.theme === "light";
  const colorVisionOptions = [
    {
      value: "light-protanopia",
      label: t("appearance_light"),
      description: t("appearance_protanopia"),
      subtext: t("appearance_protanopia_description"),
    },
    {
      value: "light-tritanopia",
      label: t("appearance_light"),
      description: t("appearance_tritanopia"),
      subtext: t("appearance_tritanopia_description"),
    },
  ] as const;
  const motionOptions = [
    {
      value: "system",
      label: t("appearance_motion_system"),
      description: t("appearance_motion_system_description"),
      icon: Monitor,
      recommended: true,
    },
    {
      value: "reduce",
      label: t("appearance_motion_reduce"),
      description: t("appearance_motion_reduce_description"),
      icon: Sparkles,
      recommended: false,
    },
    {
      value: "allow",
      label: t("appearance_motion_allow"),
      description: t("appearance_motion_allow_description"),
      icon: Zap,
      recommended: false,
    },
  ] as const;
  const fontSizeOptions = [
    {
      value: "small",
      label: t("appearance_font_small"),
      pixels: 14,
      sampleSize: "text-sm",
    },
    {
      value: "default",
      label: t("default"),
      pixels: 16,
      sampleSize: "text-base",
    },
    {
      value: "large",
      label: t("appearance_font_large"),
      pixels: 18,
      sampleSize: "text-lg",
    },
    {
      value: "larger",
      label: t("appearance_font_larger"),
      pixels: 20,
      sampleSize: "text-xl",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-2xl space-y-10 p-4 md:p-8">
      <div>
        <SectionTitle className="text-3xl leading-9 font-bold">
          {t("USERMANAGEMENT_TAB__THEME")}
        </SectionTitle>
        <Lead className="mt-2">{t("appearance_preferences_description")}</Lead>
        <Muted className="mt-2">{t("appearance_autosave_help")}</Muted>
        <div
          role="status"
          aria-live="polite"
          className="mt-2 flex min-h-5 items-center gap-2 text-sm text-muted-foreground"
        >
          {isSaving && (
            <>
              <Spinner className="size-3.5" aria-hidden="true" />
              {t("saving")}
            </>
          )}
        </div>
        {saveError && (
          <Alert variant="destructive" className="mt-3">
            <AlertTitle>{t("appearance_save_error_title")}</AlertTitle>
            <AlertDescription>
              {t("appearance_save_error_description")}
            </AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="sm"
                onClick={retrySave}
                disabled={isSaving}
              >
                {t("retry")}
              </Button>
            </AlertAction>
          </Alert>
        )}
      </div>

      <section className="space-y-6" aria-labelledby={`${id}-appearance`}>
        <div>
          <SubsectionTitle id={`${id}-appearance`}>
            {t("appearance_section")}
          </SubsectionTitle>
          <Muted className="mt-1">{t("appearance_section_description")}</Muted>
        </div>
        <Separator />
        <RadioGroup<AppearanceTheme>
          name={`${id}-theme`}
          value={preferences.theme}
          onValueChange={(theme) => updatePreferences({ theme })}
          aria-labelledby={`${id}-theme-title`}
          className="gap-6"
        >
          <div className="space-y-3">
            <div>
              <h4
                id={`${id}-theme-title`}
                className="text-sm font-medium text-foreground"
              >
                {t("USERMANAGEMENT_TAB__THEME")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("appearance_theme_description")}
              </p>
            </div>
            <div className="grid max-w-48 gap-3">
              <AppearanceChoiceCard
                id={`${id}-light`}
                value="light"
                selected={lightSelected}
              >
                <ThemePreview theme="light" />
                <span className="flex items-center gap-1.5">
                  <Sun
                    className={cn(
                      "size-3.5 shrink-0",
                      lightSelected ? "text-primary" : "text-muted-foreground",
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      "text-sm font-medium",
                      lightSelected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {t("appearance_light")}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {t("appearance_light_description")}
                </span>
              </AppearanceChoiceCard>
            </div>
          </div>
          <Separator />
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {t("appearance_color_vision")}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t("appearance_color_vision_description")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {colorVisionOptions.map((option) => {
                const selected = preferences.theme === option.value;
                return (
                  <AppearanceChoiceCard
                    key={option.value}
                    id={`${id}-${option.value}`}
                    value={option.value}
                    selected={selected}
                  >
                    <ThemePreview theme={option.value} />
                    <span className="flex items-center gap-1.5">
                      <Eye
                        className={cn(
                          "size-3.5 shrink-0",
                          selected ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden="true"
                      />
                      <span
                        className={cn(
                          "text-sm font-medium",
                          selected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {option.label}
                      </span>
                    </span>
                    <span>
                      <span className="block text-xs font-medium text-foreground">
                        {option.description}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.subtext}
                      </span>
                    </span>
                  </AppearanceChoiceCard>
                );
              })}
            </div>
          </div>
        </RadioGroup>
      </section>

      <section className="space-y-6" aria-labelledby={`${id}-accessibility`}>
        <div>
          <SubsectionTitle id={`${id}-accessibility`}>
            {t("appearance_accessibility")}
          </SubsectionTitle>
          <Muted className="mt-1">
            {t("appearance_accessibility_description")}
          </Muted>
        </div>
        <Separator />
        <div className="space-y-4">
          <div>
            <h4
              id={`${id}-motion-title`}
              className="text-sm font-medium text-foreground"
            >
              {t("appearance_motion_reduce")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("appearance_motion_description")}
            </p>
          </div>
          <RadioGroup<AppearanceMotion>
            name={`${id}-motion`}
            value={preferences.motion}
            onValueChange={(motion) => updatePreferences({ motion })}
            aria-labelledby={`${id}-motion-title`}
            className="grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {motionOptions.map((option) => {
              const Icon = option.icon;
              const selected = preferences.motion === option.value;
              return (
                <AppearanceChoiceCard
                  key={option.value}
                  id={`${id}-motion-${option.value}`}
                  value={option.value}
                  selected={selected}
                  className="justify-between gap-3 p-3.5"
                >
                  <span className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-md transition-colors",
                        selected
                          ? "bg-primary/15 text-primary"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                    </span>
                    {option.recommended && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {t("appearance_recommended")}
                      </span>
                    )}
                  </span>
                  <span className="space-y-1">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        selected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="block text-xs leading-relaxed text-muted-foreground">
                      {option.description}
                    </span>
                  </span>
                </AppearanceChoiceCard>
              );
            })}
          </RadioGroup>
          <p
            role="status"
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 shrink-0 rounded-full",
                reducedMotion ? "bg-amber-500" : "bg-emerald-500",
              )}
            />
            {preferences.motion === "system"
              ? systemPrefersReduced
                ? t("appearance_motion_status_system_reduced")
                : t("appearance_motion_status_system_full")
              : reducedMotion
                ? t("appearance_motion_status_reduced")
                : t("appearance_motion_status_full")}
          </p>
          <MotionPreview reducedMotion={reducedMotion} />
        </div>
        <Separator />
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Contrast
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <div>
              <Label
                htmlFor={`${id}-contrast`}
                className="text-sm leading-normal font-medium text-foreground"
              >
                {t("appearance_contrast")}
              </Label>
              <p
                id={`${id}-contrast-description`}
                className="text-sm text-muted-foreground"
              >
                {t("appearance_contrast_description")}
              </p>
            </div>
          </div>
          <Switch
            id={`${id}-contrast`}
            checked={preferences.high_contrast}
            onCheckedChange={(high_contrast) =>
              updatePreferences({ high_contrast })
            }
            aria-describedby={`${id}-contrast-description`}
          />
        </div>
        <Separator />
        <div className="space-y-3">
          <div>
            <h4
              id={`${id}-font-title`}
              className="text-sm font-medium text-foreground"
            >
              {t("font_size")}
            </h4>
            <p className="text-sm text-muted-foreground">
              {t("appearance_font_description")}
            </p>
          </div>
          <RadioGroup<AppearanceFontSize>
            name={`${id}-font-size`}
            value={preferences.font_size}
            onValueChange={(font_size) => updatePreferences({ font_size })}
            aria-labelledby={`${id}-font-title`}
            className="grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {fontSizeOptions.map((option) => {
              const selected = preferences.font_size === option.value;
              return (
                <AppearanceChoiceCard
                  key={option.value}
                  id={`${id}-font-${option.value}`}
                  value={option.value}
                  selected={selected}
                  className="items-center p-4 text-center"
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "leading-none font-semibold",
                      option.sampleSize,
                      selected ? "text-primary" : "text-foreground",
                    )}
                  >
                    {t("appearance_font_sample")}
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        selected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {t("appearance_font_pixels", { pixels: option.pixels })}
                    </span>
                  </span>
                </AppearanceChoiceCard>
              );
            })}
          </RadioGroup>
        </div>
      </section>
    </div>
  );
}
