import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ValueSetBase } from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";

interface ValueSetPreviewProps {
  valueset: ValueSetBase;
  trigger: React.ReactNode;
}

function getNoOptionsMessage(
  t: (key: string, options?: Record<string, unknown>) => string,
  hasValidRules: boolean,
  isBelowMin: boolean,
  searchQuery: unknown,
  isFetching: boolean,
  minSearchLength: number,
): string {
  if (!hasValidRules) {
    return t("add_concept");
  }
  if (isBelowMin) {
    return t("min_char_length_error", {
      min_length: minSearchLength,
    });
  }
  if (searchQuery && !isFetching) {
    return t("no_results_found");
  }
  return t("searching");
}

export function ValueSetPreview({ valueset, trigger }: ValueSetPreviewProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const minSearchLength = 3;
  const isBelowMin = search.length < minSearchLength;

  const compose = valueset.compose?.include?.[0]?.system
    ? {
        include: valueset.compose.include ?? [],
        exclude: valueset.compose.exclude ?? [],
      }
    : {
        include: [{ system: "http://snomed.info/sct" }],
        exclude: [],
      };

  const hasValidRules = compose.include?.some(
    (rule) => (rule.concept?.length ?? 0) > 0 || (rule.filter?.length ?? 0) > 0,
  );

  const { data: searchQuery, isFetching } = useQuery({
    queryKey: ["valueset", "previewSearch", search, valueset.compose],
    queryFn: query.debounced(valueSetApi.previewSearch, {
      queryParams: { search, count: 20 },
      body: {
        ...valueset,
        name: valueset.name || "Preview",
        slug: valueset.slug || "preview-slug",
        compose,
      },
    }),
    enabled: open && !isBelowMin && hasValidRules,
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("valueset_preview")}
          </SheetTitle>
          <SheetDescription>
            {t("valueset_preview_description")}
          </SheetDescription>
        </SheetHeader>
        <div className="px-1 mt-6">
          <Autocomplete
            options={mergeAutocompleteOptions(
              searchQuery?.results?.map((option) => ({
                label: option.display || "",
                value: option.code,
              })) ?? [],
            )}
            value={selected}
            onChange={setSelected}
            onSearch={setSearch}
            isLoading={isFetching}
            placeholder={t("search_concept")}
            noOptionsMessage={getNoOptionsMessage(
              t,
              hasValidRules,
              isBelowMin,
              searchQuery,
              isFetching,
              minSearchLength,
            )}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
