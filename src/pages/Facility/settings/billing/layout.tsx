import { Redirect, useRoutes } from "raviger";

import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";

import { DiscountCodeSettings } from "@/pages/Facility/settings/billing/discount/discount-codes/DiscountCodeSettings";
import { DiscountComponentSettings } from "@/pages/Facility/settings/billing/discount/discount-components/DiscountComponentSettings";
import { DiscountConfigurationSettings } from "@/pages/Facility/settings/billing/discount/discount-configuration/DiscountConfigurationSettings";
import { TaxCodeSettings } from "@/pages/Facility/settings/billing/tax/tax-codes/TaxCodeSettings";
import { TaxComponentSettings } from "@/pages/Facility/settings/billing/tax/tax-components/TaxComponentSettings";
import useCurrentFacility from "@/pages/Facility/utils/useCurrentFacility";

import { InformationalCodeSettings } from "./informational/InformationalCodeSettings";
import { BillingSettings } from "./settings/BillingSettings";

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

  return <div className="min-w-0">{route}</div>;
}
