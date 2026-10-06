import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";

const OrganizationFacilities = lazy(
  () => import("@/pages/Organization/OrganizationFacilities"),
);
const OrganizationIndex = lazy(
  () => import("@/pages/Organization/OrganizationIndex"),
);
const OrganizationPatients = lazy(
  () => import("@/pages/Organization/OrganizationPatients"),
);
const OrganizationUsers = lazy(
  () => import("@/pages/Organization/OrganizationUsers"),
);
const OrganizationView = lazy(
  () => import("@/pages/Organization/OrganizationView"),
);
const ResponsibilityLanding = lazy(
  () => import("@/pages/Organization/ResponsibilityLanding"),
);

const OrganizationRoutes: AppRoutes = {
  "/organization": () => <OrganizationIndex />,
  "/organization/:id": ({ id }) => <OrganizationView id={id} />,
  "/organization/:id/users": ({ id }) => <OrganizationUsers id={id} />,
  "/organization/:id/patients": ({ id }) => <OrganizationPatients id={id} />,
  "/organization/:id/facilities": ({ id }) => (
    <OrganizationFacilities id={id} />
  ),
  "/organization/:id/service_accounts": ({ id }) => (
    <OrganizationUsers id={id} isServiceAccount={true} />
  ),
  "/organization/:navOrganizationId/children/:id": ({
    navOrganizationId,
    id,
  }) => <OrganizationView id={id} navOrganizationId={navOrganizationId} />,
  "/organization/:navOrganizationId/children/:id/users": ({
    navOrganizationId,
    id,
  }) => <OrganizationUsers id={id} navOrganizationId={navOrganizationId} />,
  "/organization/:navOrganizationId/children/:id/patients": ({
    navOrganizationId,
    id,
  }) => <OrganizationPatients id={id} navOrganizationId={navOrganizationId} />,
  "/organization/:navOrganizationId/children/:id/facilities": ({
    navOrganizationId,
    id,
  }) => (
    <OrganizationFacilities id={id} navOrganizationId={navOrganizationId} />
  ),
  "/organization/:navOrganizationId/children/:id/service_accounts": ({
    navOrganizationId,
    id,
  }) => (
    <OrganizationUsers
      id={id}
      isServiceAccount={true}
      navOrganizationId={navOrganizationId}
    />
  ),

  // Responsibility routes (role orgs with scoped context)
  // Landing page checks permissions: admins see users, members see patients
  "/responsibilities/:id": ({ id }) => <ResponsibilityLanding id={id} />,
  "/responsibilities/:id/users": ({ id }) => (
    <OrganizationUsers id={id} routeContext="responsibility" />
  ),
  "/responsibilities/:id/patients": ({ id }) => (
    <OrganizationPatients id={id} routeContext="responsibility" />
  ),
};

export default OrganizationRoutes;
