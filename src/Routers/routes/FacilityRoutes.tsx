import { Redirect } from "raviger";

import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";

// The workspace layouts hold their own route maps of lazily loaded pages, so
// they are loaded only when one of their routes is visited.
const LocationLayout = lazyPage(
  () => import("@/pages/Facility/locations/LocationLayout"),
  "LocationLayout",
);
const ServiceLayout = lazyPage(
  () => import("@/pages/Facility/services/ServiceLayout"),
  "ServiceLayout",
);
const SettingsLayout = lazyPage(
  () => import("@/pages/Facility/settings/layout"),
  "SettingsLayout",
);

const FacilityReferrals = lazyPage(
  () => import("@/pages/Facility/referrals/FacilityReferrals"),
);
const FacilityUsers = lazyPage(
  () => import("@/components/Facility/FacilityUsers"),
);
const ResourceCreate = lazyPage(
  () => import("@/components/Resource/ResourceForm"),
);
const MedicationDispenseRedirect = lazyPage(
  () =>
    import("@/pages/Facility/billing/account/components/MedicationDispenseRedirect"),
);
const BedAvailabilityDashboard = lazyPage(
  () => import("@/pages/Facility/BedAvailabilityDashboard"),
);
const TemplateBuilder = lazyPage(
  () => import("@/pages/Encounters/TemplateBuilder/TemplateBuilder"),
);
const TemplatePage = lazyPage(
  () => import("@/pages/Encounters/TemplateBuilder/TemplatePage"),
);
const AccountList = lazyPage(
  () => import("@/pages/Facility/billing/account/AccountList"),
);
const AccountShow = lazyPage(
  () => import("@/pages/Facility/billing/account/AccountShow"),
);
const CreateInvoicePage = lazyPage(
  () => import("@/pages/Facility/billing/account/CreateInvoice"),
);
const PrintChargeItems = lazyPage(
  () => import("@/pages/Facility/billing/account/components/PrintChargeItems"),
  "PrintChargeItems",
);
const InvoiceList = lazyPage(
  () => import("@/pages/Facility/billing/invoice/InvoiceList"),
);
const InvoiceShow = lazyPage(
  () => import("@/pages/Facility/billing/invoice/InvoiceShow"),
);
const PrintInvoice = lazyPage(
  () => import("@/pages/Facility/billing/invoice/PrintInvoice"),
);
const PrintInvoices = lazyPage(
  () => import("@/pages/Facility/billing/invoice/PrintInvoices"),
);
const PaymentReconciliationList = lazyPage(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList"),
);
const PaymentReconciliationShow = lazyPage(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationShow"),
);
const PrintPaymentReconciliation = lazyPage(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PrintPaymentReconciliation"),
);
const FacilityOverview = lazyPage(
  () => import("@/pages/Facility/overview"),
  "FacilityOverview",
);
const FacilityServices = lazyPage(
  () => import("@/pages/Facility/services/FacilityServices"),
);
const DiagnosticReportPrint = lazyPage(
  () =>
    import("@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint"),
);
const DiagnosticReportView = lazyPage(
  () =>
    import("@/pages/Facility/services/diagnosticReports/DiagnosticReportView"),
);
const MultipleDiagnosticReportsPrint = lazyPage(
  () =>
    import("@/pages/Facility/services/diagnosticReports/MultipleDiagnosticReportsPrint"),
  "MultipleDiagnosticReportsPrint",
);
const ServiceRequestShow = lazyPage(
  () => import("@/pages/Facility/services/serviceRequests/ServiceRequestShow"),
);

const FacilityRoutes: AppRoutes = {
  "/facility/:facilityId/referrals": ({ facilityId }) => (
    <FacilityReferrals facilityId={facilityId} />
  ),
  "/facility": () => <Redirect to="/" />,
  "/facility/:facilityId/overview": ({ facilityId }) => (
    <FacilityOverview facilityId={facilityId} />
  ),
  "/facility/:facilityId/bed-availability": ({ facilityId }) => (
    <BedAvailabilityDashboard facilityId={facilityId} />
  ),
  "/facility/:facilityId/users": ({ facilityId }) => (
    <FacilityUsers facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/new": ({ facilityId }) => (
    <ResourceCreate facilityId={facilityId} />
  ),
  "/facility/:facilityId/settings*": ({ facilityId }) => (
    <SettingsLayout facilityId={facilityId} />
  ),
  "/facility/:facilityId/locations/:locationId*": ({
    facilityId,
    locationId,
  }) => <LocationLayout facilityId={facilityId} locationId={locationId} />,
  "/facility/:facilityId/services": ({ facilityId }) => (
    <FacilityServices facilityId={facilityId} />
  ),
  "/facility/:facilityId/services/:serviceId*": ({ facilityId, serviceId }) => (
    <ServiceLayout facilityId={facilityId} serviceId={serviceId} />
  ),
  "/facility/:facilityId/service_requests/:serviceRequestId": ({
    facilityId,
    serviceRequestId,
  }) => (
    <ServiceRequestShow
      facilityId={facilityId}
      serviceRequestId={serviceRequestId}
    />
  ),

  ...[
    "/facility/:facilityId/patient/:patientId/diagnostic_reports/:diagnosticReportId",
    "/organization/:organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ facilityId, patientId, diagnosticReportId }) => (
      <DiagnosticReportView
        patientId={patientId}
        facilityId={facilityId}
        diagnosticReportId={diagnosticReportId}
      />
    );
    return acc;
  }, {}),
  ...[
    "/facility/:facilityId/patient/:patientId/diagnostic_reports/:diagnosticReportId/print",
    "/organization/:organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ patientId, diagnosticReportId }) => (
      <DiagnosticReportPrint
        patientId={patientId}
        diagnosticReportId={diagnosticReportId}
      />
    );
    return acc;
  }, {}),
  ...[
    "/facility/:facilityId/patient/:patientId/service_request/:serviceRequestId/diagnostic_reports/print",
    "/organization/:organizationId/patient/:patientId/service_request/:serviceRequestId/diagnostic_reports/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ patientId, serviceRequestId }) => (
      <MultipleDiagnosticReportsPrint
        patientId={patientId}
        serviceRequestId={serviceRequestId}
      />
    );
    return acc;
  }, {}),
  "/facility/:facilityId/billing/account": ({ facilityId }) => (
    <AccountList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/account/:accountId": ({
    facilityId,
    accountId,
  }) => (
    <AccountShow facilityId={facilityId} accountId={accountId} tab="invoices" />
  ),
  "/facility/:facilityId/billing/account/:accountId/charge_items/print": ({
    facilityId,
    accountId,
  }) => <PrintChargeItems facilityId={facilityId} accountId={accountId} />,
  "/facility/:facilityId/billing/account/:accountId/:tab": ({
    facilityId,
    accountId,
    tab,
  }) => <AccountShow facilityId={facilityId} accountId={accountId} tab={tab} />,
  "/facility/:facilityId/billing/account/:accountId/:tab/payment/:paymentType":
    ({ facilityId, accountId, tab, paymentType }) => (
      <AccountShow
        facilityId={facilityId}
        accountId={accountId}
        tab={tab}
        paymentType={paymentType}
      />
    ),
  "/facility/:facilityId/billing/account/:accountId/invoices/create": ({
    facilityId,
    accountId,
  }) => <CreateInvoicePage facilityId={facilityId} accountId={accountId} />,
  "/facility/:facilityId/billing/invoices": ({ facilityId }) => (
    <InvoiceList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/invoices/:invoiceId": ({
    facilityId,
    invoiceId,
  }) => <InvoiceShow facilityId={facilityId} invoiceId={invoiceId} />,
  "/facility/:facilityId/billing/invoices/:invoiceId/pay": ({
    facilityId,
    invoiceId,
  }) => (
    <InvoiceShow
      facilityId={facilityId}
      invoiceId={invoiceId}
      paymentType="pay"
    />
  ),
  "/facility/:facilityId/billing/invoice/:invoiceId/print": ({
    facilityId,
    invoiceId,
  }) => <PrintInvoice facilityId={facilityId} invoiceId={invoiceId} />,
  "/facility/:facilityId/billing/invoices/:invoiceIds/print": ({
    facilityId,
    invoiceIds,
  }) => <PrintInvoices facilityId={facilityId} invoiceIds={invoiceIds} />,
  "/facility/:facilityId/billing/payments": ({ facilityId }) => (
    <PaymentReconciliationList facilityId={facilityId} />
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <PaymentReconciliationShow
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  ),
  "/facility/:facilityId/billing/payments/:paymentReconciliationId/print": ({
    facilityId,
    paymentReconciliationId,
  }) => (
    <PrintPaymentReconciliation
      facilityId={facilityId}
      paymentReconciliationId={paymentReconciliationId}
    />
  ),
  "/facility/:facilityId/template": ({ facilityId }) => (
    <TemplatePage facilityId={facilityId} />
  ),
  "/facility/:facilityId/template/builder": ({ facilityId }) => (
    <TemplateBuilder facilityId={facilityId} />
  ),
  "/facility/:facilityId/template/builder/:slug": ({ facilityId, slug }) => (
    <TemplateBuilder facilityId={facilityId} slug={slug} />
  ),
  "/facility/:facilityId/medication_dispense/redirect/:medicationDispenseId": ({
    facilityId,
    medicationDispenseId,
  }) => (
    <MedicationDispenseRedirect
      facilityId={facilityId}
      medicationDispenseId={medicationDispenseId}
    />
  ),
};

export default FacilityRoutes;
