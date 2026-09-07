import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { MonetaryDisplay } from "@/components/ui/monetary-display";

import { cn } from "@/lib/utils";

import { InvoiceRead, InvoiceStatus } from "@/types/billing/invoice/invoice";
import invoiceApi from "@/types/billing/invoice/invoiceApi";
import {
  PAYMENT_RECONCILIATION_METHOD_MAP,
  PaymentReconciliationStatus,
} from "@/types/billing/paymentReconciliation/paymentReconciliation";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";
import mutate from "@/Utils/request/mutate";

interface UseInvoiceStatusActionsParams {
  facilityId: string;
  invoiceId: string | undefined;
  invoice: InvoiceRead | undefined;
  /**
   * Called after any of the status mutations (cancel / entered-in-error /
   * lock / unlock) succeeds. Use it to invalidate additional queries or run
   * side effects specific to the calling screen.
   */
  onSuccess?: () => void;
}

/**
 * Encapsulates the invoice status-change flow (cancel, mark as entered in
 * error, lock/unlock) together with the confirmation dialogs — including the
 * "active payments / credit notes" warning shown before a destructive change.
 *
 * Callers render their own trigger UI (menu items, buttons) that invoke the
 * returned handlers, and render `dialogs` somewhere in their tree.
 */
export function useInvoiceStatusActions({
  facilityId,
  invoiceId,
  invoice,
  onSuccess,
}: UseInvoiceStatusActionsParams) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [activePaymentsDialogOpen, setActivePaymentsDialogOpen] =
    useState(false);
  const [selectedStatus, setSelectedStatus] = useState<InvoiceStatus | null>(
    null,
  );

  const invalidateAndNotify = () => {
    queryClient.invalidateQueries({ queryKey: ["invoice"] });
    onSuccess?.();
  };

  const { mutate: cancelInvoice, isPending: isCancelPending } = useMutation({
    mutationFn: mutate(invoiceApi.cancelInvoice, {
      pathParams: { facilityId, invoiceId: invoiceId ?? "" },
    }),
    onSuccess: () => {
      toast.success(t("invoice_cancelled_successfully"));
      invalidateAndNotify();
    },
    onError: () => {
      toast.error(t("failed_to_cancel_invoice"));
    },
  });

  const { mutate: lockInvoice, isPending: isLockPending } = useMutation({
    mutationFn: mutate(invoiceApi.lockInvoice, {
      pathParams: { facilityId, invoiceId: invoiceId ?? "" },
    }),
    onSuccess: () => {
      toast.success(t("invoice_locked_successfully"));
      invalidateAndNotify();
    },
    onError: () => {
      toast.error(t("failed_to_lock_invoice"));
    },
  });

  const { mutate: unlockInvoice, isPending: isUnlockPending } = useMutation({
    mutationFn: mutate(invoiceApi.unlockInvoice, {
      pathParams: { facilityId, invoiceId: invoiceId ?? "" },
    }),
    onSuccess: () => {
      toast.success(t("invoice_unlocked_successfully"));
      invalidateAndNotify();
    },
    onError: () => {
      toast.error(t("failed_to_unlock_invoice"));
    },
  });

  const activePayments =
    invoice?.payments?.filter(
      (p) => p.status === PaymentReconciliationStatus.active,
    ) ?? [];
  const activeCreditNotes =
    invoice?.credit_notes?.filter(
      (p) => p.status === PaymentReconciliationStatus.active,
    ) ?? [];

  const promptStatusChange = (status: InvoiceStatus) => {
    setSelectedStatus(status);
    if (activePayments.length > 0 || activeCreditNotes.length > 0) {
      setActivePaymentsDialogOpen(true);
      return;
    }
    setReasonDialogOpen(true);
  };

  const promptCancel = () => promptStatusChange(InvoiceStatus.cancelled);
  const promptEnteredInError = () =>
    promptStatusChange(InvoiceStatus.entered_in_error);

  const handleConfirm = () => {
    if (!selectedStatus) return;
    cancelInvoice({ reason: selectedStatus });
    setReasonDialogOpen(false);
  };

  const dialogs = (
    <>
      {/* Confirm cancel / mark as entered in error */}
      <AlertDialog
        open={reasonDialogOpen}
        onOpenChange={(open) => {
          setReasonDialogOpen(open);
          if (!open) {
            setTimeout(() => setSelectedStatus(null), 150);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {selectedStatus === InvoiceStatus.entered_in_error ? (
                  <p>{t("are_you_sure_want_to_mark_as_error")}</p>
                ) : (
                  <p>{t("are_you_sure_want_to_cancel_invoice")}</p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelPending}>
              {t("cancel")}
              <ShortcutBadge actionId="cancel-action" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={isCancelPending}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t("confirm")}
              <ShortcutBadge actionId="submit-action" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Warning shown when active payments / credit notes exist */}
      <AlertDialog
        open={activePaymentsDialogOpen}
        onOpenChange={setActivePaymentsDialogOpen}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedStatus === InvoiceStatus.entered_in_error
                ? t("mark_as_entered_in_error_warning")
                : t("cancel_invoice_warning")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  {t("invoice_has_active_payments_or_credit_notes_warning")}
                </p>

                {activePayments.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      {t("active_payments")}
                    </div>
                    {activePayments.map((payment, index) => (
                      <div
                        key={payment.id}
                        className="flex justify-between text-sm border-t border-gray-100 pt-1"
                      >
                        <span className="text-gray-600">
                          {index + 1}.{" "}
                          <span className="font-mono text-xs">
                            {payment.id}
                          </span>
                          {" - "}
                          {PAYMENT_RECONCILIATION_METHOD_MAP[payment.method]}
                          {payment.reference_number &&
                            ` (${payment.reference_number})`}
                        </span>
                        <span className="font-medium text-gray-900">
                          <MonetaryDisplay amount={payment.amount} />
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-medium">
                      <span className="text-gray-700">{t("total")}</span>
                      <span className="text-green-600">
                        <MonetaryDisplay amount={invoice?.total_payments} />
                      </span>
                    </div>
                  </div>
                )}

                {activeCreditNotes.length > 0 && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                    <div className="text-sm font-medium text-gray-700">
                      {t("active_credit_notes")}
                    </div>
                    {activeCreditNotes.map((creditNote, index) => (
                      <div
                        key={creditNote.id}
                        className="flex justify-between text-sm border-t border-gray-100 pt-1"
                      >
                        <span className="text-gray-600">
                          {index + 1}.{" "}
                          <span className="font-mono text-xs">
                            {creditNote.id}
                          </span>
                          {" - "}
                          {PAYMENT_RECONCILIATION_METHOD_MAP[creditNote.method]}
                          {creditNote.reference_number &&
                            ` (${creditNote.reference_number})`}
                        </span>
                        <span className="font-medium text-gray-900">
                          <MonetaryDisplay amount={creditNote.amount} />
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm border-t border-gray-200 pt-2 font-medium">
                      <span className="text-gray-700">{t("total")}</span>
                      <span className="text-red-600">
                        <MonetaryDisplay amount={invoice?.total_credit_notes} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedStatus(null)}>
              {t("cancel")}
              <ShortcutBadge actionId="cancel-action" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setActivePaymentsDialogOpen(false);
                setReasonDialogOpen(true);
              }}
              className={cn(buttonVariants({ variant: "destructive" }))}
            >
              {t("proceed")}
              <ShortcutBadge actionId="submit-action" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return {
    promptCancel,
    promptEnteredInError,
    lockInvoice,
    unlockInvoice,
    isCancelPending,
    isLockPending,
    isUnlockPending,
    dialogs,
  };
}
