import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_NAMES } from "../../Locale/config";
import { classNames } from "../../Utils/utils";

export const LanguageSelectorLogin = () => {
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
            className={classNames(
              "text-primary-400 hover:text-primary-600",
              i18n.language === e && "text-primary-600 underline"
            )}
          >
            {LANGUAGE_NAMES[e]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSelectorLogin;
