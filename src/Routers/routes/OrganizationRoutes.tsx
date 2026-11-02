import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";

const OrganizationFacilities = lazyPage(
  () => import("@/pages/Organization/OrganizationFacilities"),
);
const OrganizationIndex = lazyPage(
  () => import("@/pages/Organization/OrganizationIndex"),
);
const OrganizationPatients = lazyPage(
  () => import("@/pages/Organization/OrganizationPatients"),
);
const OrganizationReferralAvailability = lazyPage(
  () => import("@/pages/Organization/OrganizationReferralAvailability"),
);
const OrganizationReferrals = lazyPage(
  () => import("@/pages/Organization/OrganizationReferrals"),
);
const OrganizationUsers = lazyPage(
  () => import("@/pages/Organization/OrganizationUsers"),
);
const OrganizationView = lazyPage(
  () => import("@/pages/Organization/OrganizationView"),
);
const ResponsibilityLanding = lazyPage(
  () => import("@/pages/Organization/ResponsibilityLanding"),
);

const OrganizationRoutes: AppRoutes = {
  "/organization": () => <OrganizationIndex />,
  "/organization/:id": ({ id }) => <OrganizationView id={id} />,
  "/organization/:id/users": ({ id }) => <OrganizationUsers id={id} />,
  "/organization/:id/patients": ({ id }) => <OrganizationPatients id={id} />,
  "/organization/:id/referrals": ({ id }) => <OrganizationReferrals id={id} />,
  "/organization/:id/settings/referrals": ({ id }) => (
    <OrganizationReferralAvailability id={id} />
  ),
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
  "/organization/:navOrganizationId/children/:id/referrals": ({
    navOrganizationId,
    id,
  }) => <OrganizationReferrals id={id} navOrganizationId={navOrganizationId} />,
  "/organization/:navOrganizationId/children/:id/settings/referrals": ({
    navOrganizationId,
    id,
  }) => (
    <OrganizationReferralAvailability
      id={id}
      navOrganizationId={navOrganizationId}
    />
  ),
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
  "/responsibilities/:id/referrals": ({ id }) => (
    <OrganizationReferrals id={id} routeContext="responsibility" />
  ),
  "/responsibilities/:id/settings/referrals": ({ id }) => (
    <OrganizationReferralAvailability id={id} routeContext="responsibility" />
  ),
};

export default OrganizationRoutes;
