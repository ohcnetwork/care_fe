import { Spinner } from "@/components/ui/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, GitPullRequestArrow } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button, buttonVariants } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

import { referralResourceError } from "./referralResourceError";
import {
  findAppointmentReferralAttachment,
  ReferralAppointment,
  useAppointmentReferral,
} from "./useAppointmentReferral";

export function ReferralAppointmentContext({
  appointment,
}: {
  appointment: ReferralAppointment;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const context = useAppointmentReferral(appointment.patient.id);
  const referralId = context.referral?.id;
  const queryKey = [
    "referrals",
    referralId,
    "appointment-link",
    appointment.id,
  ];
  const attachment = useQuery({
    queryKey,
    queryFn: ({ signal }) =>
      findAppointmentReferralAttachment(referralId!, appointment.id, signal),
    enabled: !!referralId,
    retry: false,
  });
  const attach = useMutation({
    mutationFn: () => context.attachAppointment(appointment),
    retry: false,
    onSuccess: (record) => queryClient.setQueryData(queryKey, record),
  });
  if (!context.requested) return null;
  const checking = context.isLoading || (!!referralId && attachment.isPending);
  const linked = !!attachment.data;
  return (
    <section className="mb-4" aria-label={t("referral_appointment_context")}>
      <Item variant="outline" className="bg-background text-foreground">
        <ItemMedia variant="icon">
          {checking ? (
            <Spinner className="animate-spin" />
          ) : linked ? (
            <CheckCircle2 />
          ) : (
            <GitPullRequestArrow />
          )}
        </ItemMedia>
        <ItemContent>
          <ItemTitle>{t("referral_appointment_context")}</ItemTitle>
          {context.error ? (
            <FieldError role="alert">{context.error}</FieldError>
          ) : checking ? (
            <ItemDescription role="status">
              {t("referral_appointment_context_loading")}
            </ItemDescription>
          ) : context.referral && !attachment.isError ? (
            <ItemDescription>
              {t(
                linked
                  ? "referral_appointment_linked"
                  : "referral_appointment_not_linked",
                { title: context.referral.title },
              )}
            </ItemDescription>
          ) : null}
          {attachment.isError && (
            <FieldError role="alert">
              {t("referral_appointment_link_status_error")}
            </FieldError>
          )}
          {attach.isError && !linked && (
            <FieldError role="alert">
              {referralResourceError(
                attach.error,
                t("referral_appointment_link_error"),
              )}
            </FieldError>
          )}
        </ItemContent>
        <ItemActions className="flex-wrap">
          {context.canRetry && (
            <Button
              size="sm"
              variant="outline"
              disabled={context.isRefetching}
              onClick={() => void context.refetch()}
            >
              {t("retry")}
            </Button>
          )}
          {context.referral && !linked && !checking && (
            <Button
              size="sm"
              disabled={attach.isPending}
              onClick={() => attach.mutate()}
            >
              {attach.isPending && <Spinner className="size-4 animate-spin" />}
              {t("referral_appointment_link")}
            </Button>
          )}
          {context.returnUrl && (
            <Link
              href={context.returnUrl}
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              <ArrowLeft className="size-4" />
              {t("referral_return_to_referral")}
            </Link>
          )}
        </ItemActions>
      </Item>
    </section>
  );
}
