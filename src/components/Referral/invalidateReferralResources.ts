import { QueryClient, QueryKey } from "@tanstack/react-query";

import { ReferralResource } from "@/types/emr/referral/referralResource";

/** Refresh attachment views without replacing an open response form's mappings. */
export async function invalidateReferralResources(
  client: QueryClient,
  attachment: Pick<
    ReferralResource,
    "referral" | "resource_type" | "resource_id"
  >,
): Promise<void> {
  const prefix = ["referrals", attachment.referral];
  const keys: QueryKey[] = [
    [...prefix, "resources"],
    [...prefix, "resolved-resources"],
  ];

  if (attachment.resource_type === "appointment") {
    keys.push(
      [...prefix, "appointments"],
      [...prefix, "appointment-link", attachment.resource_id],
      [...prefix, "resource-link"],
    );
  }

  await Promise.all(
    keys.map((queryKey) => client.invalidateQueries({ queryKey })),
  );
}
