import { AppRoutes } from "@/Routers/AppRouter";
import OrganizationIndex from "@/pages/Organization/OrganizationIndex";
import OrganizationUsers from "@/pages/Organization/OrganizationUsers";
import OrganizationView from "@/pages/Organization/OrganizationView";

const OrganizationRoutes: AppRoutes = {
  "/organization": () => <OrganizationIndex />,
  "/organization/:id": ({ id }) => <OrganizationView id={id} />,
  "/organization/:id/users": ({ id }) => <OrganizationUsers id={id} />,
  "/organization/:navOrganizationId/children/:id": ({
    navOrganizationId,
    id,
  }) => <OrganizationView id={id} navOrganizationId={navOrganizationId} />,
  "/organization/:navOrganizationId/children/:id/users": ({
    navOrganizationId,
    id,
  }) => <OrganizationUsers id={id} navOrganizationId={navOrganizationId} />,
};

export default OrganizationRoutes;
