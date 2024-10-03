import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./Locale/en";
import ta from "./Locale/ta";
import ml from "./Locale/ml";
import mr from "./Locale/mr";
import kn from "./Locale/kn";
import hi from "./Locale/hi";

export const LANGUAGES: { [key: string]: any } = {
  en: "English",
  ta: "தமிழ்",
  ml: "മലയാളം",
  mr: "मराठी",
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
};

const resources = {
  en: { translation: en },
  ta: { translation: ta },
  ml: { translation: ml },
  mr: { translation: mr },
  kn: { translation: kn },
  hi: { translation: hi },
};

i18n
  .use(initReactI18next)
  .use(LanguageDetector)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
      skipOnVariables: false,
    },
  });

export default i18n;
