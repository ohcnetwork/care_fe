import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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
import valueSetApi from "@/types/valueSet/valueSetApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Loader2 } from "lucide-react";

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
          disabled={disableFavourite}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFavourite();
          }}
          className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
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
}: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(0);
  const [itemToRemove, setItemToRemove] = useState<CodeConceptMinimal | null>(
    null,
  );
  const [showBulkClearConfirm, setShowBulkClearConfirm] = useState(false);

  // Outside a facility route this is undefined, and the backend falls back to
  // instance-level valuesets.
  const { facilityId } = useCurrentFacilitySilently();

  const pinnedSearchQuery = useQuery({
    queryKey: ["valueset", pinnedValuesetId, "expand", count, search],
    queryFn: query.debounced(valueSetApi.expand, {
      pathParams: { id: pinnedValuesetId ?? "" },
      body: {
        count,
        search: search + searchPostFix,
      },
    }),
    enabled: !!pinnedValuesetId,
  });

  const slugSearchQuery = useQuery({
    queryKey: ["valueset", system, facilityId, "expand_slug", count, search],
    queryFn: query.debounced(valueSetApi.expandSlug, {
      body: {
        slug: system,
        facility: facilityId,
        count,
        search: search + searchPostFix,
      },
    }),
    enabled: !pinnedValuesetId && !!system,
  });

  const searchQuery = pinnedValuesetId ? pinnedSearchQuery : slugSearchQuery;

  // The slug -> valueset mapping does not vary with the search term, so it is
  // resolved on its own key. Deriving it from slugSearchQuery would drop it on
  // every keystroke, and the write endpoints are still id-keyed.
  const resolveQuery = useQuery({
    queryKey: ["valueset", "resolve", system, facilityId],
    queryFn: query(valueSetApi.expandSlug, {
      body: { slug: system, facility: facilityId, search: "", count: 1 },
      silent: true,
    }),
    enabled: !pinnedValuesetId && !!system,
    staleTime: Infinity,
  });

  const valuesetId = pinnedValuesetId ?? resolveQuery.data?.valueset.id;

  // Keyed by whichever identifier addressed the read, so a pinned picker and a
  // slug picker of the same valueset hold separate entries.
  const favouritesKey = [
    "valueset",
    pinnedValuesetId ?? system,
    facilityId,
    "favourites",
  ];
  const recentsKey = [
    "valueset",
    pinnedValuesetId ?? system,
    facilityId,
    "recents",
  ];

  const favouritesQuery = useQuery({
    queryKey: favouritesKey,
    queryFn: pinnedValuesetId
      ? query(valueSetApi.favourites, {
          pathParams: { id: pinnedValuesetId },
        })
      : query(valueSetApi.favouritesBySlug, {
          queryParams: { slug: system, facility: facilityId },
          // An unresolvable slug already surfaces through the search request.
          silent: true,
        }),
    enabled: !!pinnedValuesetId || !!system,
  });

  const addFavouriteMutation = useMutation({
    mutationFn: mutate(valueSetApi.addFavourite, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
    },
  });

  const removeFavouriteMutation = useMutation({
    mutationFn: mutate(valueSetApi.removeFavourite, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
      setItemToRemove(null);
    },
    onError: () => {
      setItemToRemove(null);
    },
  });

  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valueSetApi.clearFavourites, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: favouritesKey });
      setShowBulkClearConfirm(false);
    },
    onError: () => {
      setShowBulkClearConfirm(false);
    },
  });

  const recentsQuery = useQuery({
    queryKey: recentsKey,
    queryFn: pinnedValuesetId
      ? query(valueSetApi.recentViews, {
          pathParams: { id: pinnedValuesetId },
        })
      : query(valueSetApi.recentViewsBySlug, {
          queryParams: { slug: system, facility: facilityId },
          silent: true,
        }),
    enabled: !!pinnedValuesetId || !!system,
  });

  const addRecentMutation = useMutation({
    mutationFn: mutate(valueSetApi.addRecentView, {
      pathParams: { id: valuesetId ?? "" },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recentsKey });
    },
  });

  // The starred column renders before the slug resolves, so every id-keyed
  // write has to be held back until there is an id to address.
  const canMutatePreferences = !!valuesetId;

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
                    onSelect={() => {
                      const { primary } = getBestMatchDisplay(option, search);
                      onSelect({
                        code: option.code,
                        display: primary || option.display || "",
                        system: option.system || "",
                      });
                      if (canMutatePreferences) {
                        addRecentMutation.mutate(option);
                      }
                    }}
                    disableFavourite={!canMutatePreferences}
                    onFavourite={() => {
                      const isFavorited = favouritesQuery.data?.find(
                        (favourite) => favourite.code === option.code,
                      );
                      if (isFavorited) {
                        setItemToRemove(option);
                      } else {
                        addFavouriteMutation.mutate(option);
                      }
                    }}
                    isFavourite={
                      !!favouritesQuery.data?.find(
                        (favourite) => favourite.code === option.code,
                      )
                    }
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
                  onSelect={() => {
                    onSelect({
                      code: option.code,
                      display: option.display || "",
                      system: option.system || "",
                    });
                    if (canMutatePreferences) {
                      addRecentMutation.mutate(option);
                    }
                  }}
                  disableFavourite={!canMutatePreferences}
                  onFavourite={() => {
                    const isFavorited = favouritesQuery.data?.find(
                      (favourite) => favourite.code === option.code,
                    );
                    if (isFavorited) {
                      setItemToRemove(option);
                    } else {
                      addFavouriteMutation.mutate(option);
                    }
                  }}
                  isFavourite={
                    !!favouritesQuery.data?.find(
                      (favourite) => favourite.code === option.code,
                    )
                  }
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
