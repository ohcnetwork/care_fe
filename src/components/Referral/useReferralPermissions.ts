import { useQuery } from "@tanstack/react-query";

import { PERMISSION_WRITE_REFERRAL } from "@/common/Permissions";
import useAuthUser from "@/hooks/useAuthUser";
import encounterApi from "@/types/emr/encounter/encounterApi";
import patientApi from "@/types/emr/patient/patientApi";
import { ReferralRetrieve } from "@/types/emr/referral/referral";
import { referralAvailabilityApi } from "@/types/emr/referral/referralApi";
import { FacilityRead } from "@/types/facility/facility";
import facilityApi from "@/types/facility/facilityApi";
import { FacilityOrganizationRead } from "@/types/facilityOrganization/facilityOrganization";
import facilityOrganizationApi from "@/types/facilityOrganization/facilityOrganizationApi";
import organizationApi from "@/types/organization/organizationApi";
import query from "@/Utils/request/query";

interface ReferralPermissions {
  canWrite: boolean;
  isLoading: boolean;
  facilityId?: string;
  sourceFacilityId?: string;
  canWriteAtDestination: boolean;
  destinationFacility?: FacilityRead;
  destinationDepartment?: FacilityOrganizationRead;
}

/**
 * Use existing server-returned permissions at the referral's exact contexts.
 * Reading a referral or public availability never establishes write access.
 */
export function useReferralPermissions(
  referral?: ReferralRetrieve,
): ReferralPermissions {
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
    retryOnMount: false,
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
    retryOnMount: false,
  });
  const availabilityQuery = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "permissions",
      user.id,
      "availability",
      referral?.availability,
    ],
    queryFn: query(referralAvailabilityApi.get, {
      pathParams: { availabilityId: referral?.availability ?? "" },
      silent: true,
    }),
    enabled: !!referral,
    retry: false,
    retryOnMount: false,
  });
  const availability =
    referral &&
    !availabilityQuery.isError &&
    availabilityQuery.data?.id === referral.availability
      ? availabilityQuery.data
      : undefined;
  const destinationFacilityId =
    availability &&
    ["facility", "internal_organization"].includes(availability.entity_type)
      ? availability.facility
      : undefined;
  const destinationDepartmentId =
    availability?.entity_type === "internal_organization" &&
    destinationFacilityId
      ? availability.internal_organization
      : undefined;
  const externalOrganizationId =
    availability?.entity_type === "external_organization"
      ? availability.external_organization
      : undefined;
  const destinationFacilityQuery = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "permissions",
      user.id,
      "facility",
      destinationFacilityId,
    ],
    queryFn: query(facilityApi.get, {
      pathParams: { facilityId: destinationFacilityId ?? "" },
      silent: true,
    }),
    enabled: !!destinationFacilityId,
    retry: false,
    retryOnMount: false,
  });
  const destinationDepartmentQuery = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "permissions",
      user.id,
      "department",
      destinationFacilityId,
      destinationDepartmentId,
    ],
    queryFn: query(facilityOrganizationApi.get, {
      pathParams: {
        facilityId: destinationFacilityId ?? "",
        organizationId: destinationDepartmentId ?? "",
      },
      silent: true,
    }),
    enabled: !!destinationFacilityId && !!destinationDepartmentId,
    retry: false,
    retryOnMount: false,
  });
  const externalOrganizationQuery = useQuery({
    queryKey: [
      "referrals",
      referral?.id,
      "permissions",
      user.id,
      "external-organization",
      externalOrganizationId,
    ],
    queryFn: query(organizationApi.get, {
      pathParams: { id: externalOrganizationId ?? "" },
      silent: true,
    }),
    enabled: !!externalOrganizationId,
    retry: false,
    retryOnMount: false,
  });
  const destinationFacility =
    destinationFacilityId &&
    !destinationFacilityQuery.isError &&
    destinationFacilityQuery.data?.id === destinationFacilityId
      ? destinationFacilityQuery.data
      : undefined;
  const destinationDepartment =
    destinationDepartmentId &&
    !destinationDepartmentQuery.isError &&
    destinationDepartmentQuery.data?.id === destinationDepartmentId
      ? destinationDepartmentQuery.data
      : undefined;
  const externalOrganization =
    externalOrganizationId &&
    !externalOrganizationQuery.isError &&
    externalOrganizationQuery.data?.id === externalOrganizationId
      ? externalOrganizationQuery.data
      : undefined;
  // Facility destinations require the root role specifically. Department and
  // organization detail permissions already include their exact ancestor roles.
  const destinationPermissions =
    availability?.entity_type === "facility"
      ? destinationFacility?.root_org_permissions
      : availability?.entity_type === "internal_organization"
        ? destinationDepartment?.permissions
        : availability?.entity_type === "external_organization"
          ? externalOrganization?.permissions
          : undefined;
  const destinationContextAvailable =
    availability?.entity_type === "facility"
      ? !!destinationFacility
      : availability?.entity_type === "internal_organization"
        ? !!destinationFacility && !!destinationDepartment
        : availability?.entity_type === "external_organization"
          ? !!externalOrganization
          : false;
  const canWriteAtDestination =
    destinationContextAvailable &&
    (user.is_superuser ||
      destinationPermissions?.includes(PERMISSION_WRITE_REFERRAL) === true);
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
  // Patient roles cannot substitute for source encounter roles on a referral
  // with an encounter, even after another facility starts treating the patient.
  const sourcePermissions =
    sourceEncounter?.permissions ?? sourcePatient?.permissions;
  const sourceFacilityId = sourceEncounter?.facility.id;
  const canWrite =
    !!referral &&
    (user.is_superuser ||
      canWriteAtDestination ||
      sourcePermissions?.includes(PERMISSION_WRITE_REFERRAL) === true);

  return {
    canWrite,
    // A confirmed grant is sufficient. An independent denied source-context
    // probe must not unmount a receiving-side flow when another observer mounts.
    isLoading:
      !!referral &&
      !canWrite &&
      ((!user.is_superuser &&
        (referral.encounter ? encounter.isPending : patient.isPending)) ||
        availabilityQuery.isPending ||
        (!!destinationFacilityId && destinationFacilityQuery.isPending) ||
        (!!destinationDepartmentId && destinationDepartmentQuery.isPending) ||
        (!!externalOrganizationId && externalOrganizationQuery.isPending)),
    facilityId: sourceFacilityId ?? destinationFacility?.id,
    sourceFacilityId,
    canWriteAtDestination,
    destinationFacility,
    destinationDepartment,
  };
}
