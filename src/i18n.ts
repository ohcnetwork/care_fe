import { PlugConfig } from "@/types/plugConfig";
import plugConfigApi from "@/types/plugConfig/plugConfigApi";
import { callApi } from "@/Utils/request/query";
import careConfig from "@careConfig";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpApi from "i18next-http-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import { initReactI18next } from "react-i18next";
import { z } from "zod";

export const LANGUAGES = {
  en: "English",
  ta: "தமிழ்",
  ml: "മലയാളം",
  mr: "मराठी",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
} as const;

const DEFAULT_NAMESPACE = "care_fe";

let pluginConfigs: PlugConfig[] = [];

const namespaceToUrl = (namespace: string) => {
  if (namespace === DEFAULT_NAMESPACE) {
    return "/";
  }

  const pluginConfig = pluginConfigs.find(
    (config) => config.meta?.name === namespace || config.slug === namespace,
  );

  if (
    pluginConfig?.meta?.url &&
    z.string().url().safeParse(pluginConfig.meta.url).success
  ) {
    const url = new URL(pluginConfig.meta.url);
    return url.origin.toString();
  }

  return undefined;
};

const fetchOptions = { cache: "no-store" as RequestCache };

export async function initI18n() {
  // Fetch plugin configurations from API
  try {
    const response = await callApi(plugConfigApi.list, {
      silent: true,
    });
    pluginConfigs = response.configs || [];
  } catch (error) {
    console.warn(
      "Failed to fetch plugin configurations for i18n namespaces:",
      error,
    );
    pluginConfigs = [];
  }

  const pluginNamespaces = pluginConfigs
    .map((config) => config.meta?.name || config.slug)
    .filter((name): name is string => !!name);

  const namespaces = Array.from(
    new Set([DEFAULT_NAMESPACE, ...pluginNamespaces]),
  );

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
            fetch(remoteUrl, fetchOptions)
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
            fetch(localUrl, fetchOptions)
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

        fetch(`${baseUrl}/locale/${language}.json`, fetchOptions)
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
      ns: namespaces,
      load: "currentOnly",
      supportedLngs: Object.keys(LANGUAGES),
      interpolation: {
        escapeValue: false,
        skipOnVariables: false,
      },
      defaultNS: DEFAULT_NAMESPACE,
    });
}

export default i18n;
