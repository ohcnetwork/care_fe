import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_NAMES } from "../../Locale/config";
import clsx from "clsx";

export const LanguageSelector = () => {
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

  return (
    <div className="text-sm text-gray-800 flex flex-col items-center mt-8">
      Available in:
      <br />
      <div className="inline-flex gap-3 flex-wrap">
        {Object.keys(LANGUAGE_NAMES).map((e: string) => (
          <button
            key={e}
            onClick={() => handleLanguage(e)}
            className={clsx({
              "text-primary-600 underline": i18n.language === e,
              "text-primary-400 hover:text-primary-600": true,
            })}
          >
            {LANGUAGE_NAMES[e]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelector;
