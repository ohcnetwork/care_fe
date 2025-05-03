import { CaretSortIcon, StarFilledIcon, StarIcon } from "@radix-ui/react-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
  title?: string;
}

const Item = ({
  option,
  onFavourite,
  onSelect,
  isFavourite,
}: {
  option: Code;
  isFavourite: boolean;
  onFavourite: () => void;
  onSelect: () => void;
}) => (
  <CommandItem
    key={option.code}
    value={option.code}
    onSelect={onSelect}
    className="cursor-pointer"
  >
    <div className="flex items-center justify-between w-full gap-4">
      <span>{option.display}</span>

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
  title,
}: Props) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const [activeTab, setActiveTab] = useState(0);
  const [isClearingFavourites, setIsClearingFavourites] = useState(false);
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (internalOpen && isMobile) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [internalOpen, isMobile]);

  const content = (
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
        placeholder={t("value_set_search_placeholder")}
        className="outline-hidden border-none ring-0 shadow-none"
        onValueChange={setSearch}
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
            className={`${activeTab === 0 ? "block" : "hidden"} md:block flex-1 overflow-auto h-[300px]`}
          >
            <CommandGroup>
              {resultsWithRecents.map((option) => (
                <Item
                  key={option.code}
                  option={option}
                  onSelect={() => {
                    onSelect({
                      code: option.code,
                      display: option.display || "",
                      system: option.system || "",
                    });
                    setInternalOpen(false);
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
                    {t("no_starred", {
                      star: "☆",
                    })}
                  </div>
                )}
              {favourites?.map((option) => (
                <Item
                  key={option.code}
                  option={option}
                  onSelect={() => {
                    onSelect({
                      code: option.code,
                      display: option.display || "",
                      system: option.system || "",
                    });
                    setInternalOpen(false);
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

  const alert = (
    <AlertDialog
      open={isClearingFavourites}
      onOpenChange={(open) => setIsClearingFavourites(open)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("are_you_sure_clear_starred")}</AlertDialogTitle>
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

  if (
    isMobile &&
    !hideTrigger &&
    (system === "system-additional-instruction" ||
      system === "system-route" ||
      system === "system-body-site" ||
      system === "system-administration-method")
  ) {
    return (
      <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            onClick={() => setInternalOpen(true)}
            className={cn(
              "w-full justify-between",
              wrapTextForSmallScreen
                ? "h-auto md:h-9 whitespace-normal text-left md:truncate"
                : "truncate",
              !value?.display && "text-gray-400",
            )}
            disabled={disabled}
          >
            <span>{value?.display || placeholder}</span>
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
          <div className="mt-6 h-full">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  if (isMobile && !hideTrigger) {
    return (
      <Sheet open={internalOpen} onOpenChange={setInternalOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between border border-primary rounded-md px-5",
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
        </SheetTrigger>
        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-3xl"
        >
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto bg-gray-300 mt-2" />
          <div className="mt-6 h-full">{content}</div>
        </SheetContent>
        {alert}
      </Sheet>
    );
  }

  return (
    <>
      <Popover
        open={controlledOpen || internalOpen}
        onOpenChange={setInternalOpen}
        modal={true}
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
          <PopoverContent className="transition-all w-150 p-0" align="start">
            {content}
          </PopoverContent>
        )}
      </Popover>
      {alert}
    </>
  );
}
