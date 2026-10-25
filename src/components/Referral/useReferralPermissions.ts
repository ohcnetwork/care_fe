import { useQuery } from "@tanstack/react-query";

import { PERMISSION_WRITE_REFERRAL } from "@/common/Permissions";
import useAuthUser from "@/hooks/useAuthUser";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import query from "@/Utils/request/query";

/**
 * Use the baseline source-context permission responses. Referral access alone
 * does not establish write access, and patient permissions cannot substitute
 * for encounter permissions when the referral has an originating encounter.
 */
export function useReferralPermissions(referral?: ReferralRetrieve) {
  const user = useAuthUser();
  const encounter = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "header",
      "encounter",
      referral?.encounter,
    ],
    queryFn: query(encounterApi.get, {
      pathParams: { id: referral?.encounter ?? "" },
      silent: true,
    }),
    enabled: !!referral?.encounter,
    retry: false,
  });
  const patient = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "header",
      "patient",
      referral?.patient,
    ],
    queryFn: query(patientApi.get, {
      pathParams: { id: referral?.patient ?? "" },
      silent: true,
    }),
    enabled: !!referral && !referral.encounter,
    retry: false,
  });
  const sourceEncounter =
    referral?.encounter &&
    !encounter.isError &&
    encounter.data?.id === referral.encounter &&
    encounter.data.patient.id === referral.patient
      ? encounter.data
      : undefined;
  const sourcePatient =
    referral &&
    !referral.encounter &&
    !patient.isError &&
    patient.data?.id === referral.patient
      ? patient.data
      : undefined;
  const permissions =
    sourceEncounter?.permissions ?? sourcePatient?.permissions;

  return {
    canWrite:
      !!referral &&
      (user.is_superuser ||
        permissions?.includes(PERMISSION_WRITE_REFERRAL) === true),
    isLoading:
      !!referral &&
      !user.is_superuser &&
      (referral.encounter ? encounter.isPending : patient.isPending),
    facilityId: sourceEncounter?.facility.id,
  };
}
