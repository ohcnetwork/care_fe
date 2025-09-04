import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
        <div className="px-1 mt-6">
          <Autocomplete
            options={mergeAutocompleteOptions(
              searchQuery?.results?.map((option) => ({
                label: option.display || "",
                value: option.code,
              })) ?? [],
            )}
            value={search}
            onChange={setSearch}
            onSearch={setSearch}
            placeholder={t("search_concept")}
            noOptionsMessage={
              searchQuery && !isFetching
                ? t("no_results_found")
                : t("searching")
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
