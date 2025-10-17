import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { isAppleDevice } from "@/Utils/utils";

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

import { Code } from "@/types/base/code/code";
import valuesetRoutes from "@/types/valueset/valuesetApi";
import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Loader2 } from "lucide-react";

interface Props {
  system: string;
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
  option: Code;
  isFavourite: boolean;
  onFavourite: () => void;
  onSelect: () => void;
  showCode: boolean;
}

const Item = ({
  option,
  onFavourite,
  onSelect,
  isFavourite,
  showCode,
}: ItemProps) => (
  <CommandItem
    key={option.code}
    value={option.code}
    onSelect={onSelect}
    className="cursor-pointer"
  >
    <div className="flex items-center justify-between w-full gap-4">
      <span>
        {option.display} {showCode && `(${option.code})`}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onFavourite();
        }}
        className="hover:text-primary-500 transition-all text-secondary-900 cursor-pointer"
      >
        {isFavourite ? <StarFilledIcon /> : <StarIcon className="" />}
      </button>
    </div>
  </CommandItem>
);

export default function ValueSetSearchContent({
  system,
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
  const [itemToRemove, setItemToRemove] = useState<Code | null>(null);
  const [showBulkClearConfirm, setShowBulkClearConfirm] = useState(false);

  const searchQuery = useQuery({
    queryKey: ["valueset", system, "expand", count, search],
    queryFn: query.debounced(routes.valueset.expand, {
      pathParams: { system },
      body: { count, search: search + searchPostFix },
    }),
  });

  const favouritesQuery = useQuery({
    queryKey: ["valueset", system, "favourites"],
    queryFn: query(valuesetRoutes.favourites, { pathParams: { slug: system } }),
  });

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

  const removeFavouriteMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.removeFavourite, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
      setItemToRemove(null);
    },
    onError: () => {
      setItemToRemove(null);
    },
  });

  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.clearFavourites, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
      setShowBulkClearConfirm(false);
    },
    onError: () => {
      setShowBulkClearConfirm(false);
    },
  });

  const recentsQuery = useQuery({
    queryKey: ["valueset", system, "recents"],
    queryFn: query(valuesetRoutes.recentViews, {
      pathParams: { slug: system },
    }),
  });

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

  // Combine recents and search results, but only show each result once
  const filteredRecents =
    search.length < 3
      ? recentsQuery.data || []
      : recentsQuery.data?.filter(
          (recent) =>
            recent.display?.toLowerCase().includes(search.toLowerCase()) ||
            recent.code?.toLowerCase().includes(search.toLowerCase()),
        ) || [];

  const resultsWithRecents = [
    ...filteredRecents,
    ...(searchQuery.data?.results?.filter(
      (r) => !filteredRecents.find((recent) => recent.code === r.code),
    ) || []),
  ];
  // Filter favourites based on search
  const favourites = favouritesQuery.data?.filter((favourite) =>
    favourite.display?.toLowerCase().includes(search.toLowerCase()),
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
          autoFocus={!isAppleDevice}
        />
      </div>
      {searchQuery.isFetching ? (
        <div className="h-72 flex justify-center items-center py-6 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          {t("searching")}
        </div>
      ) : (
        <CommandList className="overflow-y-auto max-h-[55dvh] md:max-h-[35dvh] lg:max-h-[40dvh]">
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
          <div className="flex">
            <div
              className={cn(
                activeTab === 0 ? "block" : "hidden",
                "md:block flex-1",
              )}
            >
              <CommandGroup>
                {resultsWithRecents.map((option) => (
                  <Item
                    key={option.code}
                    option={option}
                    showCode={showCode}
                    onSelect={() => {
                      onSelect({
                        code: option.code,
                        display: option.display || "",
                        system: option.system || "",
                      });
                      addRecentMutation.mutate(option);
                    }}
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

            <div
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
                    onSelect={() => {
                      onSelect({
                        code: option.code,
                        display: option.display || "",
                        system: option.system || "",
                      });
                      addRecentMutation.mutate(option);
                    }}
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
          clearFavouritesMutation.mutate({});
        }}
      />
    </Command>
  );
}
