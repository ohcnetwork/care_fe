import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  getPaymentTypeLabelKey,
  PaymentReconciliationRead,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";
import paymentReconciliationApi from "@/types/billing/paymentReconciliation/paymentReconciliationApi";
import { multiply } from "@/Utils/decimal";
import mutate from "@/Utils/request/mutate";
import { formatDateTime } from "@/Utils/utils";

import TargetAccountPicker from "@/pages/Facility/billing/account/components/TargetAccountPicker";

interface ChangePaymentAccountSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  patientId: string;
  currentAccountId: string;
  payments: PaymentReconciliationRead[];
  onSuccess: () => void;
}

export default function ChangePaymentAccountSheet({
  open,
  onOpenChange,
  facilityId,
  patientId,
  currentAccountId,
  payments,
  onSuccess,
}: ChangePaymentAccountSheetProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );

  const { mutate: changeAccount, isPending } = useMutation({
    mutationFn: mutate(paymentReconciliationApi.changeAccount, {
      pathParams: { facilityId },
    }),
    onSuccess: () => {
      toast.success(t("payments_account_changed"));
      queryClient.invalidateQueries({
        queryKey: ["payments", currentAccountId],
      });
      queryClient.invalidateQueries({
        queryKey: ["account"],
      });
      onSuccess();
      onOpenChange(false);
      setSelectedAccountId(null);
    },
    onError: (error) => {
      toast.error(error.message || t("payments_account_change_failed"));
    },
  });

  const handleSubmit = () => {
    if (!selectedAccountId) return;
    changeAccount({
      target_account: selectedAccountId,
      payment_reconciliations: payments.map((p) => p.id),
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
      <SheetContent size="md">
        <SheetHeader>
          <SheetTitle>{t("change_account")}</SheetTitle>
          <SheetDescription>
            {t("change_payment_account_description", {
              count: payments.length,
            })}
          </SheetDescription>
        </SheetHeader>

        <SheetBody>
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">
                {t("selected_payments")} ({payments.length})
              </p>
              <ul className="max-h-40 overflow-y-auto divide-y rounded-md border bg-white">
                {payments.map((payment) => (
                  <li
                    key={payment.id}
                    className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-gray-950">
                        {t(
                          getPaymentTypeLabelKey(
                            payment.reconciliation_type,
                            payment.is_credit_note,
                          ),
                        )}
                        {payment.payment_datetime && (
                          <span className="text-gray-500">
                            {" · "}
                            {formatDateTime(
                              payment.payment_datetime,
                              "DD MMM YYYY",
                            )}
                          </span>
                        )}
                      </span>
                      <span className="truncate font-mono text-xs text-gray-500">
                        {payment.id}
                      </span>
                    </div>
                    <MonetaryDisplay
                      amount={multiply(
                        payment.amount,
                        payment.is_credit_note ? -1 : 1,
                      )}
                      className="shrink-0 font-medium text-gray-950"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <TargetAccountPicker
              facilityId={facilityId}
              patientId={patientId}
              currentAccountId={currentAccountId}
              enabled={open}
              value={selectedAccountId}
              onValueChange={setSelectedAccountId}
            />
          </div>
        </SheetBody>

        <SheetFooter>
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
