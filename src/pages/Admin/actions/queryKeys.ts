/** Query keys for the admin action configurations — the only place they
 *  are built, so invalidation reaches every list and detail structurally. */
export const actionConfigurationKeys = {
  all: ["actionConfigurations"] as const,
  list: (filters: unknown) =>
    [...actionConfigurationKeys.all, "list", filters] as const,
  detail: (id: string) =>
    [...actionConfigurationKeys.all, "detail", id] as const,
};
