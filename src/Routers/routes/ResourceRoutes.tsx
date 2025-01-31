import PrintResourceLetter from "@/components/Resource/PrintResourceLetter";
import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ResourceList from "@/components/Resource/ResourceList";

import { AppRoutes } from "@/Routers/AppRouter";

const ResourceRoutes: AppRoutes = {
  "/facility/:facilityId/resource": ({ facilityId }) => (
    <ResourceList facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/:id": ({ facilityId, id }) => (
    <ResourceDetails facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/resource/:id/update": ({ facilityId, id }) => (
    <ResourceDetailsUpdate facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/resource/:id/print": ({ id }) => (
    <PrintResourceLetter id={id} />
  ),
};

export default ResourceRoutes;
