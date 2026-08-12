import {
  AccountBase,
  AccountBillingStatus,
  AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";

export const isAccountActiveAndBillable = (
  account: AccountRead | AccountBase,
) => {
  return (
    account.status === AccountStatus.active && !isAccountBillingClosed(account)
  );
};

export const isAccountBillingClosed = (account: AccountRead | AccountBase) => {
  return [
    AccountBillingStatus.closed_baddebt,
    AccountBillingStatus.closed_voided,
    AccountBillingStatus.closed_completed,
    AccountBillingStatus.closed_combined,
  ].includes(account.billing_status);
};
