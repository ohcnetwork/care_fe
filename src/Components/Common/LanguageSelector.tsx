import { useEffect } from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { useTranslation } from "react-i18next";
import { LANGUAGE_NAMES } from "../../Locale/config";
import { classNames } from "../../Utils/utils";

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
    <div className="flex justify-end items-center relative w-full">
      <select
        className={classNames(
          props.className,
          "py-2 pl-2 pr-10 appearance-none rounded-md shadow-lg cursor-pointer focus:outline-none focus:ring-primary-500 focus:border-primary-500"
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
      <div className="absolute right-0 mr-1 z-10 h-auto w-8 pointer-events-none">
        <ExpandMoreIcon className={props.className} />
      </div>
    </div>
  );
};

export default LanguageSelector;
