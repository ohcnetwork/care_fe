import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { ValuesetFormType } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

interface ValueSetPreviewProps {
  valueset: ValuesetFormType;
  trigger: React.ReactNode;
}

export function ValueSetPreview({ valueset, trigger }: ValueSetPreviewProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");

  const { data: searchQuery, isFetching } = useQuery({
    queryKey: ["valueset", "preview_search", search, valueset.compose],
    queryFn: query.debounced(valuesetApi.preview_search, {
      queryParams: { search, count: 20 },
      body: {
        ...valueset,
        name: valueset.name,
        slug: valueset.slug,
        compose: valueset.compose.include[0]?.system
          ? valueset.compose
          : {
              include: [{ system: "http://snomed.info/sct" }],
              exclude: [],
            },
      },
    }),
    enabled: open,
  });

  const rawResults = useMemo(() => searchQuery?.results || [], [searchQuery]);

  const defaultConcepts = useMemo(
    () =>
      valueset.compose?.include?.flatMap((include) => include.concept || []) ??
      [],
    [valueset.compose],
  );

  const matched = useMemo(
    () => (selected ? rawResults.filter((o) => o.code === selected) : []),
    [selected, rawResults],
  );
  const detailsToShow = useMemo(() => {
    if (matched.length) {
      return matched;
    }

    if (!selected) {
      return rawResults.length ? rawResults : defaultConcepts;
    }

    if (selected && isFetching) {
      return defaultConcepts;
    }

    return [];
  }, [matched, selected, rawResults, defaultConcepts, isFetching]);

  useEffect(() => {
    if (open) {
      setSelected("");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-2 pl-3">
        <SheetHeader className="space-y-1 px-1">
          <SheetTitle className="text-xl font-semibold">
            {t("valueset_preview")}
          </SheetTitle>
          <p className="text-sm text-gray-500">
            {t("valueset_preview_description")}
          </p>
        </SheetHeader>
        <Autocomplete
          options={mergeAutocompleteOptions(
            searchQuery?.results?.map((option) => ({
              label: option.display || "",
              value: option.code,
            })) ?? [],
          )}
          value={selected}
          freeInput={true}
          onChange={setSelected}
          onSearch={(val) => {
            setSearch(val);
            setSelected("");
          }}
          placeholder={t("search_concept")}
          noOptionsMessage={
            searchQuery && !isFetching ? t("no_results_found") : t("searching")
          }
          className="px-1 mt-6"
        />
        <div className="mt-6 space-y-4">
          {detailsToShow.length > 0 ? (
            detailsToShow.map((item) => (
              <div
                key={item.code}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <h3 className="text-lg font-medium">{item.display}</h3>
                <p className="text-sm text-gray-600">
                  <strong>CODE:</strong> {item.code}
                </p>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500">
              {t("no_concepts")}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
