import { useQuery } from "@tanstack/react-query";
import { useId } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { isAccountActiveAndBillable } from "@/pages/Facility/billing/account/utils";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import query from "@/Utils/request/query";
import { formatDateTime } from "@/Utils/utils";

interface TargetAccountPickerProps {
  facilityId: string;
  patientId: string;
  /** The account items are being moved out of; excluded from the options. */
  currentAccountId: string;
  /** Whether to fetch accounts (e.g. only while the parent sheet is open). */
  enabled: boolean;
  value: string | null;
  onValueChange: (accountId: string | null) => void;
}

/**
 * Lists the patient's other accounts that can receive charge items or
 * payments (active and not billing-closed) as single-select choice cards.
 */
export default function TargetAccountPicker({
  facilityId,
  patientId,
  currentAccountId,
  enabled,
  value,
  onValueChange,
}: TargetAccountPickerProps) {
  const { t } = useTranslation();
  const labelId = useId();

  const { data: accountsResponse, isLoading } = useQuery({
    queryKey: ["accounts", patientId, facilityId, "change-account-target"],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        status: AccountStatus.active,
        limit: 50,
      },
    }),
    enabled,
  });

  const accounts = accountsResponse?.results.filter(
    (account) =>
      account.id !== currentAccountId && isAccountActiveAndBillable(account),
  );

  return (
    <div className="space-y-2">
      <p id={labelId} className="text-sm font-medium text-gray-700">
        {t("select_target_account")}
      </p>
      {isLoading ? (
        <TableSkeleton count={3} />
      ) : !accounts?.length ? (
        <EmptyState
          icon={<CareIcon icon="l-user" className="text-primary size-6" />}
          title={t("no_other_accounts_available")}
        />
      ) : (
        <RadioGroup
          aria-labelledby={labelId}
          value={value ?? ""}
          onValueChange={(next) => onValueChange(next || null)}
          className="max-h-80 overflow-y-auto gap-2"
        >
          {accounts.map((account) => {
            const id = `${labelId}-${account.id}`;
            const { start, end } = account.service_period ?? {};
            return (
              <FieldLabel key={account.id} htmlFor={id}>
                <Field orientation="horizontal">
                  <RadioGroupItem value={account.id} id={id} />
                  <FieldContent>
                    <FieldTitle>{account.name}</FieldTitle>
                    {start && (
                      <FieldDescription>
                        {formatDateTime(start, "DD MMM YYYY")}
                        {" – "}
                        {end
                          ? formatDateTime(end, "DD MMM YYYY")
                          : t("ongoing")}
                      </FieldDescription>
                    )}
                  </FieldContent>
                  <Badge
                    variant={
                      ACCOUNT_BILLING_STATUS_COLORS[account.billing_status]
                    }
                    className="shrink-0"
                  >
                    {t(account.billing_status)}
                  </Badge>
                </Field>
              </FieldLabel>
            );
          })}
        </RadioGroup>
      )}
    </div>
  );
}
