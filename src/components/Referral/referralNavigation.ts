export function getReferralDetailUrl(referralId: string, sourceUrl?: string) {
  const path = `/referrals/${encodeURIComponent(referralId)}`;
  return sourceUrl ? `${path}?${new URLSearchParams({ sourceUrl })}` : path;
}

export function getReferralResponseUrl(referralId: string, sourceUrl?: string) {
  const path = `/referrals/${encodeURIComponent(referralId)}/respond`;
  return sourceUrl ? `${path}?${new URLSearchParams({ sourceUrl })}` : path;
}
