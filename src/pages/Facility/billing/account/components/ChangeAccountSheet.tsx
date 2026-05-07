import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  AccountBase,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import { ChargeItemRead } from "@/types/billing/chargeItem/chargeItem";
import chargeItemApi from "@/types/billing/chargeItem/chargeItemApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface ChangeAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  currentAccountId: string;
  chargeItems: ChargeItemRead[];
  onSuccess: () => void;
}

export default function ChangeAccountSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  currentAccountId,
  chargeItems,
  onSuccess,
}: ChangeAccountSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const { data: accountsResponse, isLoading } = useQuery({
    queryKey: ["accounts", patientId, facilityId, "change-account"],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: patientId,
        status: AccountStatus.active,
        limit: 50,
      },
    }),
    enabled: open,
  });

  const accounts = (accountsResponse?.results as AccountBase[])?.filter(
    (account) => account.id !== currentAccountId,
  );

  const { mutate: changeAccount, isPending } = useMutation({
    mutationFn: mutate(chargeItemApi.changeAccount, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("charge_items_account_changed"));
      queryClient.invalidateQueries({
        queryKey: ["infinite-chargeItems", currentAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: ["account"],
      });
      onSuccess();
      onOpenChange(false);
      setSelectedAccountId(null);
    },
    onError: (error) => {
      toast.error(error.message || t("charge_items_account_change_failed"));
    },
  });

  const handleSubmit = () => {
    if (!selectedAccountId) return;
    changeAccount({
      target_account: selectedAccountId,
      charge_items: chargeItems.map((item) => item.id),
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) setSelectedAccountId(null);
      }}
    >
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("change_account")}</SheetTitle>
          <SheetDescription>
            {t("change_account_description", {
              count: chargeItems.length,
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {t("selected_items")} ({chargeItems.length})
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1 rounded-md border p-2">
              {chargeItems.map((item) => (
                <div
                  key={item.id}
                  className="text-sm text-gray-600 flex justify-between"
                >
                  <span className="truncate">{item.title}</span>
                  <MonetaryDisplay amount={item.total_price} />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              {t("select_target_account")}
            </p>
            {isLoading ? (
              <TableSkeleton count={3} />
            ) : !accounts?.length ? (
              <EmptyState
                icon={
                  <CareIcon icon="l-user" className="text-primary size-6" />
                }
                title={t("no_other_accounts_available")}
              />
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    className={`w-full text-left rounded-md border p-3 transition-colors hover:bg-gray-50 ${
                      selectedAccountId === account.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-200"
                    }`}
                    onClick={() => setSelectedAccountId(account.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {account.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <Badge variant={ACCOUNT_STATUS_COLORS[account.status]}>
                          {t(account.status)}
                        </Badge>
                        <Badge
                          variant={
                            ACCOUNT_BILLING_STATUS_COLORS[
                              account.billing_status
                            ]
                          }
                        >
                          {t(account.billing_status)}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="pt-2">
          <SheetClose asChild>
            <Button variant="outline" type="button">
              {t("cancel")}
            </Button>
          </SheetClose>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAccountId || isPending}
          >
            <ArrowRightLeft className="size-4 mr-2" />
            {isPending ? t("moving") : t("change_account")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
