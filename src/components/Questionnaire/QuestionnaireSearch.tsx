import { CaretSortIcon } from "@radix-ui/react-icons";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { ItemSelector } from "@/components/Common/ItemSelector";
import { Button } from "@/components/ui/button";

import query from "@/Utils/request/query";
import { conditionalAttribute } from "@/Utils/utils";
import type { QuestionnaireDetail } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface QuestionnaireSearchProps {
  placeholder?: string;
  trigger?: React.ReactNode;
  onSelect?: (questionnaire: QuestionnaireDetail) => void;
  subjectType?: string;
  disabled?: boolean;
  size?: React.ComponentProps<typeof Button>["size"];
}

export function QuestionnaireSearch({
  placeholder,
  trigger,
  size = "default",
  onSelect = (selected) => navigate(`questionnaire/${selected.slug}`),
  subjectType,
  disabled,
}: QuestionnaireSearchProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

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
    enabled: true,
  });

  const mobileTrigger = (
    <Button
      data-cy="add-questionnaire-button"
      variant="outline"
      role="combobox"
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
  );

  const defaultTrigger = (
    <Button
      size={size}
      data-cy="add-questionnaire-button"
      variant="outline"
      role="combobox"
      className="w-full border border-primary-600"
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <>
          <CareIcon icon="l-spinner" className="mr-2 size-4 animate-spin" />
          {t("loading")}
        </>
      ) : (
        <div className="flex justify-start items-center gap-2 text-primary-800 w-full">
          <Plus className="size-4" />
          <span>{placeholder || t("add_questionnaire")}</span>
        </div>
      )}
    </Button>
  );

  return (
    <ItemSelector
      title={t("questionnaire")}
      placeholder={placeholder || t("add_questionnaire")}
      searchPlaceholder={t("search_questionnaires")}
      noResultsMessage={t("no_questionnaires_found")}
      loading={isLoading}
      options={(questionnaires?.results || []).map((item) => ({
        value: item.id,
        label: item.title,
        data: item, // Store the full item for access in onChange
        icon: <CareIcon icon="l-file-export" className="mr-2 size-4" />,
      }))}
      triggerButton={trigger || defaultTrigger}
      mobileTrigger={mobileTrigger}
      onSearch={setSearch}
      disabled={disabled}
      renderOption={(option) => (
        <div className="flex items-center w-full">
          {option.icon}
          <span>{option.label}</span>
        </div>
      )}
      onChange={(value) => {
        if (value && !Array.isArray(value)) {
          // Find the selected questionnaire using the stored data
          const option = (questionnaires?.results || []).find(
            (item) => item.id === value,
          );
          if (option) {
            onSelect(option);
          }
        }
      }}
    />
  );
}
