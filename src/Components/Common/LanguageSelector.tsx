import React, { createRef, useEffect } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { useTranslation } from "react-i18next";

export const LanguageSelector = (props: any) => {
  const { i18n } = useTranslation();

  const LANGUAGE_NAMES: { [key: string]: any } = {
    en: "English",
    ta: "தமிழ்",
  };

  useEffect(() => {
    document.documentElement.setAttribute("lang", i18n.language);
  }, []);

  const handleLanguage = (value: string) => {
    i18n.changeLanguage(value);
    if (window && window.localStorage) {
      localStorage.setItem("i18nextLng", value);
      document.documentElement.setAttribute("lang", i18n.language);
    }
  };

  const { className } = props;

  return (
    <div className="flex items-center relative w-full">
      <select
        {...props}
        className={
          className +
          " py-2 pl-2 pr-8 appearance-none rounded-md shadow-lg cursor-auto"
        }
        id="language-selector"
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
      <div className="absolute right-0 mr-1 z-10 h-auto w-8">
        <ExpandMoreIcon
          className={className}
        />
      </div>
    </div>
  );
};

export default LanguageSelector;
