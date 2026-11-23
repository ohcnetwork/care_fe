import careConfig from "@careConfig";
import { createFileRoute } from "@tanstack/react-router";

import { redirectKeepingQuery, staffOrPublic } from "@/lib/router/auth";
import { LandingPage } from "@/pages/Landing/LandingPage";
import UserDashboard from "@/pages/UserDashboard";
import { useArea } from "@/Routers/AreaChrome";

/** Shared URL: the staff dashboard, or the public landing page. */
export const Route = createFileRoute("/")({
  beforeLoad: (options) => {
    const context = staffOrPublic(options);
    if (context.area === "public" && careConfig.disablePatientLogin) {
      throw redirectKeepingQuery("/login", options.location);
    }
    return context;
  },
  staticData: { sidebar: false },
  component: RouteComponent,
});

function RouteComponent() {
  return useArea() === "app" ? <UserDashboard /> : <LandingPage />;
}
