import { Outlet } from "@tanstack/react-router";

/** Frame of the billing settings pages. */
export function BillingSettingsLayout() {
  return (
    <div className="min-w-0">
      <Outlet />
    </div>
  );
}
