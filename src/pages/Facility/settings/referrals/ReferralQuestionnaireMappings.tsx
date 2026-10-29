import { useQuery } from "@tanstack/react-query";
import { FileText, X } from "lucide-react";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import query from "@/Utils/request/query";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";

export interface QuestionnaireMappingSelection {
  id: string;
  title: string;
  status: string;
  questionnaire_type: "request" | "response";
}

interface Props {
  facilityId?: string;
  value: QuestionnaireMappingSelection[];
  onChange: (value: QuestionnaireMappingSelection[]) => void;
  disabled?: boolean;
}

export function ReferralQuestionnaireMappings({
  facilityId,
  value,
  onChange,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const searchLabelId = useId();
  const [search, setSearch] = useState("");
  const [formType, setFormType] = useState<"request" | "response">("request");
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
  const options = (data?.results ?? []).filter(
    (form) =>
      form.subject_type === "referral" &&
      !value.some((selected) => selected.id === form.id),
  );

  return (
    <FieldSet className="gap-3">
      <FieldLegend>{t("referral_configuration_forms")}</FieldLegend>
      <FieldDescription>
        {t("referral_configuration_forms_help")}
      </FieldDescription>
      <div className="grid gap-2 sm:grid-cols-[150px_1fr]">
        <Select
          value={formType}
          onValueChange={(value: "request" | "response") => setFormType(value)}
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
        <div className="min-w-0">
          <span id={searchLabelId} className="sr-only">
            {t("referral_search_active_forms")}
          </span>
          <Autocomplete
            aria-labelledby={searchLabelId}
            options={options.map((form) => ({
              value: form.id,
              label: form.title,
            }))}
            value=""
            onChange={(id) => {
              const selected = options.find((form) => form.id === id);
              if (!selected) return;
              onChange([
                ...value,
                {
                  id: selected.id,
                  title: selected.title,
                  status: selected.status,
                  questionnaire_type: formType,
                },
              ]);
              setSearch("");
            }}
            onSearch={setSearch}
            placeholder={t("referral_search_active_forms")}
            isLoading={isFetching}
            disabled={disabled}
          />
        </div>
      </div>
      {isError && <FieldError>{t("referral_forms_load_error")}</FieldError>}
      {value.length > 0 && (
        <ItemGroup>
          {value.map((form) => (
            <Item key={form.id} role="listitem" size="sm" variant="outline">
              <ItemMedia variant="icon">
                <FileText />
              </ItemMedia>
              <ItemContent className="min-w-0">
                <ItemTitle className="line-clamp-none break-words">
                  {form.title}
                </ItemTitle>
                <div className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="neutral">
                    {t(
                      form.questionnaire_type === "request"
                        ? "referral_request_form"
                        : "referral_response_form",
                    )}
                  </Badge>
                  {form.status !== "active" && (
                    <Badge variant="destructive">
                      {t("referral_form_inactive")}
                    </Badge>
                  )}
                </div>
              </ItemContent>
              <ItemActions>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("referral_remove_form", { name: form.title })}
                  disabled={disabled}
                  onClick={() =>
                    onChange(value.filter((item) => item.id !== form.id))
                  }
                >
                  <X className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      )}
    </FieldSet>
  );
}
