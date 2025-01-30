import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ResourceList from "@/components/Resource/ResourceList";

import { AppRoutes } from "@/Routers/AppRouter";

const ResourceRoutes: AppRoutes = {
  "/resource": () => <ResourceList />,
  "/resource/:id": ({ id }) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }) => <ResourceDetailsUpdate id={id} />,
};

export default ResourceRoutes;
