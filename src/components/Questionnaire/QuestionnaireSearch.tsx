import { CaretSortIcon } from "@radix-ui/react-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { conditionalAttribute, isIOSDevice } from "@/Utils/utils";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  trigger?: React.ReactNode;
  onSelect?: (questionnaire: QuestionnaireRead) => void;
  subjectType?: string;
  facilityId?: string;
  appearance?: "default" | "careui";
  disabled?: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
}

const QUESTIONNAIRES_PER_PAGE = 30;

export function QuestionnaireSearch({
  placeholder,
  trigger,
  size = "default",
  onSelect = (selected) => navigate(`questionnaire/${selected.id}`),
  subjectType,
  facilityId,
  appearance = "default",
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });
  const isCareUI = appearance === "careui";

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: ["questionnaires", "picker", search, subjectType, facilityId],
    queryFn: ({ pageParam, signal }) =>
      query.debounced(questionnaireApi.list, {
        queryParams: {
          title: search,
          ...conditionalAttribute(!!subjectType, {
            subject_type: subjectType,
          }),
          ...conditionalAttribute(!!facilityId, {
            facility_or_instance: facilityId,
          }),
          status: "active",
          limit: QUESTIONNAIRES_PER_PAGE,
          offset: pageParam,
        },
      })({ signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const offset = pages.length * QUESTIONNAIRES_PER_PAGE;
      return offset < lastPage.count ? offset : undefined;
    },
    enabled: isOpen && !disabled,
  });
  const questionnaires = data?.pages.flatMap((page) => page.results) ?? [];

  const handleOpenChange = (open: boolean) => {
    if (open && disabled) return;
    if (open) {
      setSearch("");
    }
    setIsOpen(open);
  };

  const content = (
    <Command
      shouldFilter={false}
      className={cn(
        isCareUI &&
          "rounded-xl bg-white p-1 text-neutral-950 [&_[data-slot=command-input-wrapper]]:m-1 [&_[data-slot=command-input-wrapper]]:h-12 [&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-neutral-300/30 [&_[data-slot=command-input-wrapper]]:bg-neutral-300/30 [&_[data-slot=command-input-wrapper]]:px-2 md:[&_[data-slot=command-input-wrapper]]:h-10 [&_[data-slot=command-group]]:text-neutral-950",
      )}
    >
      <CommandInput
        aria-label={t("search_forms")}
        placeholder={t("search_forms")}
        className={cn(
          "outline-hidden border-none ring-0 shadow-none text-base sm:text-sm",
          isCareUI && "h-full text-neutral-950 placeholder:text-neutral-500",
        )}
        onValueChange={setSearch}
        value={search}
        autoFocus={!isIOSDevice}
      />
      <CommandList className={cn("overflow-y-auto", isCareUI && "max-h-72")}>
        {isLoading ? (
          <div
            role="status"
            aria-label={t("loading")}
            className="space-y-2 p-4"
          >
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 p-4 text-sm text-gray-600">
            <p>{t("questionnaire_error_loading")}</p>
            <Button
              variant="outline"
              size="sm"
              disabled={disabled || isFetching}
              onClick={() => void refetch()}
            >
              {t("try_again")}
            </Button>
          </div>
        ) : (
          <>
            <CommandEmpty>{t("no_results_found")}</CommandEmpty>
            <CommandGroup>
              {questionnaires.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  disabled={disabled}
                  className={cn(
                    isCareUI &&
                      "min-h-12 rounded-md px-2.5 text-base text-neutral-950 data-[selected=true]:bg-neutral-100 data-[selected=true]:text-neutral-950 md:min-h-10 md:text-sm",
                  )}
                  onSelect={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <CareIcon
                    icon="l-file-export"
                    className="mr-2 size-4 shrink-0"
                  />
                  <span className="min-w-0 break-words">{item.title}</span>
                </CommandItem>
              ))}
              {hasNextPage && (
                <CommandItem
                  value="load-more-questionnaires"
                  disabled={disabled || isFetchingNextPage}
                  onSelect={() => void fetchNextPage()}
                  className={cn(
                    "justify-center text-primary-700",
                    isCareUI &&
                      "min-h-12 text-emerald-800 data-[selected=true]:bg-neutral-100 data-[selected=true]:text-emerald-800 md:min-h-10",
                  )}
                >
                  {isFetchingNextPage ? t("loading") : t("load_more")}
                </CommandItem>
              )}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {trigger || (
            <Button
              variant="outline"
              role="combobox"
              aria-label={placeholder || t("add_forms")}
              disabled={disabled || isLoading}
            >
              {isLoading ? (
                <>
                  <CareIcon
                    icon="l-spinner"
                    className="mr-2 size-4 animate-spin"
                  />
                  {t("loading")}
                </>
              ) : (
                <span>{placeholder || t("add_forms")}</span>
              )}
              <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
            </Button>
          )}
        </DrawerTrigger>

        <DrawerContent
          className={cn(
            "min-h-[50vh] max-h-[85vh] px-0 pt-2 pb-0 rounded-t-lg",
            isCareUI && "border-neutral-200 bg-white text-neutral-950",
          )}
        >
          <DrawerTitle className="sr-only">{t("forms")}</DrawerTitle>
          <div className="mt-6 pb-[env(safe-area-inset-bottom)] flex-1 overflow-y-auto">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            size={size}
            variant="outline"
            role="combobox"
            aria-label={placeholder || t("add_forms")}
            className="w-full border border-primary-600"
            disabled={disabled || isLoading}
          >
            {isLoading ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
                {t("loading")}
              </>
            ) : (
              <div className="flex justify-start items-center gap-2 text-primary-800 w-full">
                <Plus className="size-4" />
                <span>{placeholder || t("add_forms")}</span>
              </div>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label={t("forms")}
        className={cn(
          "w-[300px] p-0",
          isCareUI &&
            "w-[min(24rem,calc(100vw-2rem))] rounded-xl border-neutral-200 bg-white text-neutral-950 shadow-md",
        )}
        align="start"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
