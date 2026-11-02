import { AppRoutes } from "@/Routers/AppRouter";
import { lazyPage } from "@/Routers/lazyPage";

const PrintResourceLetter = lazyPage(
  () => import("@/components/Resource/PrintResourceLetter"),
);
const ResourceDetails = lazyPage(
  () => import("@/components/Resource/ResourceDetails"),
);
const ResourceForm = lazyPage(
  () => import("@/components/Resource/ResourceForm"),
);
const ResourceList = lazyPage(
  () => import("@/components/Resource/ResourceList"),
);

const ResourceRoutes: AppRoutes = {
  "/facility/:facilityId/resource": ({ facilityId }) => (
    <ResourceList facilityId={facilityId} />
  ),
  "/facility/:facilityId/resource/:id": ({ facilityId, id }) => (
    <ResourceDetails facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/resource/:id/update": ({ facilityId, id }) => (
    <ResourceForm facilityId={facilityId} id={id} />
  ),
  "/facility/:facilityId/resource/:id/print": ({ id }) => (
    <PrintResourceLetter id={id} />
  ),
};

export default ResourceRoutes;
