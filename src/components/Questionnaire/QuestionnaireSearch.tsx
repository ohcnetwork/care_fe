import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useEffect, useState } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { conditionalAttribute } from "@/Utils/utils";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  onSelect?: (questionnaire: QuestionnaireDetail) => void;
  subjectType?: string;
  disabled?: boolean;
  size?: "default" | "sm" | "xs" | "lg";
}

export function QuestionnaireSearch({
  placeholder,
  size = "default",
  onSelect = (selected) => navigate(`questionnaire/${selected.slug}`),
  subjectType,
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: questionnaires, isLoading } = useQuery({
    queryKey: ["questionnaires", "list", search, subjectType],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        title: search,
        ...conditionalAttribute(!!subjectType, {
          subject_type: subjectType,
        }),
        status: "active",
      },
    }),
  });

  useEffect(() => {
    if (isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  const content = (
    <Command filter={() => 1}>
      <CommandInput
        placeholder={t("search_questionnaires")}
        className="outline-hidden border-none ring-0 shadow-none"
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList className="overflow-y-auto">
        <CommandEmpty>
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            t("no_questionnaires_found")
          )}
        </CommandEmpty>

        <CommandGroup>
          {(questionnaires?.results ?? []).map((item: QuestionnaireDetail) => (
            <CommandItem
              key={item.id}
              value={item.title}
              onSelect={() => {
                onSelect(item);
                setIsOpen(false);
              }}
            >
              <CareIcon icon="l-file-export" className="mr-2 size-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            data-cy="add-questionnaire-button"
            variant="outline"
            role="combobox"
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
              <span>{placeholder || t("add_questionnaire")}</span>
            )}
            <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side="bottom"
          className="h-[50vh] px-0 pt-2 pb-0 rounded-t-lg"
        >
          <SheetTitle className="sr-only">{t("questionnaire")}</SheetTitle>
          <div className="absolute inset-x-0 top-0 h-1.5 w-12 mx-auto rounded-full bg-gray-300 mt-2" />
          <div className="mt-6 h-full">{content}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size={size}
          data-cy="add-questionnaire-button"
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
              {t("loading")}
            </>
          ) : (
            <span>{placeholder || t("add_questionnaire")}</span>
          )}
          <CaretSortIcon className="ml-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}
