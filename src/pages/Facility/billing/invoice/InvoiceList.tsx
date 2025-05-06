import { useTranslation } from "react-i18next";

import Page from "@/components/Common/Page";

import InvoicesData from "./InvoicesData";

export function InvoiceList({
  facilityId,
  accountId,
}: {
  facilityId: string;
  accountId?: string;
}) {
  const { t } = useTranslation();

  return (
    <Page title={t("invoices")}>
      <div className="container mx-auto">
        <div className="mb-4">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {t("invoice_management")}
              </h1>
              <p className="text-gray-600 text-sm">
                {accountId
                  ? t("view_and_manage_account_invoices")
                  : t("view_and_manage_invoices")}
              </p>
            </div>
          </div>
          <InvoicesData
            facilityId={facilityId}
            accountId={accountId}
            className="rounded-lg border mt-2"
          />
        </div>
      </div>
    </Page>
  );
}

export default InvoiceList;
