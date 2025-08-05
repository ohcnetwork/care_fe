import { useState } from "react";

export default function useFilterSearch<T extends { value: string }>(
  items: T[],
) {
  const [search, setSearch] = useState("");
  const filteredItems = items.filter((item) =>
    item.value.toLowerCase().includes(search.toLowerCase()),
  );

  return {
    search,
    setSearch,
    filteredItems,
  };
}
