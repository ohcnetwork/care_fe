import careConfig from "@careConfig";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "@/Utils/utils";
import { LANGUAGES } from "@/i18n";

export const LanguageSelectorLogin = () => {
  const { i18n, t } = useTranslation();
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

  const availableLocales = Object.keys(LANGUAGES).filter((l) =>
    careConfig.availableLocales?.includes(l),
  );

  return (
    <div className="mt-8 flex flex-col items-center text-sm text-secondary-800">
      {t("available_in")}
      <br />
      <div className="inline-flex flex-wrap items-center justify-center gap-3">
        {availableLocales.map((e: string) => (
          <button
            key={e}
            onClick={() => handleLanguage(e)}
            className={classNames(
              "text-primary-400 hover:text-primary-600",
              (i18n.language === e ||
                (i18n.language === "en-US" && e === "en")) &&
                "text-primary-600 underline",
            )}
          >
            {LANGUAGES[e]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelectorLogin;
