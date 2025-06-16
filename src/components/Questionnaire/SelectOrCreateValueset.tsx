import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";

import query from "@/Utils/request/query";
import { PaginatedResponse } from "@/Utils/request/types";
import { mergeAutocompleteOptions } from "@/Utils/utils";
import { ValuesetBase } from "@/types/valueset/valueset";
import valuesetApi from "@/types/valueset/valuesetApi";

interface CreateValueSetProps {
  onValueSetChange?: (valueSet: string) => void;
  value?: string;
}

export function SelectOrCreateValueset({
  onValueSetChange,
  value,
}: CreateValueSetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentValueSet, setCurrentValueSet] = useState<ValuesetBase>();
  const [searchQuery, setSearchQuery] = useState("");

  const handleValueSetChange = (val: string) => {
    onValueSetChange?.(val);
  };

  const { data: valuesets, isFetching: isFetchingValuesets } = useQuery({
    queryKey: ["valuesets", searchQuery],
    queryFn: query.debounced(valuesetApi.list, {
      queryParams: {
        name: searchQuery,
        status: "active",
      },
    }),
    select: (data: PaginatedResponse<ValuesetBase>) => data.results,
  });

  const { data: slugObj, isLoading: isLoadingSlug } = useQuery({
    queryKey: ["valueset", value],
    queryFn: query(valuesetApi.get, {
      pathParams: { slug: value! },
    }),
    enabled: !!value,
  });

  useEffect(() => {
    slugObj && setCurrentValueSet(slugObj);
  }, [slugObj]);

  const valueSetOptions =
    valuesets?.map((vs) => ({
      label: vs.name,
      value: vs.slug,
    })) || [];

  return (
    <div className="flex items-center gap-2 flex-col sm:flex-row">
      <div className="w-full">
        <Autocomplete
          options={mergeAutocompleteOptions(
            valueSetOptions,
            currentValueSet
              ? {
                  label: currentValueSet.name,
                  value: currentValueSet.slug,
                }
              : undefined,
          )}
          value={value ?? ""}
          onChange={handleValueSetChange}
          onSearch={setSearchQuery}
          placeholder={t("select_a_value_set")}
          isLoading={isFetchingValuesets || isLoadingSlug}
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
              handleValueSetChange(data.slug);
              setCurrentValueSet(data);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
