import { Redirect } from "raviger";

import BoardView from "@/components/Resource/ResourceBoard";
import ResourceCreate from "@/components/Resource/ResourceCreate";
import ResourceDetails from "@/components/Resource/ResourceDetails";
// import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ListView from "@/components/Resource/ResourceList";

import { AppRoutes } from "@/Routers/AppRouter";

const getDefaultView = () =>
  localStorage.getItem("defaultResourceView") === "list" ? "list" : "board";

const ResourceRoutes: AppRoutes = {
  "/resource": () => <Redirect to={`/resource/${getDefaultView()}`} />,
  "/resource/board": () => <BoardView />,
  "/resource/list": () => <ListView />,
  "/resource/:id": ({ id }) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }) => (
    <ResourceCreate resourceId={id} facilityId={0} />
  ),
};

export default ResourceRoutes;
