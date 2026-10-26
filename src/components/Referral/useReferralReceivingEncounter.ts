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

/** A receiving encounter is linked through the existing appointment, never by
 * replacing the referral's originating encounter or trusting a URL alone. */
export function useReferralReceivingEncounter(context: ReferralVisitContext) {
  const user = useAuthUser();
  const { referralId, appointmentId, facilityId, patientId, encounterId } =
    context;
  const requested = !!referralId && !!appointmentId && !!facilityId;
  const valid =
    requested &&
    [referralId, appointmentId, facilityId, patientId, encounterId]
      .filter((value) => value !== undefined)
      .every((value) => UUID.test(value));
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
      const [referral, attachment, appointment] = await Promise.all([
        callApi(referralApi.get, {
          pathParams: { referralId: referralId! },
          signal,
          silent: true,
        }),
        findAppointmentReferralAttachment(referralId!, appointmentId!, signal),
        callApi(scheduleApis.appointments.retrieve, {
          pathParams: { facilityId: facilityId!, id: appointmentId! },
          signal,
          silent: true,
        }),
      ]);
      if (
        referral.id !== referralId ||
        !attachment ||
        attachment.referral !== referralId ||
        appointment.id !== appointmentId ||
        appointment.facility.id !== facilityId ||
        appointment.patient.id !== referral.patient ||
        (patientId && patientId !== referral.patient) ||
        (encounterId && appointment.associated_encounter?.id !== encounterId)
      )
        throw new Error("Referral appointment context does not match");

      const availability = await callApi(referralAvailabilityApi.get, {
        pathParams: { availabilityId: referral.availability },
        signal,
        silent: true,
      });
      if (
        attachment.attachment_type !== "response" ||
        !["facility", "internal_organization"].includes(
          availability.entity_type,
        ) ||
        availability.facility !== facilityId
      )
        throw new Error(
          "Appointment is not a receiving visit for this referral",
        );
      const localEncounterId = appointment.associated_encounter?.id;
      const encounter = localEncounterId
        ? await callApi(encounterApi.get, {
            pathParams: { id: localEncounterId },
            signal,
            silent: true,
          })
        : undefined;
      if (
        encounter &&
        (encounter.id !== localEncounterId ||
          encounter.patient.id !== referral.patient ||
          encounter.facility.id !== facilityId ||
          encounter.appointment?.id !== appointment.id)
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
