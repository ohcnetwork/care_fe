import { useQuery } from "@tanstack/react-query";
import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription } from "@/components/ui/empty";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import query from "@/Utils/request/query";
import {
  QuestionnaireMappingDraft,
  ReferralQuestionnaireType,
} from "@/types/emr/referral/referral";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

interface Props {
  facilityId?: string;
  value: QuestionnaireMappingDraft[];
  onChange: (value: QuestionnaireMappingDraft[]) => void;
  /** Show "required" errors on rows without a form (set after a failed save). */
  showErrors?: boolean;
  /** A rule that applies to the whole list, e.g. an active request form is required. */
  error?: string;
  disabled?: boolean;
}

export function ReferralQuestionnaireMappings({
  facilityId,
  value,
  onChange,
  showErrors,
  error,
  disabled,
}: Props) {
  const { t } = useTranslation();

  return (
    <FieldSet className="gap-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <FieldLegend variant="label" className="mb-0">
            {t("referral_configuration_forms")}
          </FieldLegend>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange([...value, { questionnaire_type: "request" }])
            }
            disabled={disabled}
          >
            <Plus className="size-4" />
            {t("add_form")}
          </Button>
        </div>
        <FieldDescription>
          {t("referral_configuration_forms_help")}
        </FieldDescription>
      </div>

      {value.length === 0 ? (
        // CARE UI empty state, kept compact: description only, no icon or
        // title, with Empty's dashed outline turned on via `border`.
        <Empty className="border">
          <EmptyDescription>{t("referral_no_forms_added")}</EmptyDescription>
        </Empty>
      ) : (
        <div role="list" className="space-y-4 sm:space-y-2">
          {value.map((row, index) => (
            <QuestionnaireMappingRow
              key={row.id ?? `new-${index}`}
              facilityId={facilityId}
              row={row}
              takenIds={value.flatMap((other, i) =>
                i !== index && other.id ? [other.id] : [],
              )}
              onChange={(next) =>
                onChange(
                  value.map((current, i) => (i === index ? next : current)),
                )
              }
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
              showErrors={showErrors}
              disabled={disabled}
            />
          ))}
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </FieldSet>
  );
}

function QuestionnaireMappingRow({
  facilityId,
  row,
  takenIds,
  onChange,
  onRemove,
  showErrors,
  disabled,
}: {
  facilityId?: string;
  row: QuestionnaireMappingDraft;
  takenIds: string[];
  onChange: (row: QuestionnaireMappingDraft) => void;
  onRemove: () => void;
  showErrors?: boolean;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  // Rows share the cache entry while their search is empty, so N rows still
  // make one request.
  const { data, isFetching, isError } = useQuery({
    queryKey: ["referral-configuration-questionnaires", facilityId, search],
    queryFn: query.debounced(questionnaireApi.list, {
      queryParams: {
        title: search || undefined,
        status: "active",
        subject_type: "referral",
        facility_or_instance: facilityId,
        limit: 50,
      },
    }),
  });
  const results = (data?.results ?? []).filter(
    (form) =>
      form.subject_type === "referral" &&
      form.id !== row.id &&
      !takenIds.includes(form.id),
  );
  // Autocomplete only labels a value found in `options`, so keep this row's
  // form first; it may be inactive and therefore missing from the results.
  const options = [
    ...(row.id ? [{ value: row.id, label: row.title ?? row.id }] : []),
    ...results.map((form) => ({ value: form.id, label: form.title })),
  ];
  const formLabel = row.title ?? t("referral_search_active_forms");
  // A form mapped while active that was later set to draft or retired. It only
  // blocks saving when the forms list changes, so it is a warning, not an error.
  const isInactive = !!row.id && row.status !== "active";
  const inactiveHintId = useId();

  return (
    <div role="listitem" className="flex items-start gap-2">
      <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[150px_1fr]">
        <Select
          value={row.questionnaire_type}
          onValueChange={(type: ReferralQuestionnaireType) =>
            onChange({ ...row, questionnaire_type: type })
          }
          disabled={disabled}
        >
          <SelectTrigger aria-label={t("referral_form_type")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="request">
              {t("referral_request_form")}
            </SelectItem>
            <SelectItem value="response">
              {t("referral_response_form")}
            </SelectItem>
          </SelectContent>
        </Select>
        <div className="min-w-0 space-y-1">
          <Autocomplete
            aria-label={t("referral_search_active_forms")}
            aria-invalid={showErrors && !row.id}
            aria-describedby={isInactive ? inactiveHintId : undefined}
            className={isInactive ? "border-warning-400" : undefined}
            options={options}
            value={row.id ?? ""}
            onChange={(id) => {
              const selected = results.find((form) => form.id === id);
              if (!selected) return;
              onChange({
                ...row,
                id: selected.id,
                title: selected.title,
                status: selected.status,
              });
              setSearch("");
            }}
            onSearch={setSearch}
            placeholder={t("referral_search_active_forms")}
            isLoading={isFetching}
            // The row's trash button is the one remove action; a clear (x)
            // inside the picker beside it would be a confusing duplicate.
            showClearButton={false}
            disabled={disabled}
          />
          {isInactive && (
            <p
              id={inactiveHintId}
              className="flex items-start gap-1.5 text-sm text-warning-700 dark:text-warning-400"
            >
              <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
              {t("referral_form_inactive_help")}
            </p>
          )}
          {showErrors && !row.id && (
            <FieldError>{t("please_select_form")}</FieldError>
          )}
          {isError && <FieldError>{t("referral_forms_load_error")}</FieldError>}
        </div>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive"
        aria-label={
          row.id ? t("referral_remove_form", { name: formLabel }) : t("remove")
        }
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
