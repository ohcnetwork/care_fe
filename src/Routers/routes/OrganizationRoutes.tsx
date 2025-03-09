import { AppRoutes } from "@/Routers/AppRouter";
import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";
import OrganizationIndex from "@/pages/Organization/OrganizationIndex";
import OrganizationPatients from "@/pages/Organization/OrganizationPatients";
import OrganizationUsers from "@/pages/Organization/OrganizationUsers";
import OrganizationView from "@/pages/Organization/OrganizationView";

const OrganizationRoutes: AppRoutes = {
  "/organization": () => <OrganizationIndex />,
  "/organization/:id/:page": ({ id, page }) => (
    <OrganizationView id={id} page={Number(page || 1)} />
  ),
  "/organization/:id/:page/users": ({ id, page }) => (
    <OrganizationUsers id={id} page={Number(page || 1)} />
  ),
  "/organization/:id/:page/patients": ({ id, page }) => (
    <OrganizationPatients id={id} page={Number(page || 1)} />
  ),
  "/organization/:id/:page/facilities": ({ id, page }) => (
    <OrganizationFacilities id={id} page={Number(page || 1)} />
  ),
  "/organization/:navOrganizationId/children/:id/:page": ({
    navOrganizationId,
    id,
    page,
  }) => (
    <OrganizationView
      navOrganizationId={navOrganizationId}
      id={id}
      page={Number(page || 1)}
    />
  ),
  "/organization/:navOrganizationId/children/:id/:page/users": ({
    navOrganizationId,
    id,
    page,
  }) => (
    <OrganizationUsers
      id={id}
      navOrganizationId={navOrganizationId}
      page={Number(page || 1)}
    />
  ),
  "/organization/:navOrganizationId/children/:id/:page/patients": ({
    navOrganizationId,
    id,
    page,
  }) => (
    <OrganizationPatients
      id={id}
      navOrganizationId={navOrganizationId}
      page={Number(page || 1)}
    />
  ),
  "/organization/:navOrganizationId/children/:id/:page/facilities": ({
    navOrganizationId,
    id,
    page,
  }) => (
    <OrganizationFacilities
      id={id}
      navOrganizationId={navOrganizationId}
      page={Number(page || 1)}
    />
  ),
};

export default OrganizationRoutes;
