import { Redirect } from "raviger";

import BoardView from "@/components/Resource/ResourceBoard";
import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import ListView from "@/components/Resource/ResourceList";

import { AppRoutes } from "@/Routers/AppRouter";

const getDefaultView = () =>
  localStorage.getItem("defaultResourceView") === "list" ? "list" : "board";

const ResourceRoutes: AppRoutes = {
  "/resource": () => <Redirect to={`/resource/${getDefaultView()}`} />,
  "/resource/board": () => <BoardView />,
  "/resource/list": () => <ListView />,
  "/resource/:id": ({ id }) => <ResourceDetails id={id} />,
  "/resource/:id/update": ({ id }) => <ResourceDetailsUpdate id={id} />,
};

export default ResourceRoutes;
