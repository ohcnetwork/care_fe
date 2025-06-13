import { t } from "i18next";
import { useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";

import { mergeAutocompleteOptions } from "@/Utils/utils";

interface CreateValueSetProps {
  valuesets: {
    label: string;
    value: string;
  }[];
  onValueSetChange?: (valueSet: string) => void;
  onSearch: (query: string) => void;
  isLoading?: boolean;
  selectedValueSet?: {
    id: string;
    display: string;
  };
}

export function CreateValueSet({
  valuesets = [],
  onValueSetChange,
  onSearch,
  isLoading = false,
  selectedValueSet,
}: CreateValueSetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentValueSet, setCurrentValueSet] = useState<string | undefined>();

  const handleValueSetChange = (val: string) => {
    setCurrentValueSet(val);
    if (onValueSetChange) {
      onValueSetChange(val);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-col sm:flex-row">
      <div className="w-full">
        <Autocomplete
          options={mergeAutocompleteOptions(
            valuesets,
            selectedValueSet
              ? {
                  label: selectedValueSet.display,
                  value: selectedValueSet.id,
                }
              : undefined,
          )}
          value={currentValueSet || ""}
          onChange={handleValueSetChange}
          onSearch={onSearch}
          placeholder={t("select_a_value_set")}
          isLoading={isLoading}
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
              handleValueSetChange(data.name);
            }}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
