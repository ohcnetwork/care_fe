import ResourceDetails from "../../Components/Resource/ResourceDetails";
import { ResourceDetailsUpdate } from "../../Components/Resource/ResourceDetailsUpdate";
import ListView from "../../Components/Resource/ListView";
import BoardView from "../../Components/Resource/ResourceBoardView";
import { Redirect } from "raviger";
import { AppRoutes } from "../AppRouter";

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
