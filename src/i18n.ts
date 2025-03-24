import careConfig from "@careConfig";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";

export const LANGUAGES = {
  en: "English",
  ta: "தமிழ்",
  ml: "മലയാളം",
  mr: "मराठी",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
} as const;

const DEFAULT_NAMESPACE = "care_fe";

const namespaceToUrl = (namespace: string) => {
  return careConfig.careApps.find((app) => app.name === namespace)?.url ?? "";
};

i18n
  .use(HttpApi)
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend((language, namespace, callback) => {
      const baseUrl = namespaceToUrl(namespace)?.replace(/\/$/, "");

      if (!baseUrl && namespace !== DEFAULT_NAMESPACE) {
        callback(null, {});
        return;
      }

      fetch(`${baseUrl}/locale/${language}.json`)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((resources) => {
          callback(null, resources);
        })
        .catch((error) => {
          console.error(
            `Failed to load translations for ${language}/${namespace}:`,
            error,
          );
          callback(error, null);
        });
    }),
  )
  .init({
    fallbackLng: "en",
    ns: [DEFAULT_NAMESPACE, ...careConfig.careApps.map((app) => app.name)],
    load: "currentOnly",
    supportedLngs: Object.keys(LANGUAGES),
    interpolation: {
      escapeValue: false,
      skipOnVariables: false,
    },
    defaultNS: DEFAULT_NAMESPACE,
  });

export default i18n;
