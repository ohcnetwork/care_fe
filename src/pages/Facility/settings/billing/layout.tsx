import { Outlet, useLocation } from "@tanstack/react-router";
import { RouterProvider as RavigerBasePathProvider } from "raviger";

/**
 * Frame of the billing settings pages. These pages (and the components inside
 * them) write links and `navigate()` calls relative to the billing base path,
 * as the old nested `useRoutes` table did. This layout keeps that context.
 */
export function BillingSettingsLayout({ facilityId }: { facilityId: string }) {
  const { pathname } = useLocation();
  const basePath = `/facility/${facilityId}/settings/billing`;
  const relativePath =
    pathname.replace(new RegExp(`^${basePath}`, "i"), "") || "/";

  return (
    <RavigerBasePathProvider basePath={basePath} path={relativePath}>
      <div className="min-w-0">
        <Outlet />
      </div>
    </RavigerBasePathProvider>
  );
}
