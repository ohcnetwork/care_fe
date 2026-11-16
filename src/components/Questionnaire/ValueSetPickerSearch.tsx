import { useState, type ComponentProps } from "react";

import ValueSetSearchContent from "@/components/Questionnaire/ValueSetSearchContent";

type ValueSetPickerSearchProps = Omit<
  ComponentProps<typeof ValueSetSearchContent>,
  "search" | "onSearchChange"
>;

/** A picker opening owns a fresh search; closing it discards that search. */
export function ValueSetPickerSearch(props: ValueSetPickerSearchProps) {
  const [search, setSearch] = useState("");
  return (
    <ValueSetSearchContent
      {...props}
      search={search}
      onSearchChange={setSearch}
    />
  );
}
