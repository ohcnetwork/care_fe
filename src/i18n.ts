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
      if (namespace === DEFAULT_NAMESPACE && careConfig.i18nUrl) {
        const remoteUrl = `${careConfig.i18nUrl}/${language}.json`;
        const localUrl = `/locale/${language}.json`;
        Promise.all([
          fetch(remoteUrl)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .catch((error) => {
              console.warn(
                `Failed to load remote translations: ${remoteUrl}`,
                error,
              );
              return {};
            }),
          fetch(localUrl)
            .then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            })
            .catch((error) => {
              console.warn(
                `Failed to load local fallback translations: ${localUrl}`,
                error,
              );
              return {};
            }),
        ])
          .then(([remoteResources, localResources]) => {
            const merged = { ...localResources, ...remoteResources };
            callback(null, merged);
          })
          .catch((error) => {
            console.error(
              `Failed to prepare translations for ${language}/${namespace}:`,
              error,
            );
            callback(error, null);
          });
        return;
      }

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
