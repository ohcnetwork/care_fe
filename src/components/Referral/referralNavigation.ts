interface ReferralVisitNavigation {
  appointmentId?: string;
  encounterId?: string;
  facilityId?: string;
}

function referralQuery(sourceUrl?: string, visit?: ReferralVisitNavigation) {
  const params = new URLSearchParams();
  if (sourceUrl) params.set("sourceUrl", sourceUrl);
  // Keep supplied context intact, including invalid empty values. The receiving
  // view must reject it rather than silently changing appointment/direct mode.
  if (visit?.appointmentId !== undefined)
    params.set("referralAppointmentId", visit.appointmentId);
  if (visit?.encounterId !== undefined)
    params.set("referralEncounterId", visit.encounterId);
  if (visit?.facilityId !== undefined)
    params.set("referralFacilityId", visit.facilityId);
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
