import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";

import { ValueSetRead } from "@/types/valueSet/valueSet";
import { mergeAutocompleteOptions } from "@/Utils/utils";

import {
  ScopedValueSet,
  scopedOptionLabel,
  useScopedValueSets,
} from "./useScopedValueSets";

interface ValueSetParentPickerProps {
  facilityId: string;
  /** The current parent — may come from outside the loaded pages (e.g. a
   *  `?parent=` deep link), so it is merged into the options by identity. */
  value?: ValueSetRead;
  onChange: (parent: ScopedValueSet | undefined) => void;
  disabled?: boolean;
  id?: string;
  "aria-labelledby"?: string;
}

/**
 * Picks the value set a new facility set extends: the instance sets plus
 * this facility's own, each labelled with where it lives so two sets that
 * share a name (an instance set and a facility override of it) stay
 * distinguishable.
 */
export function ValueSetParentPicker({
  facilityId,
  value,
  onChange,
  disabled,
  ...ariaProps
}: ValueSetParentPickerProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const { options, isFetching } = useScopedValueSets({ facilityId, search });

  const autocompleteOptions = mergeAutocompleteOptions(
    options.map((option) => ({
      label: scopedOptionLabel(option, t),
      value: option.valueset.id,
    })),
    // The seeded parent (`?parent=`) may sit outside the loaded page, so it
    // is merged in by identity — and carries no scope suffix, since only
    // the two lists above establish where a set lives.
    value ? { label: value.name, value: value.id } : undefined,
  );

  const handleChange = (id: string) => {
    if (!id) {
      onChange(undefined);
      return;
    }
    const picked = options.find((option) => option.valueset.id === id);
    // Re-picking the merged-in current parent finds nothing in `options`;
    // keeping the selection beats silently clearing it.
    if (picked || id !== value?.id) {
      onChange(picked);
    }
  };

  return (
    <Autocomplete
      {...ariaProps}
      options={autocompleteOptions}
      value={value?.id ?? ""}
      onChange={handleChange}
      onSearch={setSearch}
      isLoading={isFetching}
      disabled={disabled}
      placeholder={t("none")}
      noOptionsMessage={t("no_valuesets_found")}
    />
  );
}
