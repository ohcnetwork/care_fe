import { AppRoutes } from "@/Routers/AppRouter";
import OrganizationFacilities from "@/pages/Organization/OrganizationFacilities";
import OrganizationIndex from "@/pages/Organization/OrganizationIndex";
import OrganizationPatients from "@/pages/Organization/OrganizationPatients";
import OrganizationUsers from "@/pages/Organization/OrganizationUsers";
import OrganizationView from "@/pages/Organization/OrganizationView";

const OrganizationRoutes: AppRoutes = {
  "/organization": () => <OrganizationIndex />,
  "/organization/:id": ({ id }) => <OrganizationView id={id} />,
  "/organization/:id/users": ({ id }) => <OrganizationUsers id={id} />,
  "/organization/:id/patients": ({ id }) => <OrganizationPatients id={id} />,
  "/organization/:id/facilities": ({ id }) => (
    <OrganizationFacilities id={id} />
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
};

export default OrganizationRoutes;
