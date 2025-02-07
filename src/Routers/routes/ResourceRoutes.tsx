import ResourceLayout from "@/components/Resource/ResourceLayout";

import { AppRoutes } from "@/Routers/AppRouter";

const ResourceRoutes: AppRoutes = {
  "/facility/:facilityId/resource*": ({ facilityId }) => (
    <ResourceLayout facilityId={facilityId} />
  ),
};

export default ResourceRoutes;
