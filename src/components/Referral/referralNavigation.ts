interface ReferralVisitNavigation {
  appointmentId?: string;
  facilityId?: string;
}

function referralQuery(sourceUrl?: string, visit?: ReferralVisitNavigation) {
  const params = new URLSearchParams();
  if (sourceUrl) params.set("sourceUrl", sourceUrl);
  if (visit?.appointmentId && visit.facilityId) {
    params.set("referralAppointmentId", visit.appointmentId);
    params.set("referralFacilityId", visit.facilityId);
  }
  return params.size ? `?${params}` : "";
}

export function getReferralDetailUrl(
  referralId: string,
  sourceUrl?: string,
  visit?: ReferralVisitNavigation,
) {
  const path = `/referrals/${encodeURIComponent(referralId)}`;
  return path + referralQuery(sourceUrl, visit);
}

export function getReferralResponseUrl(
  referralId: string,
  sourceUrl?: string,
  visit?: ReferralVisitNavigation,
) {
  const path = `/referrals/${encodeURIComponent(referralId)}/respond`;
  return path + referralQuery(sourceUrl, visit);
}
