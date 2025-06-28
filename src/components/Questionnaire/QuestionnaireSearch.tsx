import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";

import query from "@/Utils/request/query";
import { conditionalAttribute } from "@/Utils/utils";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  onSelect: (questionnaire: QuestionnaireDetail) => void;
  subjectType?: string;
  disabled?: boolean;
}

interface QuestionnaireListResponse {
  results: QuestionnaireDetail[];
  count: number;
}

export function QuestionnaireSearch({
  onSelect,
  subjectType,
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

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

  const filteredQuestionnaires = (questionnaires?.results ?? []).filter(
    (item: QuestionnaireDetail) =>
      item.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          data-cy="add-questionnaire-button"
          variant="outline"
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
            <span>{t("add_questionnaire")}</span>
          )}
          <CareIcon icon="l-arrow-down" className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full sm:w-[600px] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <CareIcon
            icon="l-search"
            className="mr-2 h-4 w-4 shrink-0 text-gray-500"
          />
          <input
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:opacity-50 focus:ring-0 focus:border-transparent"
            placeholder="Search questionnaires..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : filteredQuestionnaires.length === 0 ? (
            <div className="p-4 text-sm text-gray-500">
              {t("no_questionnaires_found")}
            </div>
          ) : (
            <div className="grid gap-1 p-2">
              {filteredQuestionnaires.map((item: QuestionnaireDetail) => (
                <Button
                  key={item.id}
                  variant="ghost"
                  className="w-full justify-start font-normal"
                  onClick={() => {
                    onSelect(item);
                    setIsOpen(false);
                  }}
                >
                  <CareIcon icon="l-file-export" className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
