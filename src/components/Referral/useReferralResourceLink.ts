import { useQuery } from "@tanstack/react-query";
import { useQueryParams } from "raviger";

import { callApi } from "@/Utils/request/query";
import { ReferralResource } from "@/types/emr/referral/referralResource";
import scheduleApi from "@/types/scheduling/scheduleApi";

// Sharing a summary through a referral does not grant access to the source
// record's page. Use that page only after its own endpoint authorizes the read.
export function useReferralResourceLink(
  attachment: ReferralResource,
  patientId: string,
) {
  const facilityId = attachment.metadata?.facility_id;
  const [{ sourceUrl }] = useQueryParams<{ sourceUrl?: string }>();
  return useQuery({
    queryKey: [
      "referrals",
      attachment.referral,
      "resource-link",
      attachment.id,
      patientId,
      facilityId,
      sourceUrl,
    ],
    enabled: attachment.resource_type === "appointment" && !!facilityId,
    retry: false,
    queryFn: async ({ signal }) => {
      if (attachment.resource_type === "appointment" && facilityId) {
        const appointment = await callApi(scheduleApi.appointments.retrieve, {
          pathParams: { facilityId, id: attachment.resource_id },
          signal,
          silent: true,
        });
        if (appointment.patient.id !== patientId) return null;
        const params = new URLSearchParams({ referralId: attachment.referral });
        if (typeof sourceUrl === "string")
          params.set("referralSourceUrl", sourceUrl);
        return `/facility/${encodeURIComponent(appointment.facility.id)}/patient/${encodeURIComponent(patientId)}/appointments/${encodeURIComponent(appointment.id)}?${params}`;
      }
      return null;
    },
  });
}
