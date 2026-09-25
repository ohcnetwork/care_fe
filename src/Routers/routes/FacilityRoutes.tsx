import { Redirect } from "raviger";
import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";

const FacilityUsers = lazy(() => import("@/components/Facility/FacilityUsers"));
const ResourceCreate = lazy(() => import("@/components/Resource/ResourceForm"));
const MedicationDispenseRedirect = lazy(
  () =>
    import("@/pages/Facility/billing/account/components/MedicationDispenseRedirect"),
);
const BedAvailabilityDashboard = lazy(
  () => import("@/pages/Facility/BedAvailabilityDashboard"),
);
const TemplateBuilder = lazy(
  () => import("@/pages/Encounters/TemplateBuilder/TemplateBuilder"),
);
const TemplatePage = lazy(
  () => import("@/pages/Encounters/TemplateBuilder/TemplatePage"),
);
const AccountList = lazy(
  () => import("@/pages/Facility/billing/account/AccountList"),
);
const AccountShow = lazy(
  () => import("@/pages/Facility/billing/account/AccountShow"),
);
const CreateInvoicePage = lazy(
  () => import("@/pages/Facility/billing/account/CreateInvoice"),
);
const PrintChargeItems = lazy(() =>
  import("@/pages/Facility/billing/account/components/PrintChargeItems").then(
    (module) => ({ default: module.PrintChargeItems }),
  ),
);
const InvoiceList = lazy(
  () => import("@/pages/Facility/billing/invoice/InvoiceList"),
);
const InvoiceShow = lazy(
  () => import("@/pages/Facility/billing/invoice/InvoiceShow"),
);
const PrintInvoice = lazy(
  () => import("@/pages/Facility/billing/invoice/PrintInvoice"),
);
const PrintInvoices = lazy(
  () => import("@/pages/Facility/billing/invoice/PrintInvoices"),
);
const PaymentReconciliationList = lazy(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationList"),
);
const PaymentReconciliationShow = lazy(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PaymentReconciliationShow"),
);
const PrintPaymentReconciliation = lazy(
  () =>
    import("@/pages/Facility/billing/paymentReconciliation/PrintPaymentReconciliation"),
);
const LocationLayout = lazy(() =>
  import("@/pages/Facility/locations/LocationLayout").then((module) => ({
    default: module.LocationLayout,
  })),
);
const FacilityOverview = lazy(() =>
  import("@/pages/Facility/overview").then((module) => ({
    default: module.FacilityOverview,
  })),
);
const FacilityServices = lazy(
  () => import("@/pages/Facility/services/FacilityServices"),
);
const ServiceLayout = lazy(() =>
  import("@/pages/Facility/services/ServiceLayout").then((module) => ({
    default: module.ServiceLayout,
  })),
);
const DiagnosticReportPrint = lazy(
  () =>
    import("@/pages/Facility/services/diagnosticReports/DiagnosticReportPrint"),
);
const DiagnosticReportView = lazy(
  () =>
    import("@/pages/Facility/services/diagnosticReports/DiagnosticReportView"),
);
const ServiceRequestShow = lazy(
  () => import("@/pages/Facility/services/serviceRequests/ServiceRequestShow"),
);
const SettingsLayout = lazy(() =>
  import("@/pages/Facility/settings/layout").then((module) => ({
    default: module.SettingsLayout,
  })),
);

const FacilityRoutes: AppRoutes = {
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
    "/organization/organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId",
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
    "/organization/organizationId/patient/:patientId/diagnostic_reports/:diagnosticReportId/print",
  ].reduce((acc: AppRoutes, path) => {
    acc[path] = ({ patientId, diagnosticReportId }) => (
      <DiagnosticReportPrint
        patientId={patientId}
        diagnosticReportId={diagnosticReportId}
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
