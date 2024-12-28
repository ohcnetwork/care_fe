import { AppRoutes } from "@/Routers/AppRouter";
import OrganisationIndex from "@/pages/Organisation/OrganisationIndex";
import OrganisationUsers from "@/pages/Organisation/OrganisationUsers";
import OrganisationView from "@/pages/Organisation/OrganisationView";

const OrganisationRoutes: AppRoutes = {
  "/organisation": () => <OrganisationIndex />,
  "/organisation/:id": ({ id }) => <OrganisationView id={id} />,
  "/organisation/:id/users": ({ id }) => <OrganisationUsers id={id} />,
};

export default OrganisationRoutes;
