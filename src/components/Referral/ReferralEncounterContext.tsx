import { GitPullRequestArrow, Loader2 } from "lucide-react";
import { Link, useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/careui/button";
import { FieldError } from "@/components/careui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/careui/item";
import { EncounterRead } from "@/types/emr/encounter/encounter";

import { referralNativeQueryParams } from "./referralNativeNavigation";
import {
  getReferralDetailUrl,
  getReferralResponseUrl,
} from "./referralNavigation";
import { useReferralPermissions } from "./useReferralPermissions";
import { useReferralReceivingEncounter } from "./useReferralReceivingEncounter";

export function ReferralEncounterContext({
  encounter,
}: {
  encounter: EncounterRead;
}) {
  const { t } = useTranslation();
  const [requested] = useQueryParams<{
    referralAppointmentId?: string;
    referralEncounterId?: string;
  }>();
  const params = referralNativeQueryParams(window.location.search);
  const appointmentContext = requested.referralAppointmentId !== undefined;
  const contextMatches = appointmentContext
    ? !!params.referralAppointmentId &&
      params.referralAppointmentId === encounter.appointment?.id &&
      (requested.referralEncounterId === undefined ||
        params.referralEncounterId === encounter.id)
    : params.referralEncounterId === encounter.id;
  const context = useReferralReceivingEncounter({
    referralId: contextMatches ? params.referralId : undefined,
    appointmentId: appointmentContext
      ? params.referralAppointmentId
      : undefined,
    facilityId: encounter.facility.id,
    patientId: encounter.patient.id,
    encounterId: encounter.id,
  });
  const verified =
    context.encounter?.id === encounter.id ? context.referral : undefined;
  const { canWrite } = useReferralPermissions(verified);

  if (!params.referralId || !contextMatches) return null;
  const visit = {
    appointmentId: context.appointment?.id,
    encounterId: context.encounter?.id,
    facilityId: encounter.facility.id,
  };

  return (
    <section
      className="careui mt-2"
      aria-label={t("referral_encounter_context")}
    >
      <Item variant="outline" className="bg-cui-background text-cui-foreground">
        <ItemMedia variant="icon">
          {context.isLoading ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <GitPullRequestArrow aria-hidden="true" />
          )}
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle>{t("referral_encounter_context")}</ItemTitle>
          {context.isLoading ? (
            <ItemDescription role="status">
              {t("referral_appointment_context_loading")}
            </ItemDescription>
          ) : context.error ? (
            <FieldError role="alert">
              {t("referral_encounter_context_unavailable")}
            </FieldError>
          ) : verified ? (
            <ItemDescription className="wrap-anywhere">
              {verified.title}
            </ItemDescription>
          ) : null}
        </ItemContent>
        <ItemActions className="flex-wrap">
          {context.error && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void context.refetch()}
            >
              {t("retry")}
            </Button>
          )}
          {verified && (
            <>
              <Link
                href={getReferralDetailUrl(
                  verified.id,
                  params.referralSourceUrl,
                  visit,
                )}
                className={buttonVariants({ variant: "outline", size: "sm" })}
              >
                {t("referral_view")}
              </Link>
              {canWrite &&
                ["pending", "in_progress"].includes(verified.status) && (
                  <Link
                    href={getReferralResponseUrl(
                      verified.id,
                      params.referralSourceUrl,
                      visit,
                    )}
                    className={buttonVariants({ size: "sm" })}
                  >
                    {t("referral_respond")}
                  </Link>
                )}
            </>
          )}
        </ItemActions>
      </Item>
    </section>
  );
}
