import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
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
  const [, setSelectedConcept] = useState<any | null>(null);

  const { data: searchQuery, isFetching } = useQuery({
    queryKey: ["valueset", "preview_all", valueset.compose],
    queryFn: query(valuesetApi.preview_search, {
      queryParams: { count: 1000 },
      body: {
        ...valueset,
        name: valueset.name,
        ...(valueset.slug?.match(/^[-\w]+$/) ? { slug: valueset.slug } : {}),
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

  // 🔍 Frontend filtering of full result list
  const filteredResults = useMemo(() => {
    if (!searchQuery?.results) return [];
    const lower = search.toLowerCase();
    return searchQuery.results.filter(
      (item) =>
        item.code?.toLowerCase().includes(lower) ||
        item.display?.toLowerCase().includes(lower) ||
        item.system?.toLowerCase().includes(lower),
    );
  }, [search, searchQuery]);

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
            filteredResults.map((option) => ({
              label: option.display || "",
              value: option.code,
            })),
          )}
          value={search}
          onChange={(value) => {
            setSearch(value);
            const match = filteredResults.find((opt) => opt.code === value);
            if (match) {
              setSelectedConcept(match);
            }
          }}
          onSearch={setSearch}
          placeholder={t("search_concept")}
          noOptionsMessage={
            searchQuery && !isFetching ? t("no_results_found") : t("searching")
          }
          className="px-1 mt-6"
        />

        {/* Full list rendered */}
        <div className="mt-4 px-1 text-sm text-gray-700 border-t pt-2 space-y-2">
          {filteredResults.map((item) => (
            <div key={item.code} className="border-b pb-2">
              <p>
                <strong>Code:</strong> {item.code}
              </p>
              <p>
                <strong>Display:</strong> {item.display}
              </p>
              {item.system && (
                <p>
                  <strong>System:</strong> {item.system}
                </p>
              )}
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
