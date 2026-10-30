import { useInfiniteQuery } from "@tanstack/react-query";
import { ChevronsUpDown as CaretSortIcon, Plus } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

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
  DrawerDescription,
  DrawerHeader,
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
import { conditionalAttribute } from "@/Utils/utils";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  trigger?: React.ReactNode;
  onSelect?: (questionnaire: QuestionnaireRead) => void;
  subjectType?: string;
  facilityId?: string;

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

  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

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
    <Command shouldFilter={false}>
      <div className="border-b border-gray-100 shadow-xs">
        <CommandInput
          aria-label={t("search_forms")}
          placeholder={t("search_forms")}
          onValueChange={setSearch}
          value={search}
        />
      </div>
      <CommandList className="w-full max-h-72">
        {isLoading ? (
          <div
            role="status"
            aria-label={t("loading")}
            className="p-4 space-y-2"
          >
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
            <Skeleton className="w-full h-8" />
          </div>
        ) : isError ? (
          <div role="alert" className="p-4 space-y-3 text-sm text-gray-600">
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
            <CommandGroup className="px-2">
              {questionnaires.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.id}
                  disabled={disabled}
                  className="rounded-md cursor-pointer hover:bg-gray-100 aria-selected:bg-gray-100"
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
                  className="justify-center rounded-md cursor-pointer text-primary-700 hover:bg-gray-100 aria-selected:bg-gray-100"
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
              <CaretSortIcon className="ml-2 opacity-50 size-4 shrink-0" />
            </Button>
          )}
        </DrawerTrigger>

        <DrawerContent height="fixed" className="p-1.5">
          <DrawerHeader className="pl-1 md:pb-2" showCloseButton>
            <DrawerTitle>{t("forms")}</DrawerTitle>
            <DrawerDescription className="sr-only">
              {t("search_forms")}
            </DrawerDescription>
          </DrawerHeader>
          {content}
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
              <div className="flex items-center justify-start w-full gap-2 text-primary-800">
                <Plus className="size-4" />
                <span>{placeholder || t("add_forms")}</span>
              </div>
            )}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent
        aria-label={t("forms")}
        className="w-[min(24rem,calc(100vw-2rem))] overflow-clip p-1.5"
        align="start"
      >
        {content}
      </PopoverContent>
    </Popover>
  );
}
