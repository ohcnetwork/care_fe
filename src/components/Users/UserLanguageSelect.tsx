import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

interface Language {
  name: string;
  alpha2?: string;
}

// ISO 639-3 names from pycountry's iso-codes database:
// https://github.com/pycountry/pycountry/blob/main/src/pycountry/databases/iso639-3.json
export function useUserLanguages() {
  const { i18n } = useTranslation();
  const languages = useQuery<Record<string, Language>>({
    queryKey: ["userLanguages"],
    queryFn: async ({ signal }) => {
      const response = await fetch("/data/user-languages.json", { signal });
      if (!response.ok) throw new Error("Could not load languages");
      return response.json();
    },
    staleTime: Infinity,
  });
  const names = useMemo(
    () =>
      new Intl.DisplayNames([i18n.resolvedLanguage || "en"], {
        type: "language",
        fallback: "none",
      }),
    [i18n.resolvedLanguage],
  );
  const languageName = (code: string) => {
    const language = languages.data?.[code];
    return language?.alpha2
      ? names.of(language.alpha2) || language.name
      : language?.name || code;
  };
  return { ...languages, languageName };
}

interface UserLanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  "aria-invalid"?: boolean;
  "aria-labelledby"?: string;
  ref?: React.RefCallback<HTMLButtonElement | null>;
}

export function UserLanguageSelect(props: UserLanguageSelectProps) {
  const { t } = useTranslation();
  const { data, isLoading, isError, languageName } = useUserLanguages();
  const [search, setSearch] = useState("");
  const term = search.toLocaleLowerCase();
  const codes = Object.keys(data || {});
  const matches = codes.filter(
    (code) =>
      code.includes(term) ||
      languageName(code).toLocaleLowerCase().includes(term) ||
      data?.[code].name.toLocaleLowerCase().includes(term),
  );
  const visibleCodes = [
    ...new Set([props.value, ...matches.slice(0, 60)]),
  ].filter(Boolean);

  return (
    <Autocomplete
      {...props}
      options={visibleCodes.map((code) => ({
        value: code,
        label: languageName(code),
      }))}
      onSearch={setSearch}
      isLoading={isLoading}
      disabled={isError}
      placeholder={t("select_language")}
      inputPlaceholder={t("search_language")}
      noOptionsMessage={t("no_results_found")}
      className="w-full"
    />
  );
}
