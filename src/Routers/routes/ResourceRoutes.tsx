import { lazy } from "react";

import type { AppRoutes } from "@/Routers/AppRouter";

const PrintResourceLetter = lazy(
  () => import("@/components/Resource/PrintResourceLetter"),
);
const ResourceDetails = lazy(
  () => import("@/components/Resource/ResourceDetails"),
);
const ResourceForm = lazy(() => import("@/components/Resource/ResourceForm"));
const ResourceList = lazy(() => import("@/components/Resource/ResourceList"));

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
