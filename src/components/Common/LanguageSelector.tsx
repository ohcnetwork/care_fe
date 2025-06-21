import careConfig from "@careConfig";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { keysOf } from "@/Utils/utils";
import { LANGUAGES } from "@/i18n";

export const LanguageSelector = (props: any) => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.setAttribute("lang", i18n.language);
  }, [i18n]);

  const handleLanguage = (value: string) => {
    i18n.changeLanguage(value);
    if (window && window.localStorage) {
      localStorage.setItem("i18nextLng", value);
      document.documentElement.setAttribute("lang", i18n.language);
    }
  };

  const availableLocales = keysOf(LANGUAGES).filter((l) =>
    careConfig.availableLocales?.includes(l),
  );

  return (
    <div className="relative flex items-center">
      <select
        className={cn(
          props.className,
          "w-full cursor-pointer appearance-none rounded-md py-2 pl-2 pr-10 focus:border-primary-500 focus:outline-hidden focus:ring-primary-500",
        )}
        id="language-selector"
        name="language"
        value={i18n.language}
        onChange={(e: any) => handleLanguage(e.target.value)}
      >
        {availableLocales.map((e) => (
          <option key={e} value={e}>
            {LANGUAGES[e]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;
