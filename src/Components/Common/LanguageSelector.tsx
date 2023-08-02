import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { LANGUAGE_NAMES } from "../../Locale/config";
import { classNames } from "../../Utils/utils";
import CareIcon from "../../CAREUI/icons/CareIcon";

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

  return (
    <div className="relative flex w-full items-center justify-end">
      <select
        className={classNames(
          props.className,
          "cursor-pointer appearance-none rounded-md py-2 pl-2 pr-10 shadow-lg focus:border-primary-500 focus:outline-none focus:ring-primary-500"
        )}
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
      <div className="pointer-events-none absolute right-0 z-10 mr-1 h-auto w-8">
        <CareIcon className={`care-l-angle-down text-xl ${props.className}`} />
      </div>
    </div>
  );
};

export default LanguageSelector;
