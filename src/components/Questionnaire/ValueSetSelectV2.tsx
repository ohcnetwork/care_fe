import { CaretSortIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { ItemSelector, SelectOption } from "@/components/Common/ItemSelector";

import useBreakpoints from "@/hooks/useBreakpoints";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import valuesetRoutes from "@/types/valueset/valuesetApi";

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
  showCode?: boolean;
  title?: string;
  closeOnSelect?: boolean;
}

export default function ValueSetSelectV2({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  disabled,
  count = 10,
  searchPostFix = "",
  hideTrigger = false,
  controlledOpen = false,
  closeOnSelect = true,
  showCode = false,
  title,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const queryClient = useQueryClient();

  // Fetch value set options
  const searchQuery = useQuery({
    queryKey: ["valueset", system, "expand", count, search],
    queryFn: query.debounced(routes.valueset.expand, {
      pathParams: { system },
      body: { count, search: search + searchPostFix },
    }),
  });

  // Fetch favorites
  const favouritesQuery = useQuery({
    queryKey: ["valueset", system, "favourites"],
    queryFn: query(valuesetRoutes.favourites, { pathParams: { slug: system } }),
  });

  // Add item to favorites
  const addFavouriteMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.addFavourite, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
    },
  });

  // Remove item from favorites
  const removeFavouriteMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.removeFavourite, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
    },
  });

  // Clear all favorites
  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.clearFavourites, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
    },
  });

  // Add to recent views
  const addRecentMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.addRecentView, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "recents"],
      });
    },
  });

  // Reset search on open/close
  useEffect(() => {
    if (controlledOpen || internalOpen) {
      setSearch("");
    }
  }, [controlledOpen, internalOpen]);

  // Convert Code objects to SelectOptions
  const codeToSelectOption = (code: Code): SelectOption<Code> => ({
    label: showCode ? `${code.display} (${code.code})` : code.display || "",
    value: code.code,
    data: code,
  });

  // Get options from search results
  const options = (searchQuery.data?.results || []).map(codeToSelectOption);

  // Get favorite options
  const favoriteOptions = (favouritesQuery.data || []).map(codeToSelectOption);

  // Handle toggling favorites
  const handleToggleFavorite = (option: SelectOption<Code>) => {
    const code = option.data;
    if (!code) return;

    const isFavorited = favouritesQuery.data?.find(
      (favourite) => favourite.code === code.code,
    );

    if (isFavorited) {
      removeFavouriteMutation.mutate(code);
    } else {
      addFavouriteMutation.mutate(code);
    }
  };

  // Handle clearing all favorites
  const handleClearAllFavorites = () => {
    clearFavouritesMutation.mutate({});
  };

  // Handle selection
  const handleSelect = (selectedValue: string | string[] | null) => {
    if (!selectedValue || Array.isArray(selectedValue)) return;

    const selectedOption = [...options, ...favoriteOptions].find(
      (option) => option.value === selectedValue,
    );

    if (selectedOption?.data) {
      const cleanedCode: Code = {
        code: selectedOption.data.code,
        system: selectedOption.data.system,
        display: selectedOption.data.display,
      };

      onSelect(cleanedCode);
      addRecentMutation.mutate(cleanedCode);
    }
  };

  return (
    <ItemSelector
      value={value?.code || null}
      onChange={handleSelect}
      options={options}
      favoriteItems={favoriteOptions}
      enableFavorites={true}
      showTabs={isMobile}
      useSideBySide={!isMobile}
      title={title}
      placeholder={placeholder}
      searchPlaceholder="Search..."
      noResultsMessage="No results found"
      loading={searchQuery.isFetching}
      disabled={disabled}
      closeOnSelect={closeOnSelect}
      clearable={false}
      onToggleFavorite={handleToggleFavorite}
      noFavoritesMessage="No starred items"
      onClearAllFavorites={handleClearAllFavorites}
      onSearch={setSearch}
      popoverClassName="min-w-[400px] w-full md:max-w-[600px]"
      className={cn(
        isMobile ? "border border-primary rounded-md px-2" : undefined,
      )}
      open={controlledOpen || internalOpen}
      onOpenChange={setInternalOpen}
      hideTrigger={hideTrigger}
      renderSelection={
        value && !hideTrigger
          ? () => (
              <span className="flex items-center">
                {value.display}
                {showCode && (
                  <span className="text-xs ml-1">({value.code})</span>
                )}
              </span>
            )
          : undefined
      }
      mobileTrigger={
        isMobile ? (
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between border border-primary rounded-md px-2 h-auto whitespace-normal text-left",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
            onClick={() => setInternalOpen(true)}
          >
            <div className="flex items-center">
              <CareIcon
                icon="l-plus"
                className="mr-2 text-primary-700 font-normal"
              />
              <span className="text-primary-700 flex items-center font-semibold text-wrap text-sm md:text-base">
                {value?.display || placeholder}
                {value?.display && showCode && (
                  <span className="text-xs ml-1">({value?.code})</span>
                )}
              </span>
            </div>
          </Button>
        ) : undefined
      }
      triggerButton={
        !isMobile && !hideTrigger ? (
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "justify-between  text-wrap",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {value?.display || placeholder}
              {value?.display && showCode && (
                <span className="text-xs ml-1">({value?.code})</span>
              )}
            </span>
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        ) : undefined
      }
    />
  );
}
