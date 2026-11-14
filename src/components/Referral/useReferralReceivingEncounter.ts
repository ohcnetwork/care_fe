import { useQuery } from "@tanstack/react-query";

import useAuthUser from "@/hooks/useAuthUser";
import encounterApi from "@/types/emr/encounter/encounterApi";
import referralApi, {
  referralAvailabilityApi,
} from "@/types/emr/referral/referralApi";
import scheduleApis from "@/types/scheduling/scheduleApi";
import { callApi } from "@/Utils/request/query";
import { HTTPError } from "@/Utils/request/types";

import { findAppointmentReferralAttachment } from "./useAppointmentReferral";

interface ReferralVisitContext {
  referralId?: string;
  appointmentId?: string;
  facilityId?: string;
  patientId?: string;
  encounterId?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Verify an authorized receiving visit against the actual referral destination.
 * Appointment visits require the persisted referral link. Direct encounter
 * context selects a readable clinical visit; it does not establish a stored link.
 */
export function useReferralReceivingEncounter(context: ReferralVisitContext) {
  const user = useAuthUser();
  const { referralId, appointmentId, facilityId, patientId, encounterId } =
    context;
  const hasAppointment = appointmentId !== undefined;
  const requested =
    !!referralId &&
    (hasAppointment || encounterId !== undefined || facilityId !== undefined);
  const valid =
    requested &&
    [
      referralId,
      facilityId,
      hasAppointment ? appointmentId : encounterId,
    ].every((value) => typeof value === "string" && UUID.test(value)) &&
    [patientId, encounterId].every(
      (value) => value === undefined || UUID.test(value),
    );
  const visit = useQuery({
    queryKey: [
      "referrals",
      referralId,
      "receiving-visit",
      appointmentId,
      facilityId,
      patientId,
      encounterId,
      user.id,
    ],
    queryFn: async ({ signal }) => {
      const [referral, attachment, appointment, directEncounter] =
        await Promise.all([
          callApi(referralApi.get, {
            pathParams: { referralId: referralId! },
            signal,
            silent: true,
          }),
          hasAppointment
            ? findAppointmentReferralAttachment(
                referralId!,
                appointmentId!,
                signal,
              )
            : undefined,
          hasAppointment
            ? callApi(scheduleApis.appointments.retrieve, {
                pathParams: { facilityId: facilityId!, id: appointmentId! },
                signal,
                silent: true,
              })
            : undefined,
          !hasAppointment
            ? callApi(encounterApi.get, {
                pathParams: { id: encounterId! },
                signal,
                silent: true,
              })
            : undefined,
        ]);
      if (
        referral.id !== referralId ||
        (patientId && patientId !== referral.patient)
      )
        throw new Error("Referral patient context does not match");
      if (
        hasAppointment &&
        (!attachment ||
          attachment.referral !== referralId ||
          attachment.attachment_type !== "response" ||
          !appointment ||
          appointment.id !== appointmentId ||
          appointment.facility.id !== facilityId ||
          appointment.patient.id !== referral.patient ||
          (encounterId && appointment.associated_encounter?.id !== encounterId))
      )
        throw new Error("Referral appointment context does not match");

      const availability = await callApi(referralAvailabilityApi.get, {
        pathParams: { availabilityId: referral.availability },
        signal,
        silent: true,
      });
      if (
        availability.id !== referral.availability ||
        !["facility", "internal_organization"].includes(
          availability.entity_type,
        ) ||
        availability.facility !== facilityId
      )
        throw new Error("Visit is not at this referral's destination");
      const localEncounterId = hasAppointment
        ? appointment?.associated_encounter?.id
        : encounterId;
      const encounter =
        directEncounter ??
        (localEncounterId
          ? await callApi(encounterApi.get, {
              pathParams: { id: localEncounterId },
              signal,
              silent: true,
            })
          : undefined);
      if (
        encounter &&
        (encounter.id !== localEncounterId ||
          encounter.patient.id !== referral.patient ||
          encounter.facility.id !== facilityId ||
          (appointment && encounter.appointment?.id !== appointment.id))
      )
        throw new Error("Referral encounter context does not match");
      return { referral, appointment, encounter };
    },
    enabled: valid,
    retry: false,
  });
  const data = valid && !visit.isError ? visit.data : undefined;
  const error: unknown = visit.error;
  const transientFailure =
    error instanceof HTTPError
      ? error.status >= 500 || error.status === 408
      : error instanceof Error && error.message === "Network Error";
  return {
    referral: data?.referral,
    appointment: data?.appointment,
    encounter: data?.encounter,
    // Preserve a response draft after a temporary refresh failure. Consumers
    // must disable writes; authorization failures and mismatches never retain it.
    previousEncounter:
      valid && transientFailure ? visit.data?.encounter : undefined,
    isFetching: valid && visit.isFetching,
    isLoading: valid && visit.isPending,
    error:
      requested && !valid
        ? new Error("Invalid referral visit context")
        : visit.error,
    refetch: () => (valid ? visit.refetch() : undefined),
  };
}
