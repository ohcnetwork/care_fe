import { Redirect, useRoutes } from "raviger";
import { Suspense } from "react";

import Loading from "@/components/Common/Loading";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { lazyPage } from "@/Routers/lazyPage";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

const DiscountCodeSettings = lazyPage(
  () =>
    import("@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeSettings"),
  "DiscountCodeSettings",
);
const DiscountComponentSettings = lazyPage(
  () =>
    import("@/pages/Facility/settings/billing/discount/discount-components/DiscountComponentSettings"),
  "DiscountComponentSettings",
);
const DiscountConfigurationSettings = lazyPage(
  () =>
    import("@/pages/Facility/settings/billing/discount/discount-configuration/DiscountConfigurationSettings"),
  "DiscountConfigurationSettings",
);
const TaxCodeSettings = lazyPage(
  () =>
    import("@/pages/Facility/settings/billing/tax/tax-codes/TaxCodeSettings"),
  "TaxCodeSettings",
);
const TaxComponentSettings = lazyPage(
  () =>
    import("@/pages/Facility/settings/billing/tax/tax-components/TaxComponentSettings"),
  "TaxComponentSettings",
);
const InformationalCodeSettings = lazyPage(
  () => import("./informational/InformationalCodeSettings"),
  "InformationalCodeSettings",
);
const BillingSettings = lazyPage(
  () => import("./settings/BillingSettings"),
  "BillingSettings",
);

export function BillingSettingsLayout() {
  const { facilityId } = useCurrentFacility();

  const basePath = `/facility/${facilityId}/settings/billing`;

  const routes = {
    "/": () => <Redirect to={`${basePath}/discount_codes`} />,
    "/discount_components": () => <DiscountComponentSettings />,
    "/discount_codes": () => <DiscountCodeSettings />,
    "/discount_configuration": () => <DiscountConfigurationSettings />,
    "/tax_codes": () => <TaxCodeSettings />,
    "/tax_components": () => <TaxComponentSettings />,
    "/informational_codes": () => <InformationalCodeSettings />,
    "/settings": () => <BillingSettings />,
    "*": () => <ErrorPage />,
  };

  const route = useRoutes(routes, {
    basePath,
    routeProps: { facilityId },
  });

  return (
    <div className="min-w-0">
      <Suspense fallback={<Loading />}>{route}</Suspense>
    </div>
  );
}
