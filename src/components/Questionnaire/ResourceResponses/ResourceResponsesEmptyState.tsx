import { ClipboardList, SearchX } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ResourceFormPicker } from "@/components/Questionnaire/ResourceFormPicker";
import { Button } from "@/components/ui/button";

import type { ResourceResponseSubjectType } from "./types";

interface ResourceResponsesEmptyStateProps {
  facilityId: string;
  subjectType: ResourceResponseSubjectType;
  subjectId: string;
  hasFilters: boolean;
  page: number;
  disabled: boolean;
  onClearFilters: () => void;
  onFirstPage: () => void;
}

export function ResourceResponsesEmptyState({
  facilityId,
  subjectType,
  subjectId,
  hasFilters,
  page,
  disabled,
  onClearFilters,
  onFirstPage,
}: ResourceResponsesEmptyStateProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
        {hasFilters ? (
          <SearchX className="size-6" />
        ) : (
          <ClipboardList className="size-6" />
        )}
      </div>
      <h3 className="text-base font-semibold text-neutral-950">
        {hasFilters ? t("no_matching_responses") : t("no_responses_found")}
      </h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-600">
        {hasFilters
          ? t("no_matching_responses_description")
          : t(`${subjectType}_responses_empty_description`)}
      </p>
      {hasFilters ? (
        <Button
          variant="outline"
          className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
          onClick={onClearFilters}
        >
          {t("clear_filters")}
        </Button>
      ) : page > 1 ? (
        <Button
          variant="outline"
          className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
          onClick={onFirstPage}
        >
          {t("back_to_first_page")}
        </Button>
      ) : (
        <ResourceFormPicker
          facilityId={facilityId}
          subjectType={subjectType}
          subjectId={subjectId}
          disabled={disabled}
          trigger={
            <Button
              variant="outline"
              className="mt-5 h-12 border-neutral-400 text-neutral-950 shadow-md hover:bg-neutral-200/75 focus-visible:ring-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 md:h-10"
              disabled={disabled}
            >
              {t("submit_forms")}
            </Button>
          }
        />
      )}
    </div>
  );
}
