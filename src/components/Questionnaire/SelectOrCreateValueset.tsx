import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";

import {
  ValueSetConfig,
  ValueSetRead,
  ValueSetStatus,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { mergeAutocompleteOptions } from "@/Utils/utils";

interface CreateValueSetProps {
  onValueSetChange?: (valueSet: ValueSetConfig) => void;
  value?: ValueSetConfig;
}

export function SelectOrCreateValueset({
  onValueSetChange,
  value,
}: CreateValueSetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentValueSet, setCurrentValueSet] = useState<ValueSetRead>();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: valuesets, isFetching: isFetchingValuesets } = useQuery({
    queryKey: ["valuesets", searchQuery],
    queryFn: query.debounced(valueSetApi.list, {
      queryParams: {
        name: searchQuery,
        status: ValueSetStatus.ACTIVE,
      },
    }),
    select: (data: PaginatedResponse<ValueSetRead>) => data.results,
  });

  // An imported questionnaire may reference a valueset by slug alone, and
  // expand_slug is the only endpoint that maps one back to its valueset.
  const { data: valuesetById, isLoading: isLoadingById } = useQuery({
    queryKey: ["valueset", value?.external_id],
    queryFn: query(valueSetApi.get, {
      pathParams: { id: value?.external_id ?? "" },
    }),
    enabled: !!value?.external_id,
  });

  const { data: valuesetBySlug, isLoading: isLoadingBySlug } = useQuery({
    queryKey: ["valueset", "by-slug", value?.slug],
    queryFn: query(valueSetApi.expandSlug, {
      body: { slug: value?.slug ?? "", search: "", count: 1 },
    }),
    enabled: !value?.external_id && !!value?.slug,
  });

  const isLoadingCurrent = isLoadingById || isLoadingBySlug;

  useEffect(() => {
    const resolved = valuesetById ?? valuesetBySlug?.valueset;
    resolved && setCurrentValueSet(resolved);
  }, [valuesetById, valuesetBySlug]);

  const valueSetOptions =
    valuesets?.map((vs) => ({
      label: vs.name,
      value: vs.id,
    })) || [];

  const handleValueSetChange = (selectedId: string) => {
    const selected =
      valuesets?.find((vs) => vs.id === selectedId) ??
      (currentValueSet?.id === selectedId ? currentValueSet : undefined);
    if (!selected) {
      return;
    }
    // Send both: the id pins the exact valueset, the slug stays readable.
    onValueSetChange?.({ slug: selected.slug, external_id: selected.id });
  };

  return (
    <div className="flex items-center gap-2 flex-col sm:flex-row">
      <div className="w-full">
        <Autocomplete
          options={mergeAutocompleteOptions(
            valueSetOptions,
            currentValueSet
              ? {
                  label: currentValueSet.name,
                  value: currentValueSet.id,
                }
              : undefined,
          )}
          value={value?.external_id ?? currentValueSet?.id ?? ""}
          onChange={handleValueSetChange}
          onSearch={setSearchQuery}
          placeholder={t("select_a_value_set")}
          isLoading={isFetchingValuesets || isLoadingCurrent}
          noOptionsMessage={t("no_valuesets_found")}
        />
      </div>
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2 w-full sm:w-auto">
            <CareIcon icon="l-plus" />
            {t("create_valueset")}
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:max-w-2xl overflow-y-auto"
        >
          <ValueSetEditor
            onSuccess={(data) => {
              setIsSheetOpen(false);
              setCurrentValueSet(data);
              onValueSetChange?.({ slug: data.slug, external_id: data.id });
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
