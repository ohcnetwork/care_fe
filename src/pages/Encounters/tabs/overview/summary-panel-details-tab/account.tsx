import { useQuery } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { AccountSheetButton } from "@/components/Patient/AccountSheet";

import query from "@/Utils/request/query";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { EncounterRead } from "@/types/emr/encounter/encounter";

import { EmptyState } from "./empty-state";

export const Account = ({
  encounter,
  canEdit,
}: {
  encounter: EncounterRead;
  canEdit: boolean;
}) => {
  const { t } = useTranslation();
  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", encounter.patient.id],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: encounter.facility.id },
      queryParams: {
        patient: encounter.patient.id,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
        limit: 1,
      },
    }),
  });

  if (isLoading) {
    return <CardListSkeleton count={1} />;
  }

  const account = response?.results[0];

  return (
    <div className="p-1">
      <div className="flex justify-between p-2">
        <span className="text-gray-950 font-semibold">{t("account")}:</span>
        <AccountSheetButton
          encounter={encounter}
          trigger={
            <SquarePen
              className="size-4 cursor-pointer text-gray-950"
              strokeWidth={1.5}
            />
          }
          canWrite={canEdit}
        />
      </div>

      <div className="bg-white rounded-md p-2 shadow">
        {!account ? (
          <EmptyState message={t("no_account_found")} />
        ) : (
          <div className="flex flex-row bg-gray-100 rounded-md p-2 border border-gray-200 justify-between">
            <span className="text-sm text-black font-semibold">
              {account.name}
            </span>
            <Badge
              variant={ACCOUNT_BILLING_STATUS_COLORS[account.billing_status]}
            >
              {account.billing_status}
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
