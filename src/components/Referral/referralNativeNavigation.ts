const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LOCAL_ORIGIN = "https://care.invalid";

/** Carry navigation context only; the receiving view verifies the referral and clinical visit through their existing APIs. */
export function referralNativeQueryParams(search: string) {
  const params = new URLSearchParams(search);
  const referralId = params.get("referralId");
  const result: Record<string, string> = {};
  if (!referralId || !UUID.test(referralId)) return result;
  result.referralId = referralId;

  const appointmentId = params.get("referralAppointmentId");
  const encounterId = params.get("referralEncounterId");
  // A malformed supplied ID must not turn an appointment context into a direct
  // visit, or silently discard an expected encounter during native navigation.
  if (
    [appointmentId, encounterId].some(
      (value) => value !== null && !UUID.test(value),
    )
  )
    return result;
  if (appointmentId) result.referralAppointmentId = appointmentId;
  if (encounterId) result.referralEncounterId = encounterId;
  const source = params.get("referralSourceUrl");
  if (source?.startsWith("/") && !source.startsWith("//")) {
    try {
      const url = new URL(source, LOCAL_ORIGIN);
      if (url.origin === LOCAL_ORIGIN) {
        result.referralSourceUrl = url.pathname + url.search + url.hash;
      }
    } catch {
      // Invalid source context is discarded, never used as a redirect target.
    }
  }
  return result;
}

export function appendReferralNativeContext(path: string, search: string) {
  const context = referralNativeQueryParams(search);
  if (!Object.keys(context).length) return path;
  const target = new URL(path, LOCAL_ORIGIN);
  if (target.origin !== LOCAL_ORIGIN) return path;
  for (const [key, value] of Object.entries(context)) {
    target.searchParams.set(key, value);
  }
  return target.pathname + target.search + target.hash;
}
