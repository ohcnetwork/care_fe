import { usePath, useRoutes } from "raviger";

import PrintResourceLetter from "@/components/Resource/PrintResourceLetter";
import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ResourceList from "@/components/Resource/ResourceList";

import { BreadcrumbsProvider } from "@/context/BreadcrumbsContext";

const getRoutes = (facilityId: string) => {
  return {
    [`/facility/${facilityId}/resource`]: () => (
      <ResourceList facilityId={facilityId} />
    ),
    [`/facility/${facilityId}/resource/:id`]: () => {
      return <ResourceDetails />;
    },
    [`/facility/${facilityId}/resource/:id/update`]: ({
      id = "",
    }: {
      id?: string;
    }) => {
      return <ResourceDetailsUpdate facilityId={facilityId} id={id} />;
    },
    [`/facility/${facilityId}/resource/:id/print`]: () => {
      return <PrintResourceLetter />;
    },
  };
};

const ResourceLayout = ({ facilityId }: { facilityId: string }) => {
  const routeResult = useRoutes(getRoutes(facilityId));
  const path = usePath(); // Get the current route path
  const resourceIdMatch = path?.match(/\/facility\/[^/]+\/resource\/([^/]+)/);
  const resourceId = resourceIdMatch ? resourceIdMatch[1] : "";

  return (
    <BreadcrumbsProvider facilityId={facilityId} id={resourceId}>
      <div>{routeResult}</div>
    </BreadcrumbsProvider>
  );
};

export default ResourceLayout;
