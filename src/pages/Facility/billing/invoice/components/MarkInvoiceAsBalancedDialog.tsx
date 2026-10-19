import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

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

import { InvoiceRead } from "@/types/billing/invoice/invoice";

import { multiply, subtract } from "@/Utils/decimal";
import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface MarkInvoiceAsBalancedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceRead;
  onConfirm: () => void;
  isPending?: boolean;
  /**
   * Optional keyboard shortcut action ids. Only supply these when rendered
   * inside a shortcut sub-context that registers them (e.g. InvoiceShow).
   */
  cancelShortcutActionId?: string;
  confirmShortcutActionId?: string;
  /**
   * Optional id for the confirm button, useful for E2E test selectors.
   */
  confirmButtonId?: string;
}

/**
 * Confirmation dialog shown before marking an invoice as balanced.
 *
 * Surfaces the invoice total, payments received, credit notes and the
 * resulting outstanding balance, along with a warning when an outstanding
 * balance would be moved to the account.
 */
export function MarkInvoiceAsBalancedDialog({
  open,
  onOpenChange,
  invoice,
  onConfirm,
  isPending,
  cancelShortcutActionId,
  confirmShortcutActionId,
  confirmButtonId,
}: MarkInvoiceAsBalancedDialogProps) {
  const { t } = useTranslation();

  const outstandingBalance = subtract(
    subtract(invoice.total_gross, invoice.total_payments),
    multiply(invoice.total_credit_notes || "0", invoice.is_refund ? -1 : 1),
  );

  const hasOutstandingBalance = parseFloat(outstandingBalance.toString()) > 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirm")}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>{t("are_you_sure_want_to_mark_as_balanced")}</p>
              <div className="bg-gray-50 border border-gray-200 rounded-md p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t("invoice_total")}</span>
                  <span className="font-medium text-gray-900">
                    <MonetaryDisplay amount={invoice.total_gross} />
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t("total_payments_received")}
                  </span>
                  <span className="font-medium text-green-600">
                    <MonetaryDisplay amount={invoice.total_payments} />
                  </span>
                </div>
                {parseFloat(invoice.total_credit_notes || "0") > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t("total_credit_notes")}
                    </span>
                    <span className="font-medium text-red-600">
                      <MonetaryDisplay amount={-invoice.total_credit_notes} />
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    {t("outstanding_balance")}
                  </span>
                  <span className="font-semibold text-gray-900">
                    <MonetaryDisplay amount={outstandingBalance} />
                  </span>
                </div>
              </div>
              {hasOutstandingBalance && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 flex gap-2 items-start">
                  <CareIcon
                    icon="l-exclamation-triangle"
                    className="text-yellow-600 size-5 mt-0.5 shrink-0"
                  />
                  <p className="text-sm text-yellow-800">
                    {t("mark_as_balanced_warning")}
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t("cancel")}
            {cancelShortcutActionId && (
              <ShortcutBadge actionId={cancelShortcutActionId} />
            )}
          </AlertDialogCancel>
          <AlertDialogAction
            id={confirmButtonId}
            onClick={onConfirm}
            disabled={isPending}
            className={cn(buttonVariants({ variant: "primary" }))}
          >
            {t("confirm")}
            {confirmShortcutActionId && (
              <ShortcutBadge actionId={confirmShortcutActionId} />
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
