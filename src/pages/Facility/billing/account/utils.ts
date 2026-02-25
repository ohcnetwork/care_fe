import {
  AccountBase,
  AccountBillingStatus,
  AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";

export const canAddChargeItemsToAccount = (
  account: AccountRead | AccountBase | undefined,
) => {
  if (!account) return false;
  return (
    account.status === AccountStatus.active &&
    [
      AccountBillingStatus.open,
      AccountBillingStatus.carecomplete_notbilled,
      AccountBillingStatus.billing,
    ].includes(account.billing_status)
  );
};
