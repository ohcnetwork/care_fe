import ResourceDetails from "@/components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "@/components/Resource/ResourceDetailsUpdate";
import { Redirect } from "raviger";
import { AppRoutes } from "../AppRouter";
import BoardView from "@/components/Resource/ResourceBoard";
import ListView from "@/components/Resource/ResourceList";

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
