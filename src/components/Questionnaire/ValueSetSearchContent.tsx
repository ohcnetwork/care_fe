import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useState, type Ref } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { isIOSDevice } from "@/Utils/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { ValueSetVariantChooser } from "@/components/Questionnaire/ValueSetVariantChooser";

import { useCurrentFacilitySilently } from "@/pages/Facility/utils/useCurrentFacility";
import { Code, CodeConceptMinimal, Designation } from "@/types/base/code/code";
import { Loader2 } from "lucide-react";

import { useValueSetPreferences } from "./useValueSetPreferences";
import { useValueSetSearchResults } from "./useValueSetSearchResults";

// Use codes for "fully specified name" variants that are too verbose to show as synonyms
const EXCLUDED_USE_CODES = new Set([
  "900000000000003001", // SNOMED Fully specified name
  "FullySpecifiedName", // LOINC Fully specified name
]);

function getSynonyms(option: CodeConceptMinimal): string[] {
  if (!option.designation?.length) return [];
  return option.designation
    .filter(
      (d: Designation) =>
        d.value &&
        d.value !== option.display &&
        // TO DO: If local language supported is added to loinc/snomed value set api,
        // we should switch this to use i18n.language
        (!d.language || d.language.startsWith("en")) &&
        (!d.use?.code || !EXCLUDED_USE_CODES.has(d.use.code)),
    )
    .map((d: Designation) => d.value!)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

// Score: 3 = startsWith, 2 = word boundary match, 1 = includes, 0 = no match
const score = (text: string, searchTerm: string) => {
  const t = text.toLowerCase();
  if (t.startsWith(searchTerm)) return 3;
  if (t.split(/\s+/).some((word) => word.startsWith(searchTerm))) return 2;
  if (t.includes(searchTerm)) return 1;
  return 0;
};

function getBestMatchDisplay(
  option: CodeConceptMinimal,
  search: string,
): { primary: string; secondary: string | null } {
  if (!search) return { primary: option.display, secondary: null };

  const s = search.toLowerCase();
  const canonical = option.display;
  const synonyms = getSynonyms(option);

  let bestTerm = canonical;
  let bestScore = score(canonical, s);

  for (const syn of synonyms) {
    const synScore = score(syn, s);
    if (synScore > bestScore) {
      bestScore = synScore;
      bestTerm = syn;
    }
  }

  return {
    primary: bestTerm,
    secondary: bestTerm !== canonical ? canonical : null,
  };
}

interface Props {
  system: string;
  /** Pins the lookup to one exact valueset, bypassing slug resolution. */
  valuesetId?: string;
  onSelect: (value: Code) => void;
  count?: number;
  searchPostFix?: string;
  showCode?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  title?: string;
  placeholder?: string;
  inputRef?: Ref<HTMLInputElement>;
}

interface ItemProps {
  option: CodeConceptMinimal;
  isFavourite: boolean;
  onFavourite: () => void;
  disableFavourite?: boolean;
  onSelect: () => void;
  showCode: boolean;
  search: string;
}

const Item = ({
  option,
  onFavourite,
  disableFavourite = false,
  onSelect,
  isFavourite,
  showCode,
  search,
}: ItemProps) => {
  const { t } = useTranslation();
  const { primary, secondary } = getBestMatchDisplay(option, search);

  return (
    <CommandItem
      key={option.code}
      value={`${option.display} ${option.code}`}
      onSelect={onSelect}
      className="cursor-pointer"
    >
      <div className="flex items-center justify-between w-full gap-4">
        <div className="flex flex-col">
          <span>
            {primary} {showCode && `(${option.code})`}
          </span>
          {secondary && (
            <span className="text-xs text-gray-500">{secondary}</span>
          )}
        </div>

        <button
          type="button"
          aria-label={t(
            isFavourite ? "remove_from_favorites" : "add_to_favorites",
          )}
          disabled={disableFavourite}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavourite();
          }}
          className="hover:text-primary-500 transition-colors text-secondary-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isFavourite ? <StarFilledIcon /> : <StarIcon />}
        </button>
      </div>
    </CommandItem>
  );
};

export default function ValueSetSearchContent({
  system,
  valuesetId: pinnedValuesetId,
  onSelect,
  count = 10,
  searchPostFix = "",
  showCode = false,
  search,
  onSearchChange,
  placeholder,
  title,
  inputRef,
}: Props) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(0);

  // Outside a facility route this is undefined, and the backend falls back to
  // instance-level valuesets.
  const { facilityId } = useCurrentFacilitySilently();

  const { searchQuery, resolveQuery, valuesetId } = useValueSetSearchResults({
    system,
    pinnedValuesetId,
    facilityId,
    count,
    search,
    searchPostFix,
  });

  const {
    favouritesQuery,
    recentsQuery,
    addFavouriteMutation,
    removeFavouriteMutation,
    clearFavouritesMutation,
    addRecentMutation,
    canMutatePreferences,
    itemToRemove,
    setItemToRemove,
    showBulkClearConfirm,
    setShowBulkClearConfirm,
  } = useValueSetPreferences({
    system,
    pinnedValuesetId,
    facilityId,
    valuesetId,
  });

  const seenCodes = new Set<string>();
  const searchResults = searchQuery.data?.results || [];
  const searchLower = search.toLowerCase();
  const recents =
    search.length >= 3
      ? (recentsQuery.data || []).filter(
          (r) =>
            r.display?.toLowerCase().includes(searchLower) ||
            r.code?.toLowerCase().includes(searchLower),
        )
      : recentsQuery.data || [];
  const resultsWithRecents = [...recents, ...searchResults].filter((item) => {
    if (seenCodes.has(item.code)) return false;
    seenCodes.add(item.code);
    return true;
  });
  // Filter favourites based on search
  const favourites = favouritesQuery.data?.filter((favourite) =>
    favourite.display?.toLowerCase().includes(searchLower),
  );

  const favouriteCodes = new Set(favouritesQuery.data?.map(({ code }) => code));
  const handleFavourite = (option: CodeConceptMinimal) => {
    if (!canMutatePreferences) return;
    if (favouriteCodes.has(option.code)) setItemToRemove(option);
    else addFavouriteMutation.mutate(option);
  };
  const handleSelect = (option: CodeConceptMinimal, matchSearch: boolean) => {
    const display = matchSearch
      ? getBestMatchDisplay(option, search).primary
      : option.display;
    onSelect({
      code: option.code,
      display: display || option.display || "",
      system: option.system || "",
    });
    if (canMutatePreferences) addRecentMutation.mutate(option);
  };

  return (
    <Command filter={() => 1}>
      <div className="p-3 border-b border-gray-200 flex justify-between items-center md:hidden">
        {title && <h3 className="text-base font-semibold">{title}</h3>}
        <Tabs
          value={activeTab.toString()}
          onValueChange={(value) => {
            setActiveTab(Number(value));
          }}
          className="md:hidden"
        >
          <TabsList className="flex w-full">
            <TabsTrigger value={"0"} className="flex-1">
              {t("search")}
            </TabsTrigger>
            <TabsTrigger value={"1"} className="flex-1">
              {t("starred")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="border-b border-gray-200">
        <CommandInput
          ref={inputRef}
          placeholder={placeholder}
          className="outline-hidden border-none ring-0 shadow-none text-base sm:text-sm"
          onValueChange={onSearchChange}
          value={search}
          autoFocus={!isIOSDevice}
        />
      </div>
      <CommandList className="overflow-y-auto max-h-[55dvh] md:max-h-[35dvh] lg:max-h-[40dvh]">
        {!searchQuery.isFetching && (
          <CommandEmpty>
            {search.length < 3 ? (
              <p className="p-4 text-sm text-gray-500">
                {t("min_char_length_error", { min_length: 3 })}
              </p>
            ) : (
              <p className="p-4 text-sm text-gray-500">
                {t("no_results_found")}
              </p>
            )}
          </CommandEmpty>
        )}
        <div className="flex">
          <div
            data-testid="valueset-search-results"
            className={cn(
              activeTab === 0 ? "block" : "hidden",
              "md:block flex-1",
            )}
          >
            {searchQuery.isFetching ? (
              <div className="h-72 flex justify-center items-center py-6 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                {t("searching")}
              </div>
            ) : (
              <CommandGroup>
                {resultsWithRecents.map((option) => (
                  <Item
                    key={option.code}
                    option={option}
                    showCode={showCode}
                    search={search}
                    onSelect={() => handleSelect(option, true)}
                    disableFavourite={!canMutatePreferences}
                    onFavourite={() => handleFavourite(option)}
                    isFavourite={favouriteCodes.has(option.code)}
                  />
                ))}
              </CommandGroup>
            )}
          </div>

          <div
            data-testid="valueset-starred"
            className={cn(
              activeTab === 1 ? "block" : "hidden",
              "md:block flex-1",
              (search.length < 3 && !searchQuery.isFetching) ||
                (!favourites?.length && !resultsWithRecents.length)
                ? ""
                : "md:border-l",
              "border-gray-200",
            )}
          >
            <CommandGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-gray-700 p-1">
                  {t("starred")}
                </span>
                {favouritesQuery.data && favouritesQuery.data.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!canMutatePreferences}
                    onClick={() => setShowBulkClearConfirm(true)}
                    className="h-6 px-1 text-xs text-gray-500 hover:text-gray-700"
                  >
                    {t("clear")}
                  </Button>
                )}
              </div>
              {favouritesQuery.isFetched &&
                favouritesQuery.data?.length === 0 && (
                  <div className="flex items-center flex-col justify-center max-h-[30vh] md:max-h-[35vh] text-xs text-gray-500">
                    {t("no_starred", {
                      star: "☆",
                    })}
                  </div>
                )}
              {favourites?.map((option) => (
                <Item
                  key={option.code}
                  option={option}
                  showCode={showCode}
                  search={search}
                  onSelect={() => handleSelect(option, false)}
                  disableFavourite={!canMutatePreferences}
                  onFavourite={() => handleFavourite(option)}
                  isFavourite={favouriteCodes.has(option.code)}
                />
              ))}
            </CommandGroup>
          </div>
        </div>
      </CommandList>

      {/* Slug-addressed pickers inside a facility may have more than one
          candidate set (the instance one, a facility override); the user's
          pick is saved server-side and applies to every read of the slug. */}
      {!pinnedValuesetId && facilityId && system && (
        <ValueSetVariantChooser
          slug={system}
          facilityId={facilityId}
          current={resolveQuery.data?.valueset}
        />
      )}

      {/* Individual Item Removal Confirmation */}
      <ConfirmActionDialog
        open={!!itemToRemove && !showBulkClearConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setItemToRemove(null);
          }
        }}
        title={t("are_you_sure")}
        description={t("are_you_sure_want_to_clear_favourite", {
          name: itemToRemove?.display,
        })}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        variant="destructive"
        disabled={removeFavouriteMutation.isPending}
        onConfirm={() => {
          if (itemToRemove) {
            removeFavouriteMutation.mutate(itemToRemove);
          }
        }}
      />

      {/* Bulk Clear Confirmation */}
      <ConfirmActionDialog
        open={showBulkClearConfirm && !itemToRemove}
        onOpenChange={(open) => {
          if (!open) {
            setShowBulkClearConfirm(false);
          }
        }}
        title={t("are_you_sure")}
        description={t("are_you_sure_clear_starred")}
        confirmText={t("confirm")}
        cancelText={t("cancel")}
        variant="destructive"
        disabled={clearFavouritesMutation.isPending}
        onConfirm={() => {
          clearFavouritesMutation.mutate();
        }}
      />
    </Command>
  );
}
