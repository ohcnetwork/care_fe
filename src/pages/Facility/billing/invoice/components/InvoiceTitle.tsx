import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { InvoiceRead } from "@/types/billing/invoice/invoice";

interface InvoiceTitleProps {
  invoice: InvoiceRead;
}

export function InvoiceTitle({ invoice }: InvoiceTitleProps) {
  const { t } = useTranslation();

  return (
    <div className="mb-4 flex justify-between items-center">
      <div className="flex items-start gap-2">
        <div className="text-base uppercase">{t("invoice")}</div>
        <div className="text-gray-950 text-base font-semibold">
          {invoice.number}
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm">
        <span className="font-medium text-gray-700">{t("issue_date")}:</span>
        <span className="font-medium text-gray-950">
          {invoice.issue_date
            ? format(new Date(invoice.issue_date), "dd MMM, yyyy h:mm a")
            : "-"}
        </span>
      </div>
    </div>
  );
}
