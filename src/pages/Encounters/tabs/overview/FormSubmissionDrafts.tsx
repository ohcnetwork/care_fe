import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpRight, Trash2 } from "lucide-react";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ClinicalListError } from "@/components/Patient/Common/ClinicalListError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import type { LocalFillDraftSummary } from "@/components/QuestionnaireV2/fill/draft/fillDraftList";
import { discardLocalFillDraft } from "@/components/QuestionnaireV2/fill/draft/fillDraftList";
import { useLocalFillDrafts } from "@/components/QuestionnaireV2/fill/draft/useLocalFillDrafts";
import { formSubmissionKeys } from "@/components/QuestionnaireV2/queryKeys";

import useAuthUser from "@/hooks/useAuthUser";

import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";
import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";

interface FormSubmissionDraftsProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
  title?: string;
  showEmpty?: boolean;
  returnPage?: string;
}

interface DraftRowDetails {
  id: string;
  title: string;
  savedAt: string;
  url: string;
  formCount: number;
}

type DraftRow = DraftRowDetails &
  (
    | { source: "local"; draft: LocalFillDraftSummary }
    | { source: "server"; draft: FormSubmissionRead }
  );

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A server dump is untyped. List only entries that can open a questionnaire. */
function serverQuestionnaire(submission: FormSubmissionRead) {
  const response = submission.response_dump?.questionnaireResponses;
  if (!isRecord(response) || !Array.isArray(response.responses)) return;
  const questionnaire = response.questionnaire;
  if (
    !isRecord(questionnaire) ||
    typeof questionnaire.id !== "string" ||
    !questionnaire.id ||
    typeof questionnaire.title !== "string"
  ) {
    return;
  }
  return { id: questionnaire.id, title: questionnaire.title };
}

export function FormSubmissionDrafts({
  facilityId,
  patientId,
  encounterId,
  title,
  showEmpty = false,
  returnPage,
}: FormSubmissionDraftsProps) {
  const { t } = useTranslation();
  const user = useAuthUser();
  const queryClient = useQueryClient();
  const [draftToDiscard, setDraftToDiscard] = useState<DraftRow | null>(null);
  const localDrafts = useLocalFillDrafts(user.id, `encounter:${encounterId}`);
  const fillBase = `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire`;

  const {
    data: formSubmissions,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: formSubmissionKeys.list(encounterId),
    queryFn: query(formSubmissionApi.list, {
      silent: true,
      queryParams: { encounter: encounterId, status: "draft" },
    }),
    enabled: !!encounterId,
  });

  const { mutate: discardSubmission, isPending: isDiscarding } = useMutation({
    mutationFn: (submission: FormSubmissionRead) =>
      mutate(formSubmissionApi.update, {
        pathParams: { external_id: submission.id },
      })({
        status: "entered_in_error",
        response_dump: submission.response_dump,
      }),
    onSuccess: () => {
      toast.success(t("form_submission_discarded"));
      queryClient.invalidateQueries({
        queryKey: formSubmissionKeys.list(encounterId),
      });
    },
    onError: () => {
      toast.error(t("form_submission_discard_failed"));
    },
  });

  const rows: DraftRow[] = localDrafts.map((draft) => {
    const params = new URLSearchParams(draft.scope.contextKey);
    params.set("resume_local_draft", "true");
    if (returnPage) params.set("return_page", returnPage);
    return {
      source: "local",
      id: draft.key,
      title: draft.title || t("questionnaire_one"),
      savedAt: draft.savedAt,
      formCount: draft.formCount,
      url: `${fillBase}/${encodeURIComponent(draft.scope.entryQuestionnaireId)}?${params}`,
      draft,
    };
  });
  for (const draft of formSubmissions?.results ?? []) {
    const questionnaire = serverQuestionnaire(draft);
    if (!questionnaire || draft.status !== "draft") continue;
    const params = new URLSearchParams({ continue_draft: draft.id });
    if (returnPage) params.set("return_page", returnPage);
    rows.push({
      source: "server",
      id: draft.id,
      title: questionnaire.title,
      savedAt: draft.modified_date || draft.created_date,
      formCount: 1,
      url: `${fillBase}/${encodeURIComponent(questionnaire.id)}?${params}`,
      draft,
    });
  }
  rows.sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));

  if (!rows.length && !isLoading && !isError && !showEmpty) return null;
  const heading = title ?? t("draft_forms");

  return (
    <section
      aria-label={heading}
      className="@container/draft-forms min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white"
    >
      <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-bold tracking-wide text-gray-600 uppercase">
        {heading}
      </h2>
      {isError && (
        <div className="p-3">
          <ClinicalListError isFetching={isFetching} onRetry={refetch} />
        </div>
      )}
      {!rows.length && isLoading ? (
        <Skeleton className="m-3 h-16" />
      ) : !rows.length && !isError ? (
        <p className="p-4 text-sm text-gray-500">{t("no_draft_forms")}</p>
      ) : null}
      <ul className="min-w-0 divide-y divide-gray-200">
        {rows.map((row) => {
          const savedAt = formatDateTime(row.savedAt);
          return (
            <li
              key={`${row.source}-${row.id}`}
              data-draft-source={row.source}
              data-draft-id={row.id}
              className="flex min-w-0 items-center gap-2 px-4 py-3 @sm/draft-forms:gap-3"
            >
              <span
                className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900"
                title={row.title}
              >
                {row.title}
              </span>
              {row.formCount > 1 && (
                <span
                  className="shrink-0 text-xs text-gray-500"
                  title={t("fill_draft_includes_added_forms", {
                    count: row.formCount - 1,
                  })}
                  aria-label={t("fill_draft_includes_added_forms", {
                    count: row.formCount - 1,
                  })}
                >
                  +{row.formCount - 1}
                </span>
              )}
              <Badge
                variant={row.source === "local" ? "yellow" : "secondary"}
                className="shrink-0 px-1.5 text-xs"
                title={t(
                  row.source === "local"
                    ? "draft_source_local_description"
                    : "draft_source_server_description",
                )}
              >
                {t(
                  row.source === "local"
                    ? "draft_source_local"
                    : "draft_source_server",
                )}
              </Badge>
              <time
                dateTime={row.savedAt}
                title={savedAt}
                aria-label={`${t("saved_on")} ${savedAt}`}
                className="hidden shrink-0 whitespace-nowrap text-xs text-gray-500 @xl/draft-forms:block"
              >
                {formatDateTime(row.savedAt, "DD MMM, hh:mm A")}
              </time>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="shrink-0 gap-1 px-2 text-primary-800"
                aria-label={t("continue_draft_named", { title: row.title })}
                title={t("continue_draft_named", { title: row.title })}
                disabled={isDiscarding}
                onClick={() => navigate(row.url)}
              >
                <span className="hidden @sm/draft-forms:inline">
                  {t("continue")}
                </span>
                <ArrowUpRight className="size-4" aria-hidden />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-gray-500 hover:text-red-600"
                aria-label={t("discard_draft_named", { title: row.title })}
                title={t("discard_draft_named", { title: row.title })}
                disabled={isDiscarding}
                onClick={() => setDraftToDiscard(row)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </li>
          );
        })}
      </ul>
      <ConfirmActionDialog
        open={!!draftToDiscard}
        onOpenChange={(open) => {
          if (!open) setDraftToDiscard(null);
        }}
        title={t("confirm_discard")}
        description={t("confirm_discard_draft_form")}
        onConfirm={() => {
          if (!draftToDiscard) return;
          if (draftToDiscard.source === "server") {
            discardSubmission(draftToDiscard.draft);
          } else if (discardLocalFillDraft(draftToDiscard.draft.scope)) {
            toast.success(t("form_submission_discarded"));
          } else {
            toast.error(t("form_submission_discard_failed"));
          }
          setDraftToDiscard(null);
        }}
        confirmText={t("discard")}
        variant="destructive"
        disabled={isDiscarding}
      />
    </section>
  );
}
