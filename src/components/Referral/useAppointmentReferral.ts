import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQueryParams } from "raviger";
import { useTranslation } from "react-i18next";

import referralApi from "@/types/emr/referral/referralApi";
import { ReferralResource } from "@/types/emr/referral/referralResource";
import referralResourceApi from "@/types/emr/referral/referralResourceApi";
import query, { callApi } from "@/Utils/request/query";

import { getReferralDetailUrl } from "./referralNavigation";
import { useReferralPermissions } from "./useReferralPermissions";

export interface ReferralAppointment {
  id: string;
  patient: { id: string };
  facility: { id: string; name: string };
}

function localSourceUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.startsWith("/")) return;
  try {
    const source = new URL(value, window.location.origin);
    if (
      source.origin === window.location.origin &&
      !source.pathname.startsWith("//")
    ) {
      return source.pathname + source.search + source.hash;
    }
  } catch {
    // A malformed return context must never become a navigation target.
  }
}

export async function findAppointmentReferralAttachment(
  referralId: string,
  appointmentId: string,
  signal?: AbortSignal,
): Promise<ReferralResource | null> {
  let offset = 0;
  while (true) {
    const page = await callApi(referralResourceApi.list, {
      pathParams: { referralId },
      queryParams: { resource_type: "appointment", limit: 100, offset },
      signal,
      silent: true,
    });
    // The backend uniqueness rule spans categories. An appointment already
    // shared as a source or metadata record must not be attached a second time.
    const existing = page.results.find(
      (attachment) => attachment.resource_id === appointmentId,
    );
    if (existing) return existing;
    offset += page.results.length;
    if (!page.results.length || offset >= page.count) return null;
  }
}

export function useAppointmentReferral(patientId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [params] = useQueryParams<{
    referralId?: string;
    referralSourceUrl?: string;
  }>();
  const requested = params.referralId !== undefined;
  const referralId =
    typeof params.referralId === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      params.referralId,
    )
      ? params.referralId
      : undefined;
  const referralQuery = useQuery({
    queryKey: ["referrals", "detail", referralId],
    queryFn: query(referralApi.get, {
      pathParams: { referralId: referralId ?? "" },
      silent: true,
    }),
    enabled: !!referralId,
    retry: false,
  });
  const readableReferral =
    !referralQuery.isError && referralQuery.data?.patient === patientId
      ? referralQuery.data
      : undefined;
  const { canWrite, isLoading: permissionsLoading } =
    useReferralPermissions(readableReferral);
  const isLoading =
    !!referralId && (referralQuery.isPending || permissionsLoading);
  let error: string | null = null;
  if (requested && !referralId)
    error = t("referral_appointment_context_invalid");
  else if (referralQuery.isError)
    error = t("referral_appointment_context_unavailable");
  else if (referralQuery.data && referralQuery.data.patient !== patientId)
    error = t("referral_appointment_context_mismatch");
  else if (referralQuery.data && !permissionsLoading && !canWrite)
    error = t("referral_appointment_context_readonly");

  const referral = !error && !isLoading ? referralQuery.data : undefined;
  const sourceUrl = localSourceUrl(params.referralSourceUrl);
  const returnUrl = readableReferral
    ? getReferralDetailUrl(readableReferral.id, sourceUrl)
    : undefined;
  const successQueryParams: {
    referralId?: string;
    referralSourceUrl?: string;
  } = referral
    ? {
        referralId: referral.id,
        ...(sourceUrl && { referralSourceUrl: sourceUrl }),
      }
    : {};

  const attachAppointment = async (appointment: ReferralAppointment) => {
    if (!referral || appointment.patient.id !== patientId)
      throw new Error(error ?? t("referral_appointment_context_invalid"));
    let attachment = await findAppointmentReferralAttachment(
      referral.id,
      appointment.id,
    );
    if (!attachment) {
      try {
        attachment = await callApi(referralResourceApi.create, {
          pathParams: { referralId: referral.id },
          body: {
            resource_type: "appointment",
            resource_id: appointment.id,
            attachment_type: "response",
            metadata: {
              facility_id: appointment.facility.id,
              facility_name: appointment.facility.name,
            },
          },
          silent: true,
        });
      } catch (error) {
        // A race or lost POST response can leave the link persisted. Reconcile
        // with a read; never automatically repeat the write or create a booking.
        attachment = await findAppointmentReferralAttachment(
          referral.id,
          appointment.id,
        ).catch(() => null);
        if (!attachment) throw error;
      }
    }
    await queryClient.invalidateQueries({ queryKey: ["referrals"] });
    return attachment;
  };

  return {
    requested,
    referral,
    isLoading,
    error,
    returnUrl,
    successQueryParams,
    attachAppointment,
    refetch: referralQuery.refetch,
    isRefetching: referralQuery.isRefetching,
    canRetry: !!referralId && referralQuery.isError,
  };
}
