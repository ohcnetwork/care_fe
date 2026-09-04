import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { useEffect, useState } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import {
  scopedOptionLabel,
  useScopedValueSets,
} from "@/components/ValueSet/useScopedValueSets";
import { ValueSetEditor } from "@/components/ValueSet/ValueSetEditor";

import {
  INSTANCE_VALUESET_SCOPE,
  ValueSetConfig,
  ValueSetRead,
  ValueSetScope,
  valueSetBinding,
} from "@/types/valueSet/valueSet";
import valueSetApi from "@/types/valueSet/valueSetApi";
import query from "@/Utils/request/query";
import { mergeAutocompleteOptions } from "@/Utils/utils";

interface CreateValueSetProps {
  onValueSetChange?: (valueSet: ValueSetConfig) => void;
  value?: ValueSetConfig;
  /** Where the host is mounted. Inside a facility the picker lists that
   *  facility's sets alongside the instance ones, and the inline "Create
   *  value set" sheet files under the facility — only superusers may
   *  create instance-context sets. */
  scope?: ValueSetScope;
}

export function SelectOrCreateValueset({
  onValueSetChange,
  value,
  scope = INSTANCE_VALUESET_SCOPE,
}: CreateValueSetProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [currentValueSet, setCurrentValueSet] = useState<ValueSetRead>();
  const [searchQuery, setSearchQuery] = useState("");

  const { options, isFetching: isFetchingValuesets } = useScopedValueSets({
    facilityId: scope.facilityId,
    search: searchQuery,
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

  // Slug-only references are instance-level by contract (see
  // valueSetBinding), so this resolves without a facility on purpose.
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

  // The scope suffix is only meaningful where the two lists are merged —
  // an instance set and a facility override of it usually share a name.
  const valueSetOptions = options.map((option) => ({
    label:
      scope.authContext === "facility"
        ? scopedOptionLabel(option, t)
        : option.valueset.name,
    value: option.valueset.id,
  }));

  const handleValueSetChange = (selectedId: string) => {
    const selected = options.find(
      (option) => option.valueset.id === selectedId,
    );
    if (selected) {
      // Show the pick immediately. An instance set is stored by slug alone,
      // so `value.external_id` is empty and the trigger would otherwise keep
      // displaying the previous set until expand_slug resolves.
      setCurrentValueSet(selected.valueset);
      onValueSetChange?.(
        valueSetBinding(selected.valueset, selected.authContext),
      );
      return;
    }
    // Re-picking the current (merged-in) entry keeps the stored reference
    // as is — its binding was decided when it was first chosen.
    if (currentValueSet?.id === selectedId && value) {
      onValueSetChange?.(value);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-col sm:flex-row">
        <div className="w-full">
          <Autocomplete
            options={mergeAutocompleteOptions(
              valueSetOptions,
              // No scope suffix: a set resolved from the stored reference
              // carries no auth_context, and guessing from `external_id`
              // mislabels instance sets that older questionnaires pinned.
              currentValueSet
                ? { label: currentValueSet.name, value: currentValueSet.id }
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
              scope={scope}
              onSuccess={(data) => {
                setIsSheetOpen(false);
                setCurrentValueSet(data);
                onValueSetChange?.(valueSetBinding(data, scope.authContext));
              }}
            />
          </SheetContent>
        </Sheet>
      </div>
      {scope.authContext === "facility" && (
        <p className="text-xs text-gray-500">{t("valueset_binding_hint")}</p>
      )}
    </div>
  );
}
