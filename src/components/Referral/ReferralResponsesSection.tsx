import { MessageSquare, Plus } from "lucide-react";
import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/careui/button";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import { formatDateTime, formatName } from "@/Utils/utils";

import { ReferralFormResponseCard } from "./ReferralFormResponseCard";
import { ReferralSharedRecords } from "./ReferralSharedRecords";

const RESPONSE_RECORD_CATEGORIES = ["response"] as const;

interface ReferralResponsesSectionProps {
  referral: ReferralRetrieve;
  canWrite: boolean;
  responseUrl: string;
}

export function ReferralResponsesSection({
  referral,
  canWrite,
  responseUrl,
}: ReferralResponsesSectionProps) {
  const { t } = useTranslation();
  const responses = referral.questionnaire_responses
    .filter((response) => response.questionnaire_type === "response")
    .sort((a, b) => Date.parse(b.created_date) - Date.parse(a.created_date));
  const latestResponse = responses.find(
    (response) => response.status === "completed",
  );
  const activeCount = responses.filter(
    (response) => response.status === "completed",
  ).length;

  return (
    <section
      aria-label={t("referral_responses")}
      className="overflow-hidden rounded-lg border border-cui-border bg-cui-background"
    >
      <header className="flex flex-wrap items-start justify-between gap-3 bg-cui-muted/30 p-4 sm:p-5">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <MessageSquare aria-hidden="true" className="size-5 shrink-0" />
            {t("referral_responses")}
            {activeCount > 0 && (
              <span className="text-sm font-normal text-cui-muted-foreground">
                · {activeCount}
              </span>
            )}
          </h2>
          {latestResponse && (
            <p className="text-xs text-cui-muted-foreground">
              {t("referral_latest_response")} ·{" "}
              {latestResponse.created_by &&
                `${formatName(latestResponse.created_by)} · `}
              {formatDateTime(latestResponse.created_date)}
            </p>
          )}
        </div>
        {canWrite && (
          <Button onClick={() => navigate(responseUrl)}>
            {latestResponse ? (
              <Plus aria-hidden="true" className="size-4" />
            ) : (
              <MessageSquare aria-hidden="true" className="size-4" />
            )}
            {t(latestResponse ? "referral_add_response" : "referral_respond")}
          </Button>
        )}
      </header>
      <div className="space-y-5 border-t border-cui-border p-4 empty:hidden sm:p-5">
        {referral.status === "completed" && latestResponse && (
          <p className="rounded-md bg-cui-muted px-3 py-2 text-sm">
            {t("referral_completed_summary")}
          </p>
        )}
        {responses.length > 0 && (
          <div className="space-y-4 divide-y divide-cui-border [&>section+section]:pt-4">
            {responses.map((response) => (
              <ReferralFormResponseCard
                key={response.id}
                response={response}
                referralId={referral.id}
                canWrite={canWrite}
                expanded={response.id === latestResponse?.id}
              />
            ))}
          </div>
        )}
        <ReferralSharedRecords
          referral={referral}
          canWrite={false}
          categories={RESPONSE_RECORD_CATEGORIES}
          title={t("referral_records_response")}
          hideWhenEmpty
        />
      </div>
    </section>
  );
}
