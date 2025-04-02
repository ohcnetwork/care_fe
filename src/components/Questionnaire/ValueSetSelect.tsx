import { CaretSortIcon, StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandDrawer,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import useBreakpoints from "@/hooks/useBreakpoints";

import routes from "@/Utils/request/api";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { Code } from "@/types/questionnaire/code";
import valuesetRoutes from "@/types/valueset/valuesetApi";

interface Props {
  system: string;
  value?: Code | null;
  onSelect: (value: Code) => void;
  placeholder?: string;
  disabled?: boolean;
  count?: number;
  searchPostFix?: string;
  wrapTextForSmallScreen?: boolean;
  hideTrigger?: boolean;
  controlledOpen?: boolean;
}

export default function ValueSetSelect({
  system,
  value,
  onSelect,
  placeholder = "Search...",
  disabled,
  count = 10,
  searchPostFix = "",
  wrapTextForSmallScreen = false,
  hideTrigger = false,
  controlledOpen = false,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [activeTab, setActiveTab] = useState(0);
  const [isClearingFavourites, setIsClearingFavourites] = useState(false);
  const queryClient = useQueryClient();

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

  const clearFavouritesMutation = useMutation({
    mutationFn: mutate(valuesetRoutes.clearFavourites, {
      pathParams: { slug: system },
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["valueset", system, "favourites"],
      });
      setIsClearingFavourites(false);
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
    if (controlledOpen || internalOpen) {
      setSearch("");
    }
  }, [controlledOpen, internalOpen]);

  const Item = ({ option }: { option: Code }) => (
    <CommandItem
      key={option.code}
      value={option.code}
      onSelect={() => {
        onSelect({
          code: option.code,
          display: option.display || "",
          system: option.system || "",
        });
        setInternalOpen(false);
        addRecentMutation.mutate(option);
      }}
      className="cursor-pointer"
    >
      <div className="flex items-center justify-between w-full gap-4">
        <span>{option.display}</span>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            favouritesQuery.data?.find(
              (favourite) => favourite.code === option.code,
            )
              ? removeFavouriteMutation.mutate(option)
              : addFavouriteMutation.mutate(option);
          }}
          className="hover:text-primary-500 transition-all text-secondary-900"
        >
          {favouritesQuery.data?.find(
            (favourite) => favourite.code === option.code,
          ) ? (
            <StarFilledIcon />
          ) : (
            <StarIcon className="" />
          )}
        </button>
      </div>
    </CommandItem>
  );

  const content = (
    <Command filter={() => 1}>
      <CommandInput
        placeholder={t("value_set_search_placeholder")}
        className="outline-hidden border-none ring-0 shadow-none"
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList className="h-[300px] overflow-hidden">
        <Tabs
          value={activeTab.toString()}
          onValueChange={(value) => {
            setActiveTab(Number(value));
          }}
          className="md:hidden"
        >
          <TabsList className="flex">
            <TabsTrigger value={"0"}>{t("search")}</TabsTrigger>
            <TabsTrigger value={"1"}>{t("favourites")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <CommandEmpty>
          {search.length < 3
            ? t("min_char_length_error", { min_length: 3 })
            : searchQuery.isFetching
              ? t("searching")
              : t("no_results_found")}
        </CommandEmpty>
        <div className="flex">
          <div
            className={`${activeTab === 0 ? "block" : "hidden"} md:block flex-1 overflow-auto h-[300px]`}
          >
            <CommandGroup>
              {resultsWithRecents.map((option) => (
                <Item key={option.code} option={option} />
              ))}
            </CommandGroup>
          </div>

          <div
            className={`${activeTab === 1 ? "block" : "hidden"} md:block flex-1 ${(search.length < 3 && !searchQuery.isFetching) || (!favourites?.length && !resultsWithRecents.length) ? "" : "md:border-l"} border-gray-200`}
          >
            <CommandGroup>
              <div className="flex items-center justify-between">
                <span className="text-xs font-normal text-gray-700 p-1">
                  {t("favourites")}
                </span>
                {!!favourites?.length && (
                  <button>
                    <span
                      onClick={() => setIsClearingFavourites(true)}
                      className="text-xs font-thin text-gray-700 p-1 cursor-pointer"
                    >
                      {t("clear")}
                    </span>
                  </button>
                )}
              </div>
              {favouritesQuery.isFetched &&
                favouritesQuery.data?.length === 0 && (
                  <div className="flex items-center flex-col justify-center h-[200px] md:h-[250px] text-xs text-gray-500">
                    {t("no_favourites", {
                      star: "☆",
                    })}
                  </div>
                )}
              {favourites?.map((option) => (
                <Item key={option.code} option={option} />
              ))}
            </CommandGroup>
          </div>
        </div>
      </CommandList>
    </Command>
  );

  const alert = (
    <AlertDialog
      open={isClearingFavourites}
      onOpenChange={(open) => setIsClearingFavourites(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("are_you_sure_clear_favourites")}
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsClearingFavourites(false)}>
            {t("cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            className={cn(buttonVariants({ variant: "destructive" }))}
            onClick={() => {
              clearFavouritesMutation.mutate({});
            }}
          >
            {clearFavouritesMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              t("confirm")
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  if (isMobile && !hideTrigger) {
    return (
      <>
        <Button
          variant="outline"
          role="combobox"
          onClick={() => setInternalOpen(true)}
          className={cn(
            "w-full justify-between border border-primary rounded-md p-5",
            wrapTextForSmallScreen
              ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
              : "truncate",
            !value?.display && "text-gray-400",
          )}
          disabled={disabled}
        >
          <div className="flex items-center">
            <CareIcon
              icon="l-plus"
              className="mr-2 text-5xl text-primary-700 font-normal"
            />
            <span className="text-primary-700 flex items-center font-semibold text-base text-wrap">
              {value?.display || placeholder}
            </span>
          </div>
        </Button>
        <CommandDrawer open={internalOpen} onOpenChange={setInternalOpen}>
          {content}
        </CommandDrawer>
        {alert}
      </>
    );
  }

  return (
    <>
      <Popover
        open={controlledOpen || internalOpen}
        onOpenChange={setInternalOpen}
      >
        {!hideTrigger && (
          <PopoverTrigger asChild disabled={disabled}>
            <Button
              variant="outline"
              role="combobox"
              className={cn(
                "w-full justify-between",
                wrapTextForSmallScreen
                  ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                  : "truncate",
                !value?.display && "text-gray-400",
              )}
            >
              <span>{value?.display || placeholder}</span>
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
        )}

        {hideTrigger ? (
          content
        ) : (
          <PopoverContent
            className={`transition-all w-[600px] p-0`}
            align="start"
          >
            {content}
          </PopoverContent>
        )}
      </Popover>
      {alert}
    </>
  );
}
