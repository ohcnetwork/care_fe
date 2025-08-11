import { useQuery } from "@tanstack/react-query";
import { SquarePen } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { CardListSkeleton } from "@/components/Common/SkeletonLoading";
import { AccountSheetButton } from "@/components/Patient/AccountSheet";

import query from "@/Utils/request/query";
import { useEncounter } from "@/pages/Encounters/utils/EncounterProvider";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  AccountBillingStatus,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";

import { EmptyState } from "./empty-state";

export const Account = () => {
  const { t } = useTranslation();
  const {
    selectedEncounter: encounter,
    canWriteSelectedEncounter: canEdit,
    patientId,
    facilityId,
  } = useEncounter();

  const { data: response, isLoading } = useQuery({
    queryKey: ["accounts", patientId],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId: facilityId || "" },
      queryParams: {
        patient: patientId,
        status: AccountStatus.active,
        billing_status: AccountBillingStatus.open,
        limit: 1,
      },
    }),

    enabled: !!facilityId,
  });

  if (!encounter) return null;

  if (isLoading) {
    return <CardListSkeleton count={1} />;
  }

  const account = response?.results[0];

  return (
    <div className="bg-gray-100 rounded-md w-full border border-gray-200">
      <div className="p-1">
        <div className="flex justify-between p-2 text-gray-950 pr-3 ">
          <span className=" font-semibold">{t("account")}:</span>
          <AccountSheetButton
            encounter={encounter}
            trigger={
              <SquarePen className="size-4 cursor-pointer" strokeWidth={1.5} />
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
    </div>
  );
};
