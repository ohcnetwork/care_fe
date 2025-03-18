import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";

import useBreakpoints from "@/hooks/useBreakpoints";

import query from "@/Utils/request/query";
import { conditionalAttribute } from "@/Utils/utils";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  onSelect: (questionnaire: QuestionnaireDetail) => void;
  subjectType?: string;
  disabled?: boolean;
}

interface QuestionnaireListResponse {
  results: QuestionnaireDetail[];
  count: number;
}

export function QuestionnaireSearch({
  placeholder,
  onSelect,
  subjectType,
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const isMobile = useBreakpoints({ default: true, sm: false });

  const { data: questionnaires, isLoading } =
    useQuery<QuestionnaireListResponse>({
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
        className="outline-none border-none ring-0 shadow-none"
        onValueChange={setSearch}
        autoFocus
      />
      <CommandList>
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
              <CareIcon icon="l-file-export" className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );

  if (isMobile) {
    return (
      <>
        <Button
          data-cy="add-questionnaire-button"
          variant="outline"
          role="combobox"
          onClick={() => setIsOpen(true)}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <CareIcon
                icon="l-spinner"
                className="mr-2 h-4 w-4 animate-spin"
              />
              {t("loading")}
            </>
          ) : (
            <span>{placeholder || t("add_questionnaire")}</span>
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
        <CommandDrawer open={isOpen} onOpenChange={setIsOpen}>
          {content}
        </CommandDrawer>
      </>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          data-cy="add-questionnaire-button"
          variant="outline"
          role="combobox"
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <>
              <CareIcon
                icon="l-spinner"
                className="mr-2 h-4 w-4 animate-spin"
              />
              {t("loading")}
            </>
          ) : (
            <span>{placeholder || t("add_questionnaire")}</span>
          )}
          <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        {content}
      </PopoverContent>
    </Popover>
  );
}
