import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { reviveDraftResponses } from "@/components/QuestionnaireV2/fill/draft/fillDraftStore";
import { QuestionnaireFormRenderer } from "@/components/QuestionnaireV2/form/FormCanvas";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface FormSubmissionDraftsProps {
  facilityId: string;
  patientId: string;
  encounterId: string;
}

interface DraftQuestionnaireResponse {
  questionnaire: QuestionnaireRead;
  responses: QuestionnaireResponse[];
}

/**
 * The dump stores responses as an array; the renderer seeds from a
 * `question_id → response` record. JSON round-tripping flattened Dates to
 * strings, so revive them the same way the `?continue_draft=` restore path
 * does.
 */
function draftResponsesRecord(
  responses: QuestionnaireResponse[],
): Record<string, QuestionnaireResponse> {
  const record: Record<string, QuestionnaireResponse> = {};
  for (const response of responses) {
    record[response.question_id] = response;
  }
  return reviveDraftResponses(record);
}

export function FormSubmissionDrafts({
  facilityId,
  patientId,
  encounterId,
}: FormSubmissionDraftsProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [submissionToDiscard, setSubmissionToDiscard] =
    useState<FormSubmissionRead | null>(null);

  const { data: formSubmissions } = useQuery({
    queryKey: ["formSubmissions", encounterId],
    queryFn: query(formSubmissionApi.list, {
      queryParams: { encounter: encounterId, status: "draft" },
    }),
    enabled: !!encounterId,
  });

  const { mutate: discardSubmission, isPending: isDiscarding } = useMutation({
    mutationFn: (submission: FormSubmissionRead) =>
      mutate(formSubmissionApi.update, {
        pathParams: {
          external_id: submission.id,
        },
      })({
        ...submission,
        status: "entered_in_error",
      }),
    onSuccess: () => {
      toast.success(t("form_submission_discarded"));
      queryClient.invalidateQueries({
        queryKey: ["formSubmissions", encounterId],
      });
    },
    onError: () => {
      toast.error(t("form_submission_discard_failed"));
    },
  });

  if (!formSubmissions || formSubmissions.results.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("draft_forms")}</h2>
      <div className="flex flex-col gap-4">
        {formSubmissions.results.map((submission) => {
          const questionnaireResponses = submission.response_dump
            ?.questionnaireResponses as DraftQuestionnaireResponse | undefined;
          const questionnaire = questionnaireResponses?.questionnaire;
          const questions = questionnaire?.questions;
          const responses = questionnaireResponses?.responses;

          if (!questionnaire || !questions || !responses) {
            return null;
          }

          return (
            <Card key={submission.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">
                    {questionnaire.title} - {t("saved_on")}{" "}
                    {new Date(
                      submission.modified_date || submission.created_date,
                    ).toLocaleString()}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSubmissionToDiscard(submission)}
                      disabled={isDiscarding}
                    >
                      {t("discard")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        navigate(
                          `/facility/${facilityId}/patient/${patientId}/encounter/${encounterId}/questionnaire/${questionnaire.id}?continue_draft=${submission.id}`,
                        )
                      }
                    >
                      {t("continue")}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="pb-4">
                <QuestionnaireFormRenderer
                  questionnaire={questionnaire}
                  mode="readonly"
                  subject={{ facilityId, patientId, encounterId }}
                  initialResponses={draftResponsesRecord(responses)}
                  hideHeader
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <ConfirmActionDialog
        open={!!submissionToDiscard}
        onOpenChange={(open) => {
          if (!open) setSubmissionToDiscard(null);
        }}
        title={t("confirm_discard")}
        description={t("confirm_discard_draft_form")}
        onConfirm={() => {
          if (submissionToDiscard) {
            discardSubmission(submissionToDiscard);
            setSubmissionToDiscard(null);
          }
        }}
        confirmText={t("discard")}
        variant="destructive"
        disabled={isDiscarding}
      />
    </div>
  );
}
