import { useInfiniteQuery } from "@tanstack/react-query";
import { Check, ChevronDown, Loader2, X } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import UserSelector from "@/components/Common/UserSelector";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";

import query from "@/Utils/request/query";
import { formatName } from "@/Utils/utils";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { QuestionnaireResponseStatus } from "@/types/questionnaire/questionnaireResponse";

import { ResourceResponseSubjectType } from "./types";

export interface ResourceResponseFilterValues {
  questionnaire?: string;
  questionnaireTitle?: string;
  createdBy?: string;
  creatorName?: string;
  status?: QuestionnaireResponseStatus;
}

interface ResourceResponseFiltersProps {
  facilityId: string;
  subjectType: ResourceResponseSubjectType;
  value: ResourceResponseFilterValues;
  onChange: (patch: Partial<ResourceResponseFilterValues>) => void;
  disabled?: boolean;
}

const QUESTIONNAIRES_PER_PAGE = 30;

export default function ResourceResponseFilters({
  facilityId,
  subjectType,
  value,
  onChange,
  disabled = false,
}: ResourceResponseFiltersProps) {
  const { t } = useTranslation();
  const id = useId();
  const [formsOpen, setFormsOpen] = useState(false);
  const [formSearch, setFormSearch] = useState("");

  const questionnairesQuery = useInfiniteQuery({
    queryKey: [
      ...questionnaireKeys.all,
      "resource-response-filter",
      subjectType,
      facilityId,
      formSearch,
    ],
    queryFn: ({ pageParam, signal }) =>
      query.debounced(questionnaireApi.list, {
        queryParams: {
          subject_type: subjectType,
          facility_or_instance: facilityId,
          title: formSearch || undefined,
          limit: QUESTIONNAIRES_PER_PAGE,
          offset: pageParam,
        },
      })({ signal }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const offset = pages.length * QUESTIONNAIRES_PER_PAGE;
      return offset < lastPage.count ? offset : undefined;
    },
    enabled: formsOpen && !disabled,
  });

  const questionnaires =
    questionnairesQuery.data?.pages.flatMap((page) => page.results) ?? [];
  const hasFilters = !!(value.questionnaire || value.createdBy || value.status);

  return (
    <div
      role="group"
      aria-label={t(`${subjectType}_response_filter_label`)}
      data-cy={`${subjectType}-response-filters`}
      className="grid grid-cols-2 items-end gap-3 bg-neutral-50 p-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_minmax(0,0.85fr)_auto]"
    >
      <div className="col-span-2 min-w-0 space-y-1.5 sm:col-span-1">
        <Label
          htmlFor={`${id}-questionnaire`}
          className="text-sm font-medium text-neutral-700"
        >
          {t("questionnaire")}
        </Label>
        <Popover
          open={formsOpen}
          onOpenChange={(open) => {
            setFormsOpen(open);
            if (open) setFormSearch("");
          }}
        >
          <PopoverTrigger asChild>
            <Button
              id={`${id}-questionnaire`}
              type="button"
              variant="outline"
              role="combobox"
              aria-label={t("questionnaire")}
              aria-expanded={formsOpen}
              disabled={disabled}
              className="h-12 w-full min-w-0 justify-between gap-2 border-neutral-300 bg-white font-normal text-neutral-950 shadow-xs hover:bg-neutral-50 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
            >
              <span className="truncate text-left">
                {value.questionnaire
                  ? value.questionnaireTitle ||
                    t("location_response_selected_form")
                  : t("location_response_all_forms")}
              </span>
              <ChevronDown className="size-4 shrink-0 text-neutral-500" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            aria-label={t("questionnaire")}
            className="w-[min(24rem,calc(100vw-2rem))] rounded-lg border-neutral-200 p-1 shadow-md"
          >
            <Command
              shouldFilter={false}
              className="text-neutral-950 [&_[data-slot=command-input-wrapper]]:m-1 [&_[data-slot=command-input-wrapper]]:h-12 [&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border-0 [&_[data-slot=command-input-wrapper]]:bg-neutral-100 [&_[data-slot=command-input-wrapper]]:focus-within:outline-2 [&_[data-slot=command-input-wrapper]]:focus-within:outline-indigo-500 md:[&_[data-slot=command-input-wrapper]]:h-10 [&_[cmdk-item]]:min-h-12 [&_[cmdk-item]]:data-[selected=true]:bg-neutral-100 [&_[cmdk-item]]:data-[selected=true]:text-neutral-950 md:[&_[cmdk-item]]:min-h-10"
            >
              <CommandInput
                aria-label={t("search_forms")}
                placeholder={t("search_forms")}
                value={formSearch}
                onValueChange={setFormSearch}
                className="h-full border-none text-base text-neutral-950 shadow-none ring-0 outline-hidden placeholder:text-neutral-500 md:text-sm"
              />
              <CommandList>
                <CommandGroup>
                  <CommandItem
                    value="all-forms"
                    onSelect={() => {
                      onChange({
                        questionnaire: undefined,
                        questionnaireTitle: undefined,
                      });
                      setFormsOpen(false);
                    }}
                    className="min-h-10"
                  >
                    {t("location_response_all_forms")}
                    {!value.questionnaire && (
                      <Check className="ml-auto size-4" />
                    )}
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                {questionnairesQuery.isLoading ? (
                  <div
                    role="status"
                    className="flex items-center justify-center gap-2 p-6 text-sm text-neutral-500"
                  >
                    <Loader2 className="size-4 animate-spin" />
                    {t("loading")}
                  </div>
                ) : questionnairesQuery.isError ? (
                  <div
                    role="alert"
                    className="space-y-3 p-4 text-sm text-neutral-600"
                  >
                    <p>{t("questionnaire_error_loading")}</p>
                    <Button
                      variant="outline"
                      className="h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
                      disabled={questionnairesQuery.isFetching}
                      onClick={() => void questionnairesQuery.refetch()}
                    >
                      {t("try_again")}
                    </Button>
                  </div>
                ) : questionnaires.length === 0 ? (
                  <p className="p-6 text-center text-sm text-neutral-500">
                    {t("no_results_found")}
                  </p>
                ) : (
                  <CommandGroup>
                    {questionnaires.map((questionnaire) => (
                      <CommandItem
                        key={questionnaire.id}
                        value={questionnaire.id}
                        onSelect={() => {
                          onChange({
                            questionnaire: questionnaire.id,
                            questionnaireTitle: questionnaire.title,
                          });
                          setFormsOpen(false);
                        }}
                        className="min-h-10 items-start"
                      >
                        <span className="min-w-0 flex-1 break-words">
                          {questionnaire.title}
                        </span>
                        {value.questionnaire === questionnaire.id && (
                          <Check className="mt-0.5 size-4 shrink-0" />
                        )}
                      </CommandItem>
                    ))}
                    {questionnairesQuery.hasNextPage && (
                      <CommandItem
                        value="load-more-forms"
                        disabled={questionnairesQuery.isFetchingNextPage}
                        onSelect={() =>
                          void questionnairesQuery.fetchNextPage()
                        }
                        className="min-h-10 justify-center text-neutral-950"
                      >
                        {questionnairesQuery.isFetchingNextPage
                          ? t("loading")
                          : t("load_more")}
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-w-0 space-y-1.5">
        <Label
          htmlFor={`${id}-submitted-by`}
          className="text-sm font-medium text-neutral-700"
        >
          {t("submitted_by")}
        </Label>
        <UserSelector
          appearance="careui"
          facilityId={facilityId}
          selectedId={value.createdBy}
          dialogTitle={t("submitted_by")}
          disabled={disabled}
          onChange={(user) =>
            onChange({ createdBy: user.id, creatorName: formatName(user) })
          }
          onClear={() =>
            onChange({ createdBy: undefined, creatorName: undefined })
          }
          trigger={
            <Button
              id={`${id}-submitted-by`}
              type="button"
              variant="outline"
              role="combobox"
              aria-label={t("submitted_by")}
              disabled={disabled}
              className="h-12 w-full min-w-0 justify-between gap-2 border-neutral-300 bg-white font-normal text-neutral-950 shadow-xs hover:bg-neutral-50 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
            >
              <span className="truncate text-left">
                {value.createdBy
                  ? value.creatorName ||
                    t("location_response_selected_submitter")
                  : t("location_response_any_submitter")}
              </span>
              <ChevronDown className="size-4 shrink-0 text-neutral-500" />
            </Button>
          }
        />
      </div>

      <div className="min-w-0 space-y-1.5">
        <Label
          htmlFor={`${id}-status`}
          className="text-sm font-medium text-neutral-700"
        >
          {t("status")}
        </Label>
        <Select
          value={value.status ?? "all"}
          disabled={disabled}
          onValueChange={(status) =>
            onChange({
              status:
                status === QuestionnaireResponseStatus.Completed
                  ? QuestionnaireResponseStatus.Completed
                  : status === QuestionnaireResponseStatus.EnteredInError
                    ? QuestionnaireResponseStatus.EnteredInError
                    : undefined,
            })
          }
        >
          <SelectTrigger
            id={`${id}-status`}
            aria-label={t("status")}
            className="w-full border-neutral-300 text-neutral-950 focus-visible:border-indigo-500 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 data-[size=default]:h-12 md:data-[size=default]:h-10"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="border-neutral-200 text-neutral-950 [&_[data-slot=select-item]]:min-h-12 [&_[data-slot=select-item]]:focus:bg-neutral-100 [&_[data-slot=select-item]]:focus:text-neutral-950 md:[&_[data-slot=select-item]]:min-h-10">
            <SelectItem value="all">{t("all_statuses")}</SelectItem>
            <SelectItem value={QuestionnaireResponseStatus.Completed}>
              {t("completed")}
            </SelectItem>
            <SelectItem value={QuestionnaireResponseStatus.EnteredInError}>
              {t("entered_in_error")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="ghost"
        disabled={disabled || !hasFilters}
        onClick={() =>
          onChange({
            questionnaire: undefined,
            questionnaireTitle: undefined,
            createdBy: undefined,
            creatorName: undefined,
            status: undefined,
          })
        }
        className={cn(
          "col-span-2 h-12 justify-self-end gap-1.5 text-neutral-950 underline underline-offset-4 hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:col-span-1 md:h-10",
          !hasFilters && "hidden sm:inline-flex",
        )}
      >
        <X className="size-4" />
        {t("clear_filters")}
      </Button>
    </div>
  );
}
