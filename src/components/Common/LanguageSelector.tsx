import careConfig from "@careConfig";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { keysOf } from "@/Utils/utils";
import { LANGUAGES } from "@/i18n";

export const LanguageSelector = () => {
  const { t, i18n } = useTranslation();

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
    <Select value={i18n.language} onValueChange={handleLanguage}>
      <SelectTrigger>
        <SelectValue placeholder={t("select_language")} />
      </SelectTrigger>
      <SelectContent>
        {availableLocales.map((lang) => (
          <SelectItem key={lang} value={lang}>
            {LANGUAGES[lang]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LanguageSelector;
