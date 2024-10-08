import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./Locale/en.json";
import ta from "./Locale/ta.json";
import ml from "./Locale/ml.json";
import mr from "./Locale/mr.json";
import kn from "./Locale/kn.json";
import hi from "./Locale/hi.json";

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
