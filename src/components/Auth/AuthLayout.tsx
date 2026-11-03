import careConfig from "@careConfig";
import { Globe } from "lucide-react";
import { Link } from "raviger";
import { ReactNode, useEffect, useId } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

import { PixelCanvas } from "@/components/Auth/PixelCanvas";

import { keysOf } from "@/Utils/utils";
import { LANGUAGES } from "@/i18n";

const availableLocales = keysOf(LANGUAGES).filter((locale) =>
  careConfig.availableLocales.includes(locale),
);

// REACT_MAIN_LOGO falls back to the stock Care logo, so only a different
// source counts as the instance's own logo. When set, it replaces the Care
// logotype at the top (Care stays credited in the footer strip); instance
// logos are often square emblems, so they get more height than the wordmark.
const { mainLogo } = careConfig;
const hasInstanceLogo = [mainLogo?.dark, mainLogo?.light].some(
  (source) => source && source !== "/images/care_logo.svg",
);
const brandLogo = hasInstanceLogo
  ? {
      onLight: mainLogo?.dark ?? mainLogo?.light,
      onDark: mainLogo?.light ?? mainLogo?.dark,
      className: "h-16 w-auto max-w-56 object-contain",
    }
  : {
      onLight: "/images/care_logo_on_light.svg",
      onDark: "/images/care_logo_on_dark.svg",
      className: "h-auto w-28",
    };

const deploymentLogos = [careConfig.stateLogo, careConfig.customLogo].filter(
  (logo) => logo?.light || logo?.dark,
);

function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const labelId = useId();

  // Screen readers pick pronunciation from <html lang>, which index.html
  // hard-codes to "en"; keep it in step with a saved or chosen language.
  useEffect(() => {
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n.language]);

  if (availableLocales.length < 2) return null;

  const current =
    availableLocales.find(
      (locale) =>
        i18n.language === locale || i18n.language.startsWith(`${locale}-`),
    ) ?? availableLocales[0];

  const changeLanguage = (locale: string) => {
    i18n.changeLanguage(locale);
    localStorage.setItem("i18nextLng", locale);
  };

  return (
    <section
      aria-labelledby={labelId}
      className="relative z-10 flex w-full flex-wrap items-center justify-center gap-3 rounded-xl p-2"
    >
      <h2
        id={labelId}
        className="flex items-center gap-1.5 text-sm font-normal text-muted-foreground"
      >
        <Globe aria-hidden="true" className="size-4" strokeWidth={1.5} />
        {t("language")}
      </h2>
      <Separator orientation="vertical" aria-hidden="true" className="h-6" />
      <div className="w-full md:w-48">
        <Select value={current} onValueChange={changeLanguage}>
          <SelectTrigger aria-labelledby={labelId} className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {availableLocales.map((locale) => (
              <SelectItem key={locale} value={locale} lang={locale}>
                {LANGUAGES[locale]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  );
}

/**
 * Full-page frame shared by the public auth screens (login, 2FA, password
 * reset), following the careui staff-sign-in-01 block.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const customDescriptionHtml = __CUSTOM_DESCRIPTION_HTML__;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-primary bg-linear-to-b from-primary via-primary-700 via-90% to-primary to-98% px-0.5 pt-0.5">
      <main className="relative isolate flex min-h-0 flex-1 flex-col items-center gap-4 overflow-x-hidden overflow-y-auto rounded-t-md rounded-b-2xl border-2 border-primary-900 bg-background p-2 md:px-4 md:pt-12 md:pb-6 dark:border-primary-600">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,var(--color-primary)_1px,transparent_1px)] bg-size-[16px_16px] opacity-10"
        />
        <PixelCanvas className="absolute inset-0 z-0" />
        {/* min-h reserves the staff-form height so shorter cards keep the same top edge */}
        <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-2 md:my-auto md:min-h-155">
          <div className="flex w-full max-w-sm flex-col gap-4">
            <div className="flex items-center justify-center gap-4">
              {deploymentLogos.map((logo, index) => (
                <div key={index} className="flex items-center">
                  <img
                    src={logo?.dark ?? logo?.light}
                    alt={t("state_logo")}
                    className="h-10 w-auto dark:hidden"
                  />
                  <img
                    src={logo?.light ?? logo?.dark}
                    alt={t("state_logo")}
                    className="hidden h-10 w-auto dark:block"
                  />
                </div>
              ))}
              {deploymentLogos.length > 0 && (
                <Separator
                  orientation="vertical"
                  aria-hidden="true"
                  className="h-8"
                />
              )}
              <img
                src={brandLogo.onLight}
                alt={t("care")}
                className={cn(brandLogo.className, "dark:hidden")}
              />
              <img
                src={brandLogo.onDark}
                alt={t("care")}
                className={cn(brandLogo.className, "hidden dark:block")}
              />
            </div>
            {children}
          </div>
          <LanguageSelect />
        </div>
        <footer className="relative z-10 mt-auto flex w-full max-w-2xl flex-col items-center gap-2 pt-2 text-center text-sm leading-6 text-muted-foreground md:mt-0">
          {customDescriptionHtml && (
            <div dangerouslySetInnerHTML={{ __html: customDescriptionHtml }} />
          )}
          <Link
            href="/licenses"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline underline-offset-4 hover:text-foreground"
          >
            {t("third_party_software_licenses")}
          </Link>
        </footer>
      </main>
      <div className="flex items-center justify-center gap-6 py-2">
        <a
          href={careConfig.urls.ohcn}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
        >
          <img
            src={
              careConfig.customLogoAlt?.light ?? "/images/ohc_logo_light.svg"
            }
            alt={t("open_healthcare_network")}
            className="h-auto w-24 mix-blend-overlay"
          />
        </a>
        <Separator
          orientation="vertical"
          aria-hidden="true"
          className="h-8 bg-primary-500 dark:bg-primary-700"
        />
        <img
          src="/images/care_logo_on_dark.svg"
          alt={t("care")}
          className="h-auto w-20 mix-blend-overlay"
        />
      </div>
    </div>
  );
}
