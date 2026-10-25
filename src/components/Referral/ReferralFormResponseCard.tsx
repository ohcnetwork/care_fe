import { Badge } from "@/components/careui/badge";
import { Muted } from "@/components/careui/typography";
import { ReferralQuestionnaireResponse } from "@/types/emr/referral/referral";
import { formatDateTime, formatName } from "@/Utils/utils";
import { ChevronDown } from "lucide-react";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { ReferralQuestionnaireAnswers } from "./ReferralQuestionnaireAnswers";
import { ReferralVoidResponseDialog } from "./ReferralVoidResponseDialog";

export function ReferralFormResponseCard({
  response,
  referralId,
  canWrite,
  expanded,
}: {
  response: ReferralQuestionnaireResponse;
  referralId: string;
  canWrite: boolean;
  expanded: boolean;
}) {
  const { t } = useTranslation();
  const summaryRef = useRef<HTMLElement>(null);
  return (
    <section
      aria-label={response.questionnaire_snapshot.title}
      className="relative"
    >
      <details
        className="group"
        open={expanded && response.status !== "entered_in_error"}
      >
        <summary
          ref={summaryRef}
          className="cursor-pointer list-none rounded-md pr-10 focus-visible:outline-cui-ring [&::-webkit-details-marker]:hidden"
        >
          <div className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0 space-y-1">
              <h4 className="text-sm font-medium">
                {response.questionnaire_snapshot.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 text-xs text-cui-soft-foreground">
                {response.status === "entered_in_error" && (
                  <Badge variant="destructive" size="xs">
                    {t("entered_in_error")}
                  </Badge>
                )}
                <span>{formatDateTime(response.created_date)}</span>
                {response.created_by && (
                  <span>{formatName(response.created_by)}</span>
                )}
              </div>
            </div>
            <ChevronDown className="size-4 shrink-0 text-cui-muted-foreground transition-transform group-open:rotate-180" />
          </div>
        </summary>
        <div className="space-y-3 pt-2">
          <ReferralQuestionnaireAnswers
            results={response.questionnaire_response.results}
            questions={response.questionnaire_snapshot.questions}
          />
          {response.status === "entered_in_error" && (
            <Muted className="text-xs">
              {t("last_updated")}: {formatDateTime(response.modified_date)}
              {response.updated_by && ` · ${formatName(response.updated_by)}`}
            </Muted>
          )}
        </div>
      </details>
      {canWrite && response.status !== "entered_in_error" && (
        <div className="absolute right-0 top-1">
          <ReferralVoidResponseDialog
            referralId={referralId}
            responseId={response.id}
            title={response.questionnaire_snapshot.title}
            returnFocusRef={summaryRef}
          />
        </div>
      )}
    </section>
  );
}
