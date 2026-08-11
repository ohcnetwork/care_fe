import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { navigate } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { reviveDraftResponses } from "@/components/QuestionnaireV2/fill/draft/fillDraftCore";
import { QuestionnaireFormRenderer } from "@/components/QuestionnaireV2/form/FormCanvas";
import { formSubmissionKeys } from "@/components/QuestionnaireV2/queryKeys";
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
 *
 * The clone is load-bearing: `reviveDraftResponses` rewrites entries IN
 * PLACE, and these objects belong to the TanStack Query cache — the same
 * `submission` this component spreads back into the discard PUT. Without
 * it, rendering the preview would silently rewrite the dump we later send
 * (dates re-serialized, unparseable ones dropped).
 */
function draftResponsesRecord(
  responses: QuestionnaireResponse[],
): Record<string, QuestionnaireResponse> {
  const record: Record<string, QuestionnaireResponse> = {};
  for (const response of structuredClone(responses)) {
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

  // Stable identity — the renderer's context value is keyed on it, so an
  // inline literal would re-render every consumer of every preview's form
  // context on each render of this list.
  const subject = useMemo(
    () => ({ facilityId, patientId, encounterId }),
    [facilityId, patientId, encounterId],
  );

  const { data: formSubmissions } = useQuery({
    queryKey: formSubmissionKeys.list(encounterId),
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
        queryKey: formSubmissionKeys.list(encounterId),
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

          // `response_dump` is an untyped blob written by whoever saved the
          // draft (this app, a plugin, an older release) — shape-check it
          // instead of trusting the cast above.
          if (
            !questionnaire ||
            !Array.isArray(questions) ||
            !Array.isArray(responses)
          ) {
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
                {/* `initialResponses` seeds the renderer's store once, at
                    creation — by design, so a live questionnaire edit can't
                    wipe in-progress answers. A re-saved draft therefore
                    needs a NEW store, which the timestamped key forces;
                    without it this preview would keep showing the answers
                    it first mounted with. */}
                <QuestionnaireFormRenderer
                  key={`${submission.id}-${submission.modified_date ?? submission.created_date}`}
                  questionnaire={questionnaire}
                  mode="readonly"
                  subject={subject}
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
