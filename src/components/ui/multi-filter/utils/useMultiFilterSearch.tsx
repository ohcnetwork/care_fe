import { useState } from "react";
import { useTranslation } from "react-i18next";

export default function useMultiFilterSearch<
  T extends { value: string; label: string },
>(items: T[]) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) =>
    t(item.label).toLowerCase().includes(search.toLowerCase()),
  );

  return {
    search,
    setSearch,
    filteredItems,
  };
}
