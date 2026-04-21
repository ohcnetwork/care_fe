import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { TableSkeleton } from "@/components/Common/SkeletonLoading";

import { cn } from "@/lib/utils";
import batchApi from "@/types/base/batch/batchApi";
import {
  ACCOUNT_BILLING_STATUS_COLORS,
  ACCOUNT_STATUS_COLORS,
  AccountBase,
  AccountRead,
  AccountStatus,
} from "@/types/billing/account/Account";
import accountApi from "@/types/billing/account/accountApi";
import {
  PaymentReconciliationIssuerType,
  PaymentReconciliationKind,
  PaymentReconciliationOutcome,
  PaymentReconciliationPaymentMethod,
  PaymentReconciliationStatus,
  PaymentReconciliationType,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

interface TransferPaymentSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  account: AccountRead;
}

export default function TransferPaymentSheet({
  open,
  onOpenChange,
  facilityId,
  account,
}: TransferPaymentSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [amount, setAmount] = useState("");

  const { data: accountsResponse, isLoading } = useQuery({
    queryKey: ["accounts", account.patient.id, facilityId, "transfer-payment"],
    queryFn: query(accountApi.listAccount, {
      pathParams: { facilityId },
      queryParams: {
        patient: account.patient.id,
        status: AccountStatus.active,
        limit: 50,
      },
    }),
    enabled: open,
  });

  const accounts = (accountsResponse?.results as AccountBase[])?.filter(
    (a) => a.id !== account.id,
  );

  const { mutate: submitTransfer, isPending } = useMutation({
    mutationFn: mutate(batchApi.batchRequest),
    onSuccess: () => {
      toast.success(t("payment_transferred_successfully"));
      queryClient.invalidateQueries({ queryKey: ["account", account.id] });
      queryClient.invalidateQueries({ queryKey: ["payments", account.id] });
      queryClient.invalidateQueries({
        queryKey: ["account", selectedAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: ["payments", selectedAccountId],
      });
      onOpenChange(false);
      setSelectedAccountId(null);
      setAmount("");
    },
    onError: (error) => {
      toast.error(error.message || t("payment_transfer_failed"));
    },
  });

  const handleSubmit = () => {
    if (!selectedAccountId || !amount || parseFloat(amount) <= 0) return;

    const now = format(new Date(), "yyyy-MM-dd'T'HH:mm");
    const basePayment = {
      reconciliation_type: PaymentReconciliationType.adjustment,
      status: PaymentReconciliationStatus.active,
      kind: PaymentReconciliationKind.deposit,
      issuer_type: PaymentReconciliationIssuerType.patient,
      outcome: PaymentReconciliationOutcome.complete,
      method: PaymentReconciliationPaymentMethod.cash,
      payment_datetime: now,
      amount,
      tendered_amount: amount,
      returned_amount: "0",
    };

    submitTransfer({
      requests: [
        {
          url: `/api/v1/facility/${facilityId}/payment_reconciliation/`,
          method: "POST",
          reference_id: "debit_current",
          body: {
            ...basePayment,
            account: account.id,
            is_credit_note: true,
            note: t("outgoing_transfer_note"),
          },
        },
        {
          url: `/api/v1/facility/${facilityId}/payment_reconciliation/`,
          method: "POST",
          reference_id: "credit_target",
          body: {
            ...basePayment,
            account: selectedAccountId,
            is_credit_note: false,
            note: t("incoming_transfer_note"),
          },
        },
      ],
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        if (!isOpen) {
          setSelectedAccountId(null);
          setAmount("");
        }
      }}
    >
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t("transfer_payment")}</SheetTitle>
          <SheetDescription>
            {t("transfer_payment_description")}
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>{t("amount")}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("enter_amount")}
            />
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
                {accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    className={cn(
                      "w-full text-left rounded-md border p-3 transition-colors hover:bg-gray-50",
                      selectedAccountId === acc.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-200",
                    )}
                    onClick={() => setSelectedAccountId(acc.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{acc.name}</span>
                      <div className="flex items-center gap-1">
                        <Badge variant={ACCOUNT_STATUS_COLORS[acc.status]}>
                          {t(acc.status)}
                        </Badge>
                        <Badge
                          variant={
                            ACCOUNT_BILLING_STATUS_COLORS[acc.billing_status]
                          }
                        >
                          {t(acc.billing_status)}
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
            disabled={
              !selectedAccountId ||
              !amount ||
              parseFloat(amount) <= 0 ||
              isPending
            }
          >
            {isPending ? (
              <>
                <CareIcon
                  icon="l-spinner"
                  className="mr-2 size-4 animate-spin"
                />
                {t("transferring")}
              </>
            ) : (
              t("transfer_payment")
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
