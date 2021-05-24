import React from "react";
import { useTranslation } from "react-i18next";

export const LanguageSelector = () => {
  const { i18n } = useTranslation();

  const LANGUAGE_NAMES: { [key: string]: any } = {
    en: "English",
    ta: "தமிழ்",
  };

  const handleLanguage = (value: string) => {
    i18n.changeLanguage(value);
    if (window && window.localStorage) {
      localStorage.setItem("i18nextLng", value);
    }
  };

  return (
    <select
      className="absolute top-2 right-2 py-3 px-5  md:bg-green-500 md:text-white bg-white rounded-md shadow-lg"
      name="language"
      value={i18n.language}
      onChange={(e: any) => handleLanguage(e.target.value)}
    >
      {Object.keys(LANGUAGE_NAMES).map((e: string) => (
        <option key={e} value={e}>
          {LANGUAGE_NAMES[e]}
        </option>
      ))}
    </select>
  );
};

export default LanguageSelector;
