import { StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Code } from "@/types/base/code/code";
import valuesetRoutes from "@/types/valueset/valuesetApi";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState(0);

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
  const resultsWithRecents = [
    ...(recentsQuery.data?.filter((recent) =>
      recent.display?.toLowerCase().includes(search.toLowerCase()),
    ) || []),
    ...(searchQuery.data?.results?.filter(
      (r) => !recentsQuery.data?.find((recent) => recent.code === r.code),
    ) || []),
  ];

  // Filter favourites based on search
  const favourites = favouritesQuery.data?.filter((favourite) =>
    favourite.display?.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Command filter={() => 1} className="rounded-t-3xl">
      <div className="py-3 px-3 border-b border-gray-200 flex justify-between items-center">
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
      <CommandInput
        ref={inputRef}
        placeholder={placeholder}
        className="outline-hidden border-none ring-0 shadow-none"
        onValueChange={onSearchChange}
        value={search}
        autoFocus
      />
      <CommandList className="h-75 overflow-hidden">
        <CommandEmpty>
          {search.length < 3 ? (
            <p className="p-4 text-sm text-gray-500">
              {t("min_char_length_error", { min_length: 3 })}
            </p>
          ) : searchQuery.isFetching ? (
            <p className="p-4 text-sm text-gray-500">{t("searching")}</p>
          ) : (
            <p className="p-4 text-sm text-gray-500">{t("no_results_found")}</p>
          )}
        </CommandEmpty>
        <div className="flex">
          <div
            className={cn(
              activeTab === 0 ? "block" : "hidden",
              "md:block flex-1 overflow-auto h-[300px]",
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
                    favouritesQuery.data?.find(
                      (favourite) => favourite.code === option.code,
                    )
                      ? removeFavouriteMutation.mutate(option)
                      : addFavouriteMutation.mutate(option);
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
              </div>
              {favouritesQuery.isFetched &&
                favouritesQuery.data?.length === 0 && (
                  <div className="flex items-center flex-col justify-center h-[200px] md:h-[250px] text-xs text-gray-500">
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
                    favouritesQuery.data?.find(
                      (favourite) => favourite.code === option.code,
                    )
                      ? removeFavouriteMutation.mutate(option)
                      : addFavouriteMutation.mutate(option);
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
    </Command>
  );
}
