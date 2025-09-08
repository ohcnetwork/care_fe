import { Redirect } from "raviger";

import FacilityUsers from "@/components/Facility/FacilityUsers";
import ResourceCreate from "@/components/Resource/ResourceForm";

import { FacilityLayout } from "@/pages/Facility/FacilityLayout";

import { AppRoutes } from "@/Routers/AppRouter";
import AccountList from "@/pages/Facility/billing/account/AccountList";
import AccountShow from "@/pages/Facility/billing/account/AccountShow";
import CreateInvoicePage from "@/pages/Facility/billing/account/CreateInvoice";
import InvoiceList from "@/pages/Facility/billing/invoice/InvoiceList";
import InvoiceShow from "@/pages/Facility/billing/invoice/InvoiceShow";
import PrintInvoice from "@/pages/Facility/billing/invoice/PrintInvoice";
import PaymentReconciliationList from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList";
import PaymentReconciliationShow from "@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationShow";
import PrintPaymentReconciliation from "@/pages/Facility/billing/paymentReconciliation/PrintPaymentReconciliation";
import { LocationLayout } from "@/pages/Facility/locations/LocationLayout";
import { FacilityOverview } from "@/pages/Facility/overview";
import FacilityServices from "@/pages/Facility/services/FacilityServices";
import { ServiceLayout } from "@/pages/Facility/services/ServiceLayout";
import DiagnosticReportPrint from "@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint";
import DiagnosticReportView from "@/pages/Facility/services/diagnosticReports/DiagnosticReportView";
import ServiceRequestShow from "@/pages/Facility/services/serviceRequests/ServiceRequestShow";
import { SettingsLayout } from "@/pages/Facility/settings/layout";

const FacilityRoutes: AppRoutes = {
  "/facility": () => <Redirect to="/" />,
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityLayout>
      <FacilityOverview facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityLayout>
      <FacilityUsers facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <FacilityLayout>
      <ResourceCreate facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/settings*": ({ facilityId }) => (
    <FacilityLayout>
      <SettingsLayout facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/locations/:locationId*": ({
    facilityId,
    locationId,
  }) => (
    <FacilityLayout>
      <LocationLayout facilityId={facilityId} locationId={locationId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/services": ({ facilityId }) => (
    <FacilityLayout>
      <FacilityServices facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/services/:serviceId*": ({ facilityId, serviceId }) => (
    <FacilityLayout>
      <ServiceLayout facilityId={facilityId} serviceId={serviceId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/services_requests/:serviceRequestId": ({
    facilityId,
    serviceRequestId,
  }) => (
    <FacilityLayout>
      <ServiceRequestShow
        facilityId={facilityId}
        serviceRequestId={serviceRequestId}
      />
    </FacilityLayout>
  ),

  ...[
    "/facility/:facilityId/patient/:patientId/diagnostic_reports/:diagnosticReportId",
    "/organization/organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ facilityId, patientId, diagnosticReportId }) => (
      <FacilityLayout>
        <DiagnosticReportView
          patientId={patientId}
          facilityId={facilityId}
          diagnosticReportId={diagnosticReportId}
        />
      </FacilityLayout>
    );
    return acc;
  }, {}),
  ...[
    "/facility/:facilityId/patient/:patientId/diagnostic_reports/:diagnosticReportId/print",
    "/organization/organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ patientId, diagnosticReportId }) => (
      <FacilityLayout>
        <DiagnosticReportPrint
          patientId={patientId}
          diagnosticReportId={diagnosticReportId}
        />
      </FacilityLayout>
    );
    return acc;
  }, {}),
  "/facility/:facilityId/billing/accounts": ({ facilityId }) => (
    <FacilityLayout>
      <AccountList facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab="invoices"
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId/invoices": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab="invoices"
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId/charge_items": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab="charge_items"
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId/payments": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab="payments"
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId/bed_charge_items": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab="bed_charge_items"
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/account/:accountId/invoices/create": ({
    facilityId,
    accountId,
  }) => (
    <FacilityLayout>
      <CreateInvoicePage facilityId={facilityId} accountId={accountId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/invoices": ({ facilityId }) => (
    <FacilityLayout>
      <InvoiceList facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/invoices/:invoiceId": ({
    facilityId,
    invoiceId,
  }) => (
    <FacilityLayout>
      <InvoiceShow facilityId={facilityId} invoiceId={invoiceId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/invoice/:invoiceId/print": ({
    facilityId,
    invoiceId,
  }) => (
    <FacilityLayout>
      <PrintInvoice facilityId={facilityId} invoiceId={invoiceId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/payments": ({ facilityId }) => (
    <FacilityLayout>
      <PaymentReconciliationList facilityId={facilityId} />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <FacilityLayout>
      <PaymentReconciliationShow
        facilityId={facilityId}
        paymentReconciliationId={paymentReconciliationId}
      />
    </FacilityLayout>
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId/print": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <FacilityLayout>
      <PrintPaymentReconciliation
        facilityId={facilityId}
        paymentReconciliationId={paymentReconciliationId}
      />
    </FacilityLayout>
  ),
};

export default FacilityRoutes;
